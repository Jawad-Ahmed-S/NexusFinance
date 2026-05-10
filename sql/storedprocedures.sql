use nexusfinance;

DELIMITER $$

DROP PROCEDURE IF EXISTS transfer_funds$$

CREATE PROCEDURE transfer_funds(
    IN  p_from_account_id INT,
    IN  p_to_account_id   INT,
    IN  p_amount          DECIMAL(15,2),
    OUT p_status          VARCHAR(10),
    OUT p_message         VARCHAR(255)
)
BEGIN

    DECLARE sender_balance  DECIMAL(15,2);
    DECLARE sender_status   VARCHAR(10);
    DECLARE receiver_status VARCHAR(10);

    DECLARE sender_type   VARCHAR(20);
    DECLARE receiver_type VARCHAR(20);

    DECLARE sender_name   VARCHAR(100);
    DECLARE receiver_name VARCHAR(100);

    DECLARE sender_note   VARCHAR(255);
    DECLARE receiver_note VARCHAR(255);

    DECLARE v_debit_txn_id  INT;
    DECLARE v_credit_txn_id INT;

    DECLARE v_count INT DEFAULT 0;

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SET p_status = 'ERROR';
        SET p_message = 'Database error';
    END;

    SET p_status = 'START';
    SET p_message = 'Procedure started';

    START TRANSACTION;

    IF p_amount <= 0 THEN
        ROLLBACK;
        SET p_status = 'ERROR';
        SET p_message = 'Invalid amount';

    ELSEIF p_from_account_id = p_to_account_id THEN
        ROLLBACK;
        SET p_status = 'ERROR';
        SET p_message = 'Same account';

    ELSE

        SELECT 1 FROM accounts
        WHERE account_id = LEAST(p_from_account_id, p_to_account_id)
        FOR UPDATE;

        SELECT 1 FROM accounts
        WHERE account_id = GREATEST(p_from_account_id, p_to_account_id)
        FOR UPDATE;

        SELECT COUNT(*) INTO v_count
        FROM accounts
        WHERE account_id IN (p_from_account_id, p_to_account_id);

        IF v_count < 2 THEN
            ROLLBACK;
            SET p_status = 'ERROR';
            SET p_message = 'Account not found';

        ELSE

            SELECT balance, status, account_type
            INTO sender_balance, sender_status, sender_type
            FROM accounts
            WHERE account_id = p_from_account_id;

            SELECT status, account_type
            INTO receiver_status, receiver_type
            FROM accounts
            WHERE account_id = p_to_account_id;

            IF sender_status != 'active' THEN
                ROLLBACK;
                SET p_status = 'ERROR';
                SET p_message = 'Sender inactive';

            ELSEIF receiver_status != 'active' THEN
                ROLLBACK;
                SET p_status = 'ERROR';
                SET p_message = 'Receiver inactive';

            ELSEIF sender_type != 'wadi_ah' OR receiver_type != 'wadi_ah' THEN
                ROLLBACK;
                SET p_status = 'ERROR';
                SET p_message = 'Wadiah only';

            ELSEIF sender_balance < p_amount THEN
                ROLLBACK;
                SET p_status = 'ERROR';
                SET p_message = 'Insufficient funds';

            ELSE

                SET sender_name = (
                    SELECT IFNULL(full_name, 'Unknown')
                    FROM customer_accounts_view
                    WHERE account_id = p_from_account_id
                    LIMIT 1
                );

                SET receiver_name = (
                    SELECT IFNULL(full_name, 'Unknown')
                    FROM customer_accounts_view
                    WHERE account_id = p_to_account_id
                    LIMIT 1
                );

                SET sender_note = CONCAT('Transfer to ', receiver_name);
                SET receiver_note = CONCAT('Transfer from ', sender_name);

                UPDATE accounts
                SET balance = balance - p_amount
                WHERE account_id = p_from_account_id;

                UPDATE accounts
                SET balance = balance + p_amount
                WHERE account_id = p_to_account_id;

                INSERT INTO transaction_ledger
                (account_id, amount, direction, txn_type, reference_note)
                VALUES
                (p_from_account_id, p_amount, 'debit', 'transfer', sender_note);

                SET v_debit_txn_id = LAST_INSERT_ID();

                INSERT INTO transaction_ledger
                (account_id, amount, direction, txn_type, reference_note)
                VALUES
                (p_to_account_id, p_amount, 'credit', 'transfer', receiver_note);

                SET v_credit_txn_id = LAST_INSERT_ID();

                INSERT INTO txn_pair
                (debit_txn_id, credit_txn_id, pair_type)
                VALUES
                (v_debit_txn_id, v_credit_txn_id, 'transfer');

                COMMIT;

                SET p_status = 'SUCCESS';
                SET p_message = 'Transfer complete';

            END IF;
        END IF;
    END IF;

END$$

DELIMITER ;



DELIMITER $$

-- ============================================================
-- 1. create_mudarabah_cycle
-- Opens a new cycle for the coming month
-- Fails if a cycle already exists for that month
-- ============================================================

