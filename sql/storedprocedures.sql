use nexusfinance;

DELIMITER $$

DROP PROCEDURE IF EXISTS transfer_funds$$


CREATE PROCEDURE transfer_funds(
    IN p_from_account_id INT,
    IN p_to_account_id   INT,
    IN p_amount          DECIMAL(15,2)
)
BEGIN
    DECLARE v_status VARCHAR(10);
    DECLARE v_message VARCHAR(255);

    DECLARE v_sender_balance DECIMAL(15,2);
    DECLARE v_sender_status VARCHAR(10);
    DECLARE v_receiver_status VARCHAR(10);
    DECLARE v_sender_type VARCHAR(20);
    DECLARE v_receiver_type VARCHAR(20);

    DECLARE v_err_no INT;
    DECLARE v_err_msg TEXT;

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;

        GET DIAGNOSTICS CONDITION 1
            v_err_no = MYSQL_ERRNO,
            v_err_msg = MESSAGE_TEXT;

        SELECT
            'ERROR' AS status,
            CONCAT(v_err_no, ' - ', v_err_msg) AS message;
    END;

    START TRANSACTION;

    IF p_amount <= 0 THEN
        ROLLBACK;
        SELECT 'ERROR' AS status, 'Invalid amount' AS message;

    ELSEIF p_from_account_id = p_to_account_id THEN
        ROLLBACK;
        SELECT 'ERROR' AS status, 'Same account transfer not allowed' AS message;

    ELSE

        -- lock accounts (deadlock-safe ordering)
        SELECT balance, status, account_type
        INTO v_sender_balance, v_sender_status, v_sender_type
        FROM accounts
        WHERE account_id = p_from_account_id
        FOR UPDATE;

        SELECT status, account_type
        INTO v_receiver_status, v_receiver_type
        FROM accounts
        WHERE account_id = p_to_account_id
        FOR UPDATE;

        IF v_sender_status != 'active' THEN
            ROLLBACK;
            SELECT 'ERROR' AS status, 'Sender inactive' AS message;

        ELSEIF v_receiver_status != 'active' THEN
            ROLLBACK;
            SELECT 'ERROR' AS status, 'Receiver inactive' AS message;

        ELSEIF v_sender_type != 'wadi_ah' OR v_receiver_type != 'wadi_ah' THEN
            ROLLBACK;
            SELECT 'ERROR' AS status, 'Wadiah accounts only' AS message;

        ELSEIF v_sender_balance < p_amount THEN
            ROLLBACK;
            SELECT 'ERROR' AS status, 'Insufficient funds' AS message;

        ELSE

            UPDATE accounts
            SET balance = balance - p_amount
            WHERE account_id = p_from_account_id;

            UPDATE accounts
            SET balance = balance + p_amount
            WHERE account_id = p_to_account_id;

            INSERT INTO transaction_ledger
                (account_id, amount, direction, txn_type, reference_note)
            VALUES
                (p_from_account_id, p_amount, 'debit', 'transfer', 'Transfer out');

            INSERT INTO transaction_ledger
                (account_id, amount, direction, txn_type, reference_note)
            VALUES
                (p_to_account_id, p_amount, 'credit', 'transfer', 'Transfer in');

            COMMIT;

            SELECT 'SUCCESS' AS status, 'Transfer completed successfully' AS message;

        END IF;
    END IF;

END$$

