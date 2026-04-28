import React from "react";

interface Transaction {
  transaction_id: string | number;
  reference_note: string;
  txn_type: string;
  direction: "CREDIT" | "DEBIT";
  created_at: string | Date;
  amount: number | string;
}

interface TransactionTableProps {
  transactions: Transaction[];
}

export default function TransactionTable({ transactions }: TransactionTableProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-slate-900 px-1">Recent Ledger Entries</h3>

      {/* Desktop table */}
      <div className="hidden sm:block bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[10px] uppercase font-bold tracking-wider">
            <tr>
              <th className="px-6 lg:px-8 py-4">Transaction Details</th>
              <th className="px-6 lg:px-8 py-4">Type</th>
              <th className="px-6 lg:px-8 py-4 text-right">Date</th>
              <th className="px-6 lg:px-8 py-4 text-right">Amount (PKR)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {transactions.map((tx) => (
              <tr
                key={tx.transaction_id}
                className="hover:bg-slate-50/50 transition-colors"
              >
                <td className="px-6 lg:px-8 py-5 font-bold text-slate-800 text-sm">
                  {tx.reference_note}
                </td>
                <td className="px-6 lg:px-8 py-5">
                  <span
                    className={`text-[10px] font-black px-2.5 py-1 rounded-md border ${
                      tx.direction === "CREDIT"
                        ? "bg-green-50 border-green-200 text-green-700"
                        : "bg-slate-50 border-slate-200 text-slate-600"
                    }`}
                  >
                    {tx.txn_type}
                  </span>
                </td>
                <td className="px-6 lg:px-8 py-5 text-right text-xs text-slate-400 font-medium">
                  {new Date(tx.created_at).toLocaleDateString("en-GB")}
                </td>
                <td
                  className={`px-6 lg:px-8 py-5 text-right font-mono font-bold text-sm ${
                    tx.direction === "CREDIT" ? "text-green-600" : "text-slate-900"
                  }`}
                >
                  {tx.direction === "CREDIT" ? "+" : "-"}{" "}
                  {Number(tx.amount).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile card list */}
      <div className="sm:hidden space-y-3">
        {transactions.map((tx) => (
          <div
            key={tx.transaction_id}
            className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm"
          >
            <div className="flex items-start justify-between gap-2">
              <p className="font-bold text-slate-800 text-sm leading-snug flex-1">
                {tx.reference_note}
              </p>
              <span
                className={`text-[10px] font-black px-2 py-0.5 rounded-md border shrink-0 ${
                  tx.direction === "CREDIT"
                    ? "bg-green-50 border-green-200 text-green-700"
                    : "bg-slate-50 border-slate-200 text-slate-600"
                }`}
              >
                {tx.txn_type}
              </span>
            </div>
            <div className="flex items-center justify-between mt-3">
              <p className="text-xs text-slate-400 font-medium">
                {new Date(tx.created_at).toLocaleDateString("en-GB")}
              </p>
              <p
                className={`font-mono font-bold text-sm ${
                  tx.direction === "CREDIT" ? "text-green-600" : "text-slate-900"
                }`}
              >
                {tx.direction === "CREDIT" ? "+" : "-"}{" "}
                {Number(tx.amount).toLocaleString()}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}