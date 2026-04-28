import { mysqlTable, tinyint,mysqlSchema, AnyMySqlColumn, index, foreignKey, primaryKey, check, int, mysqlEnum, decimal, timestamp, unique, varchar, date } from "drizzle-orm/mysql-core"
import { sql } from "drizzle-orm"

export const accounts = mysqlTable("accounts", {
	accountId: int("account_id").autoincrement().notNull(),
	customerId: int("customer_id").notNull().references(() => customers.customerId, { onDelete: "restrict", onUpdate: "cascade" } ),
	accountType: mysqlEnum("account_type", ['wadi_ah','mudarabah','charity']).notNull(),
	balance: decimal({ precision: 15, scale: 2 }).default('0.00').notNull(),
	status: mysqlEnum(['active','frozen','closed']).default('active').notNull(),
	openedAt: timestamp("opened_at", { mode: 'string' }).defaultNow(),
},
(table) => [
	index("customer_id").on(table.customerId),
	primaryKey({ columns: [table.accountId], name: "accounts_account_id"}),
	check("chk_balance", sql`(\`balance\` >= 0)`),
]);

export const churnSignal = mysqlTable("churn_signal", {
	signalId: int("signal_id").autoincrement().notNull(),
	customerId: int("customer_id").notNull().references(() => customers.customerId, { onDelete: "restrict", onUpdate: "cascade" } ),
	transactionVelocityScore: decimal("transaction_velocity_score", { precision: 8, scale: 4 }).notNull(),
	balanceVolatilityScore: decimal("balance_volatility_score", { precision: 8, scale: 4 }).notNull(),
	lastComputedAt: timestamp("last_computed_at", { mode: 'string' }).defaultNow(),
},
(table) => [
	index("customer_id").on(table.customerId),
	primaryKey({ columns: [table.signalId], name: "churn_signal_signal_id"}),
]);

export const customers = mysqlTable("customers", {
	customerId: int("customer_id").autoincrement().notNull(),
	userId: int("user_id").notNull().references(() => users.userId, { onDelete: "cascade", onUpdate: "cascade" } ),
	fullName: varchar("full_name", { length: 100 }).notNull(),
	nationalId: varchar("national_id", { length: 15 }),
	phone: varchar({ length: 20 }).notNull(),
	email: varchar({ length: 100 }).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
},
(table) => [
	primaryKey({ columns: [table.customerId], name: "customers_customer_id"}),
	unique("email").on(table.email),
	unique("national_id").on(table.nationalId),
	unique("user_id").on(table.userId),
	check("checkCNIC", sql`regexp_like(\`national_id\`,_utf8mb4\'^[0-9]{5}-[0-9]{7}-[0-9]{1}$\')`),
	check("checkPhone", sql`regexp_like(\`phone\`,_utf8mb4\'^[0-9]{10}$\')`),
	check("checkEmail", sql`regexp_like(\`email\`,_utf8mb4\'^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\\\.[A-Za-z]{2,}$\')`),
]);

export const mudarabahDetail = mysqlTable("mudarabah_detail", {
	mudarabahId: int("mudarabah_id").autoincrement().notNull(),
	accountId: int("account_id").notNull().references(() => accounts.accountId, { onDelete: "cascade", onUpdate: "cascade" } ),
	profitSharingRatio: decimal("profit_sharing_ratio", { precision: 5, scale: 4 }).notNull(),
	investmentPeriodMonths: int("investment_period_months").notNull(),
},
(table) => [
	primaryKey({ columns: [table.mudarabahId], name: "mudarabah_detail_mudarabah_id"}),
	unique("account_id").on(table.accountId),
	check("checkProfitRatio", sql`((\`profit_sharing_ratio\` > 0) and (\`profit_sharing_ratio\` < 1))`),
]);

export const nboRecommendation = mysqlTable("nbo_recommendation", {
	nboId: int("nbo_id").autoincrement().notNull(),
	customerId: int("customer_id").notNull().references(() => customers.customerId, { onDelete: "restrict", onUpdate: "cascade" } ),
	ruleId: int("rule_id").notNull().references(() => nboRules.ruleId, { onDelete: "restrict", onUpdate: "cascade" } ),
	status: mysqlEnum(['presented','accepted','dismissed']).default('presented').notNull(),
	offerGeneratedAt: timestamp("offer_generated_at", { mode: 'string' }).defaultNow(),
},
(table) => [
	index("customer_id").on(table.customerId),
	index("rule_id").on(table.ruleId),
	primaryKey({ columns: [table.nboId], name: "nbo_recommendation_nbo_id"}),
]);

