
select * from account_statement_view where account_id = 1;
select * from transaction_ledger WHERE account_id = 2;


select * from accounts;
CALL transfer_funds(4, 9, 645, @status, @message);
SELECT @status, @message;



-- ---------mubarbah
CALL create_mudarabah_cycle(CURDATE(), @status, @message);
SELECT @status, @message;


CALL lock_mudarabah_cycle(CURDATE(), @status, @message);
SELECT @status, @message;



CALL settle_mudarabah_cycle(CURDATE()-1,5, @status, @message);
SELECT @status, @message;

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




SELECT cycle_id, cycle_month, pool_total, status, frozen_at
FROM mudarabah_cycle;