DROP PROCEDURE IF EXISTS create_mudarabah_cycle$$

CREATE PROCEDURE create_mudarabah_cycle(
    IN  p_cycle_month   DATE,
    OUT p_status        VARCHAR(10),
    OUT p_message       VARCHAR(255)
)
BEGIN
    DECLARE v_exists INT DEFAULT 0;

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SET p_status  = 'ERROR';
        SET p_message = 'Database error occurred';
    END;

    -- normalize to first of month regardless of what date was passed
    SET p_cycle_month = MAKEDATE(YEAR(p_cycle_month), 1) + INTERVAL (MONTH(p_cycle_month) - 1) MONTH;

    -- check no cycle exists for this month
    SELECT COUNT(*) INTO v_exists
    FROM mudarabah_cycle
    WHERE cycle_month = p_cycle_month;

    IF v_exists > 0 THEN
        SET p_status  = 'ERROR';
        SET p_message = 'Cycle already exists for this month';
    ELSE
        START TRANSACTION;

        INSERT INTO mudarabah_cycle (cycle_month, pool_total, status, open_at)
        VALUES (p_cycle_month, 0.00, 'open', NOW());

        COMMIT;

        SET p_status  = 'SUCCESS';
        SET p_message = CONCAT('Cycle opened for ', DATE_FORMAT(p_cycle_month, '%M %Y'));
    END IF;

END$$


-- ============================================================
-- 2. lock_mudarabah_cycle
-- Freezes the cycle + snapshots all Mudarabah balances
-- + computes each account share percent
-- No deposits or withdrawals allowed after this
-- ============================================================

DROP PROCEDURE IF EXISTS lock_mudarabah_cycle$$

CREATE PROCEDURE lock_mudarabah_cycle(
    IN  p_cycle_month   DATE,
    OUT p_status        VARCHAR(10),
    OUT p_message       VARCHAR(255)
)
BEGIN
    DECLARE v_cycle_id      INT;
    DECLARE v_cycle_status  VARCHAR(10);
    DECLARE v_pool_total    DECIMAL(15,2) DEFAULT 0.00;
    DECLARE v_account_id    INT;
    DECLARE v_balance       DECIMAL(15,2);
    DECLARE v_share         DECIMAL(8,6);
    DECLARE v_done          BOOLEAN DEFAULT FALSE;

    DECLARE cur_accounts CURSOR FOR
        SELECT a.account_id, a.balance
        FROM accounts a
        WHERE a.account_type = 'mudarabah'
          AND a.status = 'active'
          AND a.balance > 0;

    DECLARE CONTINUE HANDLER FOR NOT FOUND SET v_done = TRUE;

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SET p_status  = 'ERROR';
        SET p_message = 'Database error occurred';
    END;

    SET p_cycle_month = MAKEDATE(YEAR(p_cycle_month), 1) + INTERVAL (MONTH(p_cycle_month) - 1) MONTH;

    -- validate cycle exists and is open
    SELECT cycle_id, status INTO v_cycle_id, v_cycle_status
    FROM mudarabah_cycle
    WHERE cycle_month = p_cycle_month;

    IF v_cycle_id IS NULL THEN
        SET p_status  = 'ERROR';
        SET p_message = 'No cycle found for this month';

    ELSEIF v_cycle_status != 'open' THEN
        SET p_status  = 'ERROR';
        SET p_message = CONCAT('Cycle is already ', v_cycle_status);

    ELSE
        START TRANSACTION;

        -- compute pool total from all active mudarabah accounts
        SELECT COALESCE(SUM(a.balance), 0) INTO v_pool_total
        FROM accounts a
        WHERE a.account_type = 'mudarabah'
          AND a.status = 'active'
          AND a.balance > 0;

        IF v_pool_total = 0 THEN
            ROLLBACK;
            SET p_status  = 'ERROR';
            SET p_message = 'Pool total is zero — no active Mudarabah accounts with balance';
        ELSE
            -- update cycle with pool total and freeze it
            UPDATE mudarabah_cycle
            SET pool_total  = v_pool_total,
                status      = 'frozen',
                frozen_at   = NOW()
            WHERE cycle_id = v_cycle_id;

            -- snapshot each account balance and compute share
            OPEN cur_accounts;

            read_loop: LOOP
                FETCH cur_accounts INTO v_account_id, v_balance;
                IF v_done THEN
                    LEAVE read_loop;
                END IF;

                SET v_share = v_balance / v_pool_total;

                INSERT INTO mudarabah_cycle_entry
                    (cycle_id, account_id, balance_at_freeze, share_percent, settled)
                VALUES
                    (v_cycle_id, v_account_id, v_balance, v_share, FALSE);

            END LOOP;

            CLOSE cur_accounts;

            COMMIT;

            SET p_status  = 'SUCCESS';
            SET p_message = CONCAT('Cycle locked. Pool total: ', v_pool_total);
        END IF;
    END IF;

END$$