export const nboRules = mysqlTable("nbo_rules", {
	ruleId: int("rule_id").autoincrement().notNull(),
	triggerRule: varchar("trigger_rule", { length: 100 }).notNull(),
	productId: int("product_id").notNull().references(() => productCatalog.productId, { onDelete: "restrict", onUpdate: "cascade" } ),
},
(table) => [
	index("product_id").on(table.productId),
	primaryKey({ columns: [table.ruleId], name: "nbo_rules_rule_id"}),
	unique("trigger_rule").on(table.triggerRule),
]);

export const productCatalog = mysqlTable("product_catalog", {
	productId: int("product_id").autoincrement().notNull(),
	productName: varchar("product_name", { length: 100 }).notNull(),
	productType: mysqlEnum("product_type", ['murabaha','ijarah','musharakah','istisna','salam']).notNull(),
	isActive: tinyint("is_active").default(1).notNull(),
},
(table) => [
	primaryKey({ columns: [table.productId], name: "product_catalog_product_id"}),
	unique("product_name").on(table.productName),
]);

export const purificationEntry = mysqlTable("purification_entry", {
	entryId: int("entry_id").autoincrement().notNull(),
	txnId: int("txn_id").notNull().references(() => transactionLedger.txnId, { onDelete: "restrict", onUpdate: "cascade" } ),
	purifiedAmount: decimal("purified_amount", { precision: 15, scale: 2 }).notNull(),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	purificationDate: date("purification_date", { mode: 'string' }).notNull(),
},
(table) => [
	primaryKey({ columns: [table.entryId], name: "purification_entry_entry_id"}),
	unique("txn_id").on(table.txnId),
	check("checkPurifiedAmount", sql`(\`purified_amount\` > 0)`),
]);

export const staff = mysqlTable("staff", {
	staffId: int("staff_id").autoincrement().notNull(),
	userId: int("user_id").notNull().references(() => users.userId, { onDelete: "cascade", onUpdate: "cascade" } ),
	fullName: varchar("full_name", { length: 100 }).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
},
(table) => [
	primaryKey({ columns: [table.staffId], name: "staff_staff_id"}),
	unique("user_id").on(table.userId),
]);

export const transactionLedger = mysqlTable("transaction_ledger", {
	txnId: int("txn_id").autoincrement().notNull(),
	accountId: int("account_id").notNull().references(() => accounts.accountId, { onDelete: "restrict", onUpdate: "cascade" } ),
	amount: decimal({ precision: 15, scale: 2 }).notNull(),
	direction: mysqlEnum(['debit','credit']).notNull(),
	txnType: mysqlEnum("txn_type", ['deposit','withdrawal','transfer','purification','profit_distribution']).notNull(),
	referenceNote: varchar("reference_note", { length: 255 }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
},
(table) => [
	index("account_id").on(table.accountId),
	primaryKey({ columns: [table.txnId], name: "transaction_ledger_txn_id"}),
	check("checkAmount", sql`(\`amount\` > 0)`),
]);

export const txnPair = mysqlTable("txn_pair", {
	pairId: int("pair_id").autoincrement().notNull(),
	debitTxnId: int("debit_txn_id").notNull().references(() => transactionLedger.txnId, { onDelete: "restrict", onUpdate: "cascade" } ),
	creditTxnId: int("credit_txn_id").notNull().references(() => transactionLedger.txnId, { onDelete: "restrict", onUpdate: "cascade" } ),
	pairType: mysqlEnum("pair_type", ['transfer','profit_distribution','purification']).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
},
(table) => [
	primaryKey({ columns: [table.pairId], name: "txn_pair_pair_id"}),
	unique("credit_txn_id").on(table.creditTxnId),
	unique("debit_txn_id").on(table.debitTxnId),
]);

export const users = mysqlTable("users", {
	userId: int("user_id").autoincrement().notNull(),
	username: varchar({ length: 50 }).notNull(),
	passwordHash: varchar("password_hash", { length: 255 }).notNull(),
	role: mysqlEnum(['customer','staff','admin']).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
},
(table) => [
	primaryKey({ columns: [table.userId], name: "users_user_id"}),
	unique("username").on(table.username),
]);
