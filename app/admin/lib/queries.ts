import { db } from "@/lib/db";
import { sql } from "drizzle-orm";


export async function getSystemOverview() {
  const result = await db.execute(sql`
    SELECT
      (SELECT COUNT(*) FROM customers) AS total_customers,
      (SELECT COUNT(*) FROM accounts) AS total_accounts,
      (SELECT COUNT(*) FROM transaction_ledger) AS total_transactions,
      (SELECT COALESCE(SUM(balance), 0) FROM accounts) AS total_balance
  `);

  const row = (result as any)[0][0];
  return {
    totalCustomers:    Number(row.total_customers),
    totalAccounts:     Number(row.total_accounts),
    totalTransactions: Number(row.total_transactions),
    totalBalance:      Number(row.total_balance),
  };
}

export async function getAccountTypeBreakdown() {
  const result = await db.execute(sql`
    SELECT account_type, COUNT(*) AS account_count, COALESCE(SUM(balance), 0) AS total_balance
    FROM accounts
    GROUP BY account_type
  `);

  const rows = (result as any)[0]; 
  console.log("BREAKDOWN ROWS:", JSON.stringify(rows, null, 2));

  const breakdown: Record<string, { count: number; balance: number }> = {};
  for (const row of rows) {
    breakdown[row.account_type as string] = {
      count:   Number(row.account_count),
      balance: Number(row.total_balance),
    };
  }

  return {
    wadiah:    { count: breakdown["wadi_ah"]?.count ?? 0,    balance: breakdown["wadi_ah"]?.balance ?? 0 },
    mudarabah: { count: breakdown["mudarabah"]?.count ?? 0, balance: breakdown["mudarabah"]?.balance ?? 0 },
  };
}

export async function getAccountStatusSnapshot() {
  const result = await db.execute(sql`
    SELECT status, COUNT(*) AS count FROM accounts GROUP BY status
  `);

  const rows = (result as any)[0];
  const map: Record<string, number> = {};
  for (const row of rows) {
    map[row.status as string] = Number(row.count);
  }

  return {
    active: map["active"] ?? 0,
    frozen: map["frozen"] ?? 0,
    closed: map["closed"] ?? 0,
  };
}

export async function getRecentTransactions(limit = 20) {
  const result = await db.execute(sql`
    SELECT txn_id, account_id, amount, direction, txn_type, reference_note, created_at
    FROM transaction_ledger
    ORDER BY created_at DESC
    LIMIT ${limit}
  `);

  const rows = (result as any)[0];
  return rows.map((row: any) => ({
    txnId:         Number(row.txn_id),
    accountId:     Number(row.account_id),
    amount:        Number(row.amount),
    direction:     row.direction as "debit" | "credit",
    txnType:       row.txn_type as string,
    referenceNote: row.reference_note as string | null,
    createdAt:     new Date(row.created_at),
  }));
}

export async function getRecentAccountActivity(limit = 10) {
  const result = await db.execute(sql`
    SELECT account_id, customer_id, account_type, status, opened_at
    FROM accounts
    ORDER BY opened_at DESC
    LIMIT ${limit}
  `);

  const rows = (result as any)[0];
  return rows.map((row: any) => ({
    accountId:   Number(row.account_id),
    customerId:  Number(row.customer_id),
    accountType: row.account_type as string,
    status:      row.status as string,
    openedAt:    new Date(row.opened_at),
  }));
}

export async function getAccountRequestsSummary() {
  const result = await db.execute(sql`
    SELECT
      (SELECT COUNT(*) FROM nbo_recommendation WHERE status = 'pending') AS pending_count,
      (SELECT COUNT(*) FROM nbo_recommendation WHERE status = 'rejected') AS rejected_count,
      (SELECT COUNT(*) FROM nbo_recommendation
         WHERE status = 'approved' AND DATE(offer_generated_at) = CURDATE()) AS approved_today
  `);

  const row = (result as any)[0][0];
  return {
    pending:       Number(row.pending_count),
    rejected:      Number(row.rejected_count),
    approvedToday: Number(row.approved_today),
  };
}


// ─────────────────────────────────────────────────────────────
// ACCOUNT MANAGEMENT QUERIES — append to /lib/queries.ts
// ─────────────────────────────────────────────────────────────