-- ============================================================
-- 3. settle_mudarabah_cycle
-- Admin enters profit or loss percent
-- System calculates per account profit/loss
-- Updates balances + inserts ledger entries + closes cycle
-- p_profit_loss_percent: positive = profit, negative = loss
-- ============================================================

DROP PROCEDURE IF EXISTS settle_mudarabah_cycle$$

CREATE PROCEDURE settle_mudarabah_cycle(
    IN  p_cycle_month           DATE,
    IN  p_profit_loss_percent   DECIMAL(8,4),
    OUT p_status                VARCHAR(10),
    OUT p_message               VARCHAR(255)
)
BEGIN
    DECLARE v_cycle_id          INT;
    DECLARE v_cycle_status      VARCHAR(10);
    DECLARE v_pool_total        DECIMAL(15,2);
    DECLARE v_pool_pl_amount    DECIMAL(15,2);
    DECLARE v_entry_id          INT;
    DECLARE v_account_id        INT;
    DECLARE v_share_percent     DECIMAL(8,6);
    DECLARE v_pl_amount         DECIMAL(15,2);
    DECLARE v_txn_type          VARCHAR(30);
    DECLARE v_direction         VARCHAR(10);
    DECLARE v_note              VARCHAR(255);
    DECLARE v_done              BOOLEAN DEFAULT FALSE;

    DECLARE cur_entries CURSOR FOR
        SELECT entry_id, account_id, share_percent
        FROM mudarabah_cycle_entry
        WHERE cycle_id = v_cycle_id
          AND settled  = FALSE;

    DECLARE CONTINUE HANDLER FOR NOT FOUND SET v_done = TRUE;

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SET p_status  = 'ERROR';
        SET p_message = 'Database error occurred';
    END;

    SET p_cycle_month = MAKEDATE(YEAR(p_cycle_month), 1) + INTERVAL (MONTH(p_cycle_month) - 1) MONTH;

    -- validate cycle exists and is frozen
    SELECT cycle_id, status, pool_total INTO v_cycle_id, v_cycle_status, v_pool_total
    FROM mudarabah_cycle
    WHERE cycle_month = p_cycle_month;

    IF v_cycle_id IS NULL THEN
        SET p_status  = 'ERROR';
        SET p_message = 'No cycle found for this month';

    ELSEIF v_cycle_status != 'frozen' THEN
        SET p_status  = 'ERROR';
        SET p_message = CONCAT('Cycle must be frozen to settle. Current status: ', v_cycle_status);

    ELSE
        START TRANSACTION;

        -- total pool profit or loss amount
        SET v_pool_pl_amount = v_pool_total * (p_profit_loss_percent / 100);

        -- determine txn_type and direction based on profit or loss
        IF p_profit_loss_percent >= 0 THEN
            SET v_txn_type  = 'profit_distribution';
            SET v_direction = 'credit';
        ELSE
            SET v_txn_type  = 'profit_distribution';
            SET v_direction = 'debit';
        END IF;

        -- update cycle record
        UPDATE mudarabah_cycle
        SET profit_loss_percent = p_profit_loss_percent,
            profit_loss_amount  = v_pool_pl_amount,
            status              = 'settled',
            settled_at          = NOW()
        WHERE cycle_id = v_cycle_id;

        -- process each account entry
        OPEN cur_entries;

        entry_loop: LOOP
            FETCH cur_entries INTO v_entry_id, v_account_id, v_share_percent;
            IF v_done THEN
                LEAVE entry_loop;
            END IF;

            -- this account's profit or loss
            SET v_pl_amount = ABS(v_pool_pl_amount) * v_share_percent;

            SET v_note = CONCAT(
                IF(p_profit_loss_percent >= 0, 'Mudarabah profit', 'Mudarabah loss'),
                ' — ',
                DATE_FORMAT(p_cycle_month, '%M %Y'),
                ' (',
                ROUND(p_profit_loss_percent, 2),
                '%)'
            );

            -- update account balance
            IF p_profit_loss_percent >= 0 THEN
                UPDATE accounts
                SET balance = balance + v_pl_amount
                WHERE account_id = v_account_id;
            ELSE
                UPDATE accounts
                SET balance = GREATEST(balance - v_pl_amount, 0)
                WHERE account_id = v_account_id;
            END IF;

            -- insert ledger entry
            INSERT INTO transaction_ledger
                (account_id, amount, direction, txn_type, reference_note)
            VALUES
                (v_account_id, v_pl_amount, v_direction, v_txn_type, v_note);

            -- mark entry as settled with its amount
            UPDATE mudarabah_cycle_entry
            SET profit_loss_amount  = v_pl_amount,
                settled             = TRUE
            WHERE entry_id = v_entry_id;

        END LOOP;

        CLOSE cur_entries;

        COMMIT;

        SET p_status  = 'SUCCESS';
        SET p_message = CONCAT(
            'Cycle settled. Pool ',
            IF(p_profit_loss_percent >= 0, 'profit', 'loss'),
            ': PKR ', ABS(v_pool_pl_amount),
            ' distributed across all accounts'
        );
    END IF;

END$$

DELIMITER ;