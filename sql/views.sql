CREATE VIEW customer_profile_view AS
SELECT 
  u.user_id,
  u.username,
  u.role,
  c.customer_id,
  c.full_name,
  c.national_id,
  c.phone,
  c.email,
  c.created_at as customer_since
FROM users u
INNER JOIN customers c ON u.user_id = c.user_id;

DROP VIEW customer_accounts_view;

CREATE VIEW customer_accounts_view AS
SELECT 
  a.account_id,
  c.full_name,
  a.customer_id,
  a.account_type,
  a.status,
  a.balance,
  a.opened_at,
  md.profit_sharing_ratio,
  md.investment_period_months
FROM accounts a
JOIN customers c ON a.customer_id = c.customer_id
LEFT JOIN mudarabah_detail md ON a.account_id = md.account_id;


CREATE VIEW account_statement_view AS
SELECT 
  tl.txn_id,
  tl.account_id,
  tl.amount,
  tl.direction,
  tl.txn_type,
  tl.reference_note,
  tl.created_at,
  a.account_type,
  a.customer_id
FROM transaction_ledger tl
INNER JOIN accounts a ON tl.account_id = a.account_id;


CREATE VIEW v_admin_transactions AS
SELECT
    tl.txn_id,
    tl.txn_type,
    tl.amount,
    tl.direction,
    tl.created_at,
    -- sender / single transaction account
    tl.account_id                   AS from_account_id,
    c_from.full_name                AS from_customer,
    -- receiver (only populated for transfers)
    tl_credit.account_id            AS to_account_id,
    c_to.full_name                  AS to_customer,
    
    tp.pair_id
FROM transaction_ledger tl
-- bring in txn_pair only for transfers
LEFT JOIN txn_pair tp ON tl.txn_id = tp.debit_txn_id
-- bring in credit side ledger row for transfers
LEFT JOIN transaction_ledger tl_credit ON tp.credit_txn_id = tl_credit.txn_id
-- sender customer name
JOIN accounts a_from ON tl.account_id = a_from.account_id
JOIN customers c_from ON a_from.customer_id = c_from.customer_id
-- receiver customer name (null for non-transfers)
LEFT JOIN accounts a_to ON tl_credit.account_id = a_to.account_id
LEFT JOIN customers c_to ON a_to.customer_id = c_to.customer_id

WHERE tl.txn_type != 'transfer'
   OR tl.txn_id = tp.debit_txn_id;
   
   select * from v_admin_transactions;
   
   use nexusFinance;

 SELECT *
      FROM customers WHERE user_id = 6;
      
      
select * from users;