-- ============================================================
-- 1. create_mudarabah_cycle
-- Opens a new cycle for the coming month
-- Fails if a cycle already exists for that month
-- ============================================================
CREATE PROCEDURE create_mudarabah_cycle(
    IN  p_cycle_month   DATE,
    OUT p_status        VARCHAR(10),
    OUT p_message       VARCHAR(255)
)
BEGIN
    DECLARE v_err_no INT;
    DECLARE v_err_msg TEXT;

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        GET DIAGNOSTICS CONDITION 1
            v_err_no = MYSQL_ERRNO,
            v_err_msg = MESSAGE_TEXT;

        ROLLBACK;

        SET p_status = 'ERROR';
        SET p_message = CONCAT(v_err_no, ' - ', v_err_msg);
    END;

    -- normalize to first day of month
    SET p_cycle_month = DATE_FORMAT(p_cycle_month, '%Y-%m-01');

    START TRANSACTION;

    -- lock possible duplicate row space (prevents race condition)
    SELECT cycle_id
    FROM mudarabah_cycle
    WHERE cycle_month = p_cycle_month
    FOR UPDATE;

    -- check existence safely after lock
    IF EXISTS (
        SELECT 1
        FROM mudarabah_cycle
        WHERE cycle_month = p_cycle_month
    ) THEN

        ROLLBACK;
        SET p_status  = 'ERROR';
        SET p_message = 'Cycle already exists for this month';

    ELSE

        INSERT INTO mudarabah_cycle (
            cycle_month,
            pool_total,
            status,
            open_at
        )
        VALUES (
            p_cycle_month,
            0.00,
            'open',
            NOW()
        );

        COMMIT;

        SET p_status  = 'SUCCESS';
        SET p_message = CONCAT(
            'Cycle opened for ',
            DATE_FORMAT(p_cycle_month, '%M %Y')
        );

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

    DECLARE v_done BOOLEAN DEFAULT FALSE;

    DECLARE v_err_no INT;
    DECLARE v_err_msg TEXT;

    DECLARE cur_accounts CURSOR FOR
        SELECT a.account_id, a.balance
        FROM accounts a
        WHERE a.account_type = 'mudarabah'
          AND a.status = 'active'
          AND a.balance > 0
        FOR UPDATE;

    DECLARE CONTINUE HANDLER FOR NOT FOUND SET v_done = TRUE;

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        GET DIAGNOSTICS CONDITION 1
            v_err_no = MYSQL_ERRNO,
            v_err_msg = MESSAGE_TEXT;

        ROLLBACK;

        SET p_status = 'ERROR';
        SET p_message = CONCAT(v_err_no, ' - ', v_err_msg);
    END;

    -- normalize month
    SET p_cycle_month = DATE_FORMAT(p_cycle_month, '%Y-%m-01');

    -- prevent multiple rows issue
    SELECT cycle_id, status
    INTO v_cycle_id, v_cycle_status
    FROM mudarabah_cycle
    WHERE cycle_month = p_cycle_month
    LIMIT 1;

    IF v_cycle_id IS NULL THEN
        SET p_status  = 'ERROR';
        SET p_message = 'No cycle found for this month';

    ELSEIF v_cycle_status != 'open' THEN
        SET p_status  = 'ERROR';
        SET p_message = CONCAT('Cycle is already ', v_cycle_status);

    ELSE
        START TRANSACTION;

        -- lock cycle row (important for concurrency)
        SELECT cycle_id
        FROM mudarabah_cycle
        WHERE cycle_id = v_cycle_id
        FOR UPDATE;

        -- compute pool total
        SELECT COALESCE(SUM(balance), 0)
        INTO v_pool_total
        FROM accounts
        WHERE account_type = 'mudarabah'
          AND status = 'active'
          AND balance > 0;

        IF v_pool_total = 0 THEN
            ROLLBACK;
            SET p_status  = 'ERROR';
            SET p_message = 'Pool total is zero';
        ELSE

            UPDATE mudarabah_cycle
            SET pool_total = v_pool_total,
                status     = 'frozen',
                frozen_at  = NOW()
            WHERE cycle_id = v_cycle_id;

            SET v_done = FALSE;  

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

    DECLARE v_done BOOLEAN DEFAULT FALSE;

    DECLARE v_err_no INT;
    DECLARE v_err_msg TEXT;

    DECLARE cur_entries CURSOR FOR
        SELECT entry_id, account_id, share_percent
        FROM mudarabah_cycle_entry
        WHERE cycle_id = v_cycle_id
          AND settled  = FALSE;

    DECLARE CONTINUE HANDLER FOR NOT FOUND SET v_done = TRUE;

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        GET DIAGNOSTICS CONDITION 1
            v_err_no = MYSQL_ERRNO,
            v_err_msg = MESSAGE_TEXT;

        ROLLBACK;

        SET p_status = 'ERROR';
        SET p_message = CONCAT(v_err_no, ' - ', v_err_msg);
    END;

    -- normalize month
    SET p_cycle_month = DATE_FORMAT(p_cycle_month, '%Y-%m-01');

    -- fetch cycle safely
    SELECT cycle_id, status, pool_total
    INTO v_cycle_id, v_cycle_status, v_pool_total
    FROM mudarabah_cycle
    WHERE cycle_month = p_cycle_month
    LIMIT 1;

    IF v_cycle_id IS NULL THEN
        SET p_status  = 'ERROR';
        SET p_message = 'No cycle found';

    ELSEIF v_cycle_status != 'frozen' THEN
        SET p_status  = 'ERROR';
        SET p_message = CONCAT('Cycle must be frozen. Current: ', v_cycle_status);

    ELSE
        START TRANSACTION;

        -- lock cycle row (IMPORTANT)
        SELECT cycle_id
        FROM mudarabah_cycle
        WHERE cycle_id = v_cycle_id
        FOR UPDATE;

        SET v_done = FALSE;

        SET v_pool_pl_amount = v_pool_total * (p_profit_loss_percent / 100);

        IF p_profit_loss_percent >= 0 THEN
            SET v_txn_type  = 'profit_distribution';
            SET v_direction = 'credit';
        ELSE
            SET v_txn_type  = 'loss_distribution';
            SET v_direction = 'debit';
        END IF;

        UPDATE mudarabah_cycle
        SET profit_loss_percent = p_profit_loss_percent,
            profit_loss_amount  = v_pool_pl_amount,
            status              = 'settled',
            settled_at          = NOW()
        WHERE cycle_id = v_cycle_id;

        OPEN cur_entries;

        entry_loop: LOOP
            FETCH cur_entries INTO v_entry_id, v_account_id, v_share_percent;

            IF v_done THEN
                LEAVE entry_loop;
            END IF;

            SET v_pl_amount = ABS(v_pool_pl_amount) * v_share_percent;

            SET v_note = CONCAT(
                IF(p_profit_loss_percent >= 0, 'Profit', 'Loss'),
                ' Mudarabah - ',
                DATE_FORMAT(p_cycle_month, '%M %Y')
            );

            UPDATE accounts
            SET balance = balance + (CASE 
                                        WHEN p_profit_loss_percent >= 0 THEN v_pl_amount
                                        ELSE -v_pl_amount
                                     END)
            WHERE account_id = v_account_id;

            INSERT INTO transaction_ledger
                (account_id, amount, direction, txn_type, reference_note)
            VALUES
                (v_account_id, v_pl_amount, v_direction, v_txn_type, v_note);

            UPDATE mudarabah_cycle_entry
            SET profit_loss_amount = v_pl_amount,
                settled = TRUE
            WHERE entry_id = v_entry_id;

        END LOOP;

        CLOSE cur_entries;

        COMMIT;

        SET p_status = 'SUCCESS';
        SET p_message = CONCAT(
            'Cycle settled. Total ',
            IF(p_profit_loss_percent >= 0, 'profit', 'loss'),
            ': ', ABS(v_pool_pl_amount)
        );
    END IF;

END$$