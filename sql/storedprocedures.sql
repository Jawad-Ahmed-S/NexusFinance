
DROP PROCEDURE tranfer_funds;

DELIMITER $$
CREATE PROCEDURE transfer_funds(
    IN  p_from_account_id INT,
    IN  p_to_account_id   INT,
    IN  p_amount          DECIMAL(15,2),
    IN  p_reference_note  VARCHAR(255),
    IN  receiver_note  VARCHAR(255),
    OUT p_status          VARCHAR(10),
    OUT p_message         VARCHAR(255)
    
)
BEGIN
    DECLARE sender_balance  DECIMAL(15,2);
    DECLARE sender_status   VARCHAR(10);
    DECLARE debit_txn_id    INT;
    DECLARE credit_txn_id   INT;
    DECLARE sender_name   VARCHAR(100);
	DECLARE receiver_name VARCHAR(100);
    
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SET p_status  = 'ERROR';
        SET p_message = 'Database error occurred';
    END;
    START TRANSACTION;
    
    
    SELECT 1 FROM accounts 
	WHERE account_id = LEAST(p_from_account_id, p_to_account_id) FOR UPDATE;
	SELECT 1 FROM accounts 
	WHERE account_id = GREATEST(p_from_account_id, p_to_account_id) FOR UPDATE;
	
    
    
	SELECT balance, status INTO sender_balance, sender_status
	FROM accounts WHERE account_id = p_from_account_id;
    IF sender_status != 'active' THEN
        ROLLBACK;
        SET p_status  = 'ERROR';
        SET p_message = 'Account inactive';
    ELSEIF sender_balance < p_amount THEN
        ROLLBACK;
        SET p_status  = 'ERROR';
        SET p_message = 'Insufficient funds';
    ELSE
        UPDATE accounts SET balance = balance - p_amount WHERE account_id = p_from_account_id;
        UPDATE accounts SET balance = balance + p_amount WHERE account_id = p_to_account_id;
        
        SELECT full_name INTO sender_name
		FROM customer_accounts_view
		WHERE account_id = p_from_account_id;
        
        
        SELECT full_name INTO receiver_name
		FROM customer_accounts_view
		WHERE account_id = p_to_account_id;
        
        SET p_reference_note = CONCAT('Transfer to account ', receiver_name);
        
        INSERT INTO transaction_ledger (account_id, amount, direction, txn_type, reference_note)
        VALUES (p_from_account_id, p_amount, 'debit', 'transfer', p_reference_note);
        SET debit_txn_id = LAST_INSERT_ID();
        SET receiver_note = CONCAT('Transfer from account ', sender_name);
        INSERT INTO transaction_ledger (account_id, amount, direction, txn_type, reference_note)
        VALUES (p_to_account_id, p_amount, 'credit', 'transfer', receiver_note);
        SET credit_txn_id = LAST_INSERT_ID();
        INSERT INTO txn_pair (debit_txn_id, credit_txn_id, pair_type)
        VALUES (debit_txn_id, credit_txn_id, 'transfer');
        COMMIT;
        SET p_status  = 'SUCCESS';
        SET p_message = 'Transfer complete';
    END IF;
END$$
DELIMITER ;

select * from account_statement_view where account_id = 1;

CALL transfer_funds(1, 5, 50000.00, 'Test transfer', @status, @message);
SELECT @status, @message;

