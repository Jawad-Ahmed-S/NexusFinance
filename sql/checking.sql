
select * from account_statement_view where account_id = 1;
select * from transaction_ledger WHERE account_id = 2;


select * from accounts;
CALL transfer_funds(4, 5, 25000, @status, @message);
SELECT @status, @message;



-- ---------mubarbah
CALL create_mudarabah_cycle(DATE_ADD(CURDATE(), INTERVAL 1 MONTH), @status, @message);
SELECT @status, @message;


CALL lock_mudarabah_cycle(DATE_ADD(CURDATE(), INTERVAL 1 MONTH), @status, @message);
SELECT @status, @message;



CALL settle_mudarabah_cycle(DATE_ADD(CURDATE(), INTERVAL 1 MONTH),-20, @status, @message);
SELECT @status, @message;

select * from transaction_ledger;

SELECT * from mudarabah_cycle;
SELECT 
    mce.entry_id,
    mce.account_id,
    c.full_name,
    mce.balance_at_freeze,
    ROUND(mce.share_percent * 100, 2) AS share_pct,
    mce.settled
FROM mudarabah_cycle_entry mce
JOIN accounts a ON mce.account_id = a.account_id
JOIN customers c ON a.customer_id = c.customer_id;


select * from users;
UPDATE users SET password_hash = 'admin' WHERE user_id =10;

DELETE from mudarabah_cycle where cycle_id =9;
DELETE from mudarabah_cycle_entry where cycle_id =9;

CALL settle_mudarabah_cycle(CURDATE(), -10, @status, @message);
SELECT @status as status, @message as message;


select * from txn_pair;

select * from mudarabah_cycle_entry;

SELECT cycle_id, cycle_month, pool_total, status, frozen_at
FROM mudarabah_cycle;