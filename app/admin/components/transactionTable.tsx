import { ArrowRightLeft, TrendingDown, TrendingUp } from "lucide-react";

// ─── Types ───────────────────────────────────────────────────

type Transaction = {
  txn_id:       number;
  txn_type:     string;
  direction:    "credit" | "debit" | string;
  amount:       number | string;
  from_account: number | null;
  to_account:   number | null;
  created_at:   string | Date | null;
};

type Props = {
  transactions?: Transaction[];
};

// ─── Helpers ─────────────────────────────────────────────────

const fmt = (n: number | string) =>
  new Intl.NumberFormat("en-PK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(n) || 0);

const timeAgo = (date: string | Date | null): string => {
  if (!date) return "—";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "—";
  const diff = Math.floor((Date.now() - d.getTime()) / 1000);
  if (diff < 60)  return `${diff}s ago`;
  const m = Math.floor(diff / 60);
  if (m < 60)     return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24)     return `${h}h ago`;
  const days = Math.floor(h / 24);
  if (days < 30)  return `${days}d ago`;
  return d.toLocaleDateString("en-PK", {
    day: "numeric", month: "short", year: "numeric",
  });
};

// ─── Muted N/A cell ──────────────────────────────────────────

function NA() {
  return (
    <span className="font-mono text-xs text-slate-300 select-none">N/A</span>
  );
}

// ─── Component ───────────────────────────────────────────────

export default function TransactionsTable({ transactions }: Props) {
  const data = Array.isArray(transactions) ? transactions : [];

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">

        {/* HEAD */}
        <thead>
          <tr className="text-[10px] font-bold uppercase tracking-widest text-slate-400 border-b border-slate-100">
            <th className="text-left px-6 py-3">Txn ID</th>
            <th className="text-left px-6 py-3">Type</th>
            <th className="text-left px-6 py-3">From</th>
            <th className="text-left px-6 py-3">To</th>
            <th className="text-left px-6 py-3">Direction</th>
            <th className="text-right px-6 py-3">Amount</th>
            <th className="text-right px-6 py-3">Time</th>
          </tr>
        </thead>

        {/* BODY */}
        <tbody className="divide-y divide-slate-50">
          {data.length === 0 ? (
            <tr>
              <td colSpan={7} className="px-6 py-12 text-center text-slate-400 text-xs">
                No transactions found
              </td>
            </tr>
          ) : (
            data.map((txn) => {
              const isTransfer = txn.to_account != null;
              const isCredit   = (txn.direction ?? "").toLowerCase() === "credit";
              const type       = (txn.txn_type ?? "").toLowerCase();

              return (
                <tr key={txn.txn_id} className="hover:bg-slate-50/60 transition-colors">

                  {/* TXN ID */}
                  <td className="px-6 py-3.5 font-mono text-xs text-slate-400">
                    #{txn.txn_id}
                  </td>

                  {/* TYPE */}
                  <td className="px-6 py-3.5">
                    <div className="flex items-center gap-2">
                      <div className={`w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 ${
                        isTransfer ? "bg-slate-100" : isCredit ? "bg-green-50" : "bg-slate-100"
                      }`}>
                        {isTransfer
                          ? <ArrowRightLeft className="w-3.5 h-3.5 text-slate-500" />
                          : isCredit
                            ? <TrendingUp className="w-3.5 h-3.5 text-green-600" />
                            : <TrendingDown className="w-3.5 h-3.5 text-slate-500" />
                        }
                      </div>
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                        isTransfer
                          ? "bg-slate-100 text-slate-600"
                          : isCredit
                            ? "bg-green-50 text-green-700"
                            : "bg-slate-100 text-slate-600"
                      }`}>
                        {txn.txn_type || "—"}
                      </span>
                    </div>
                  </td>

                  {/* FROM */}
                  <td className="px-6 py-3.5 font-mono text-xs text-slate-700">
                    {txn.from_account != null ? `#${txn.from_account}` : <NA />}
                  </td>

                  {/* TO — N/A with muted look for non-transfers */}
                  <td className="px-6 py-3.5">
                    {isTransfer ? (
                      <span className="font-mono text-xs text-slate-700">
                        #{txn.to_account}
                      </span>
                    ) : (
                      <NA />
                    )}
                  </td>

                  {/* DIRECTION */}
                  <td className="px-6 py-3.5">
                    {txn.direction ? (
                      <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                        isCredit
                          ? "bg-green-50 text-green-700"
                          : "bg-slate-100 text-slate-600"
                      }`}>
                        {isCredit ? "+" : "−"} {txn.direction}
                      </span>
                    ) : (
                      <NA />
                    )}
                  </td>

                  {/* AMOUNT */}
                  <td className={`px-6 py-3.5 text-right font-mono font-semibold tabular-nums ${
                    isCredit ? "text-green-600" : "text-slate-900"
                  }`}>
                    {isCredit ? "+" : "−"} PKR {fmt(txn.amount)}
                  </td>

                  {/* TIME */}
                  <td className="px-6 py-3.5 text-right text-xs text-slate-400 whitespace-nowrap">
                    {timeAgo(txn.created_at)}
                  </td>

                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}