export async function getAccounts({
  page = 1,
  limit = 15,
  status,
  accountType,
  search,
}: {
  page?: number;
  limit?: number;
  status?: string;
  accountType?: string;
  search?: string;
}) {
  const offset = (page - 1) * limit;

  // build WHERE conditions array
  const where: any[] = [];
  if (status)      where.push(sql`a.status = ${status}`);
  if (accountType) where.push(sql`a.account_type = ${accountType}`);
  if (search) {
    const searchId = parseInt(search);
    where.push(
      isNaN(searchId)
        ? sql`c.full_name LIKE ${`%${search}%`}`
        : sql`(a.account_id = ${searchId} OR c.full_name LIKE ${`%${search}%`})`
    );
  }

  // join conditions with AND
  const whereClause = where.length > 0
    ? sql`WHERE ${sql.join(where, sql` AND `)}`
    : sql``;

  const dataResult = await db.execute(sql`
    SELECT
      a.account_id,
      c.full_name AS customer_name,
      a.account_type,
      a.status,
      a.balance,
      a.opened_at
    FROM accounts a
    JOIN customers c ON a.customer_id = c.customer_id
    ${whereClause}
    ORDER BY a.opened_at DESC
    LIMIT ${limit} OFFSET ${offset}
  `);

  const countResult = await db.execute(sql`
    SELECT COUNT(*) AS total
    FROM accounts a
    JOIN customers c ON a.customer_id = c.customer_id
    ${whereClause}
  `);

  const rows  = (dataResult as any)[0];
  const total = Number((countResult as any)[0][0].total);

  return {
    accounts: rows.map((row: any) => ({
      accountId:    Number(row.account_id),
      customerName: row.customer_name as string,
      accountType:  row.account_type as string,
      status:       row.status as string,
      balance:      Number(row.balance),
      openedAt:     new Date(row.opened_at),
    })),
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
}

export async function freezeAccount(accountId: number) {
  const check = await db.execute(sql`
    SELECT status FROM accounts WHERE account_id = ${accountId}
  `);
  const row = (check as any)[0][0];
  if (!row) throw new Error("Account not found");
  if (row.status !== "active") throw new Error(`Cannot freeze a ${row.status} account`);

  await db.execute(sql`
    UPDATE accounts SET status = 'frozen' WHERE account_id = ${accountId}
  `);
  return { success: true };
}

export async function unfreezeAccount(accountId: number) {
  const check = await db.execute(sql`
    SELECT status FROM accounts WHERE account_id = ${accountId}
  `);
  const row = (check as any)[0][0];
  if (!row) throw new Error("Account not found");
  if (row.status !== "frozen") throw new Error(`Cannot unfreeze a ${row.status} account`);

  await db.execute(sql`
    UPDATE accounts SET status = 'active' WHERE account_id = ${accountId}
  `);
  return { success: true };
}

export async function closeAccount(accountId: number) {
  const check = await db.execute(sql`
    SELECT status, balance FROM accounts WHERE account_id = ${accountId}
  `);
  const row = (check as any)[0][0];
  if (!row) throw new Error("Account not found");
  if (row.status === "closed") throw new Error("Account is already closed");
  if (Number(row.balance) > 0) throw new Error("Cannot close account with remaining balance");

  await db.execute(sql`
    UPDATE accounts SET status = 'closed' WHERE account_id = ${accountId} ///-----should be either deleted completely
  `);
  return { success: true };
}

export async function getTransactionsFromView() {
  const result = await db.execute(sql`
    SELECT * FROM v_admin_transactions ORDER BY created_at DESC
  `);
  const rows = (result as any)[0] ?? [];

  return rows.map((row: any) => ({
    txn_id:        Number(row.txn_id),
    txn_type:      String(row.txn_type ?? ""),
    direction:     String(row.direction ?? ""),
    amount:        Number(row.amount ?? 0),
    from_account:  row.from_account_id  != null ? Number(row.from_account_id)  : null,
    from_customer: row.from_customer    != null ? String(row.from_customer)     : null,
    to_account:    row.to_account_id    != null ? Number(row.to_account_id)     : null,
    to_customer:   row.to_customer      != null ? String(row.to_customer)       : null,
    created_at:    row.created_at,
  
  }));
}



// ============================================================
// Add these to your existing ../lib/queries.ts
// ============================================================


// ── Types ────────────────────────────────────────────────────

export type MudarabahCycle = {
  cycle_id: number;
  cycle_month: string;
  pool_total: number;
  profit_loss_percent: number | null;
  profit_loss_amount: number | null;
  status: "open" | "frozen" | "settled";
  open_at: string;
  frozen_at: string | null;
  settled_at: string | null;
  account_count: number;
};

export type MudarabahAccount = {
  account_id: number;
  customer_id: number;
  full_name: string;
  balance: number;
  status: string;
  opened_at: string;
  share_percent: number | null;
  profit_loss_amount: number | null;
};

export type ProcedureResult = {
  status: "SUCCESS" | "ERROR";
  message: string;
};

// ── Current cycle with account count ─────────────────────────

export async function getCurrentMudarabahCycle(): Promise<MudarabahCycle | null> {
  const result = await db.execute(sql`
    SELECT 
      mc.*,
      COUNT(mce.entry_id) as account_count
    FROM mudarabah_cycle mc
    LEFT JOIN mudarabah_cycle_entry mce ON mc.cycle_id = mce.cycle_id
    WHERE mc.cycle_month = DATE_FORMAT(CURDATE(), '%Y-%m-01')
    GROUP BY mc.cycle_id
  `);
  const rows = (result as any)[0] ?? [];
  if (rows.length === 0) return null;
  const row = rows[0];
  return {
    cycle_id:           Number(row.cycle_id),
    cycle_month:        String(row.cycle_month),
    pool_total:         Number(row.pool_total ?? 0),
    profit_loss_percent: row.profit_loss_percent != null ? Number(row.profit_loss_percent) : null,
    profit_loss_amount:  row.profit_loss_amount  != null ? Number(row.profit_loss_amount)  : null,
    status:             String(row.status) as MudarabahCycle["status"],
    open_at:            String(row.open_at),
    frozen_at:          row.frozen_at   ? String(row.frozen_at)   : null,
    settled_at:         row.settled_at  ? String(row.settled_at)  : null,
    account_count:      Number(row.account_count ?? 0),
  };
}

// ── Past cycles (history) ────────────────────────────────────

export async function getMudarabahCycleHistory(): Promise<MudarabahCycle[]> {
  const result = await db.execute(sql`
    SELECT 
      mc.*,
      COUNT(mce.entry_id) as account_count
    FROM mudarabah_cycle mc
    LEFT JOIN mudarabah_cycle_entry mce ON mc.cycle_id = mce.cycle_id
    WHERE mc.cycle_month != DATE_FORMAT(CURDATE(), '%Y-%m-01')
    GROUP BY mc.cycle_id
    ORDER BY mc.cycle_month DESC
  `);
  const rows = (result as any)[0] ?? [];
  return rows.map((row: any) => ({
    cycle_id:            Number(row.cycle_id),
    cycle_month:         String(row.cycle_month),
    pool_total:          Number(row.pool_total ?? 0),
    profit_loss_percent: row.profit_loss_percent != null ? Number(row.profit_loss_percent) : null,
    profit_loss_amount:  row.profit_loss_amount  != null ? Number(row.profit_loss_amount)  : null,
    status:              String(row.status) as MudarabahCycle["status"],
    open_at:             String(row.open_at),
    frozen_at:           row.frozen_at  ? String(row.frozen_at)  : null,
    settled_at:          row.settled_at ? String(row.settled_at) : null,
    account_count:       Number(row.account_count ?? 0),
  }));
}

// ── All Mudarabah accounts with current cycle entry if exists ─

export async function getMudarabahAccounts(): Promise<MudarabahAccount[]> {
  const result = await db.execute(sql`
    SELECT
      a.account_id,
      a.customer_id,
      c.full_name,
      a.balance,
      a.status,
      a.opened_at,
      mce.share_percent,
      mce.profit_loss_amount
    FROM accounts a
    JOIN customers c ON a.customer_id = c.customer_id
    LEFT JOIN mudarabah_cycle_entry mce ON a.account_id = mce.account_id
      AND mce.cycle_id = (
        SELECT cycle_id FROM mudarabah_cycle
        WHERE cycle_month = DATE_FORMAT(CURDATE(), '%Y-%m-01')
        LIMIT 1
      )
    WHERE a.account_type = 'mudarabah'
    ORDER BY a.balance DESC
  `);
  const rows = (result as any)[0] ?? [];
  return rows.map((row: any) => ({
    account_id:          Number(row.account_id),
    customer_id:         Number(row.customer_id),
    full_name:           String(row.full_name),
    balance:             Number(row.balance ?? 0),
    status:              String(row.status),
    opened_at:           String(row.opened_at),
    share_percent:       row.share_percent       != null ? Number(row.share_percent)       : null,
    profit_loss_amount:  row.profit_loss_amount  != null ? Number(row.profit_loss_amount)  : null,
  }));
}

// ── Procedure calls ──────────────────────────────────────────

export async function callCreateMudarabahCycle(): Promise<ProcedureResult> {
  await db.execute(sql`CALL create_mudarabah_cycle(CURDATE(), @status, @message)`);
  const result = await db.execute(sql`SELECT @status as status, @message as message`);
  const row = ((result as any)[0] ?? [])[0];
  return { status: row?.status ?? "ERROR", message: row?.message ?? "Unknown error" };
}

export async function callLockMudarabahCycle(): Promise<ProcedureResult> {
  await db.execute(sql`CALL lock_mudarabah_cycle(CURDATE(), @status, @message)`);
  const result = await db.execute(sql`SELECT @status as status, @message as message`);
  const row = ((result as any)[0] ?? [])[0];
  return { status: row?.status ?? "ERROR", message: row?.message ?? "Unknown error" };
}

export async function callSettleMudarabahCycle(profitLossPercent: number): Promise<ProcedureResult> {
  await db.execute(sql`CALL settle_mudarabah_cycle(CURDATE(), ${profitLossPercent}, @status, @message)`);
  const result = await db.execute(sql`SELECT @status as status, @message as message`);
  const row = ((result as any)[0] ?? [])[0];
  return { status: row?.status ?? "ERROR", message: row?.message ?? "Unknown error" };
}

