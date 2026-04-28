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


 SELECT *
      FROM customers WHERE user_id = 6;
      
      
select * from users;

