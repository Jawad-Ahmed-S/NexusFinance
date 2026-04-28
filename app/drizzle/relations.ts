import { relations } from "drizzle-orm/relations";
import { customers, accounts, churnSignal, users, mudarabahDetail, nboRecommendation, nboRules, productCatalog, transactionLedger, purificationEntry, staff, txnPair } from "./schema";

export const accountsRelations = relations(accounts, ({one, many}) => ({
	customer: one(customers, {
		fields: [accounts.customerId],
		references: [customers.customerId]
	}),
	mudarabahDetails: many(mudarabahDetail),
	transactionLedgers: many(transactionLedger),
}));

export const customersRelations = relations(customers, ({one, many}) => ({
	accounts: many(accounts),
	churnSignals: many(churnSignal),
	user: one(users, {
		fields: [customers.userId],
		references: [users.userId]
	}),
	nboRecommendations: many(nboRecommendation),
}));

export const churnSignalRelations = relations(churnSignal, ({one}) => ({
	customer: one(customers, {
		fields: [churnSignal.customerId],
		references: [customers.customerId]
	}),
}));

export const usersRelations = relations(users, ({many}) => ({
	customers: many(customers),
	staff: many(staff),
}));

export const mudarabahDetailRelations = relations(mudarabahDetail, ({one}) => ({
	account: one(accounts, {
		fields: [mudarabahDetail.accountId],
		references: [accounts.accountId]
	}),
}));

export const nboRecommendationRelations = relations(nboRecommendation, ({one}) => ({
	customer: one(customers, {
		fields: [nboRecommendation.customerId],
		references: [customers.customerId]
	}),
	nboRule: one(nboRules, {
		fields: [nboRecommendation.ruleId],
		references: [nboRules.ruleId]
	}),
}));

export const nboRulesRelations = relations(nboRules, ({one, many}) => ({
	nboRecommendations: many(nboRecommendation),
	productCatalog: one(productCatalog, {
		fields: [nboRules.productId],
		references: [productCatalog.productId]
	}),
}));

export const productCatalogRelations = relations(productCatalog, ({many}) => ({
	nboRules: many(nboRules),
}));

export const purificationEntryRelations = relations(purificationEntry, ({one}) => ({
	transactionLedger: one(transactionLedger, {
		fields: [purificationEntry.txnId],
		references: [transactionLedger.txnId]
	}),
}));

export const transactionLedgerRelations = relations(transactionLedger, ({one, many}) => ({
	purificationEntries: many(purificationEntry),
	account: one(accounts, {
		fields: [transactionLedger.accountId],
		references: [accounts.accountId]
	}),
	txnPairs_debitTxnId: many(txnPair, {
		relationName: "txnPair_debitTxnId_transactionLedger_txnId"
	}),
	txnPairs_creditTxnId: many(txnPair, {
		relationName: "txnPair_creditTxnId_transactionLedger_txnId"
	}),
}));

export const staffRelations = relations(staff, ({one}) => ({
	user: one(users, {
		fields: [staff.userId],
		references: [users.userId]
	}),
}));

export const txnPairRelations = relations(txnPair, ({one}) => ({
	transactionLedger_debitTxnId: one(transactionLedger, {
		fields: [txnPair.debitTxnId],
		references: [transactionLedger.txnId],
		relationName: "txnPair_debitTxnId_transactionLedger_txnId"
	}),
	transactionLedger_creditTxnId: one(transactionLedger, {
		fields: [txnPair.creditTxnId],
		references: [transactionLedger.txnId],
		relationName: "txnPair_creditTxnId_transactionLedger_txnId"
	}),
}));