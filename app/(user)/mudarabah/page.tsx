// app/(user)/mudarabah/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import {
  getUserAccounts,
  getRecentTransactions,
} from "@/app/(user)/lib/queries";
import {
  getCurrentMudarabahCycle,
} from "@/app/admin/lib/queries";
import Link from "next/link";
import {
  TrendingUp, ShieldCheck, Lock, CheckCircle2,
  Clock, ChevronRight, Info, ArrowLeft,
} from "lucide-react";

// ─── Helpers ────────────────────────────────────────────────

const fmt = (n: number) =>
  new Intl.NumberFormat("en-PK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);

const fmtDate = (d: string | Date | null) => {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-PK", {
    day: "numeric", month: "short", year: "numeric",
  });
};

const timeAgo = (date: string | Date) => {
  const diff = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (diff < 60)  return `${diff}s ago`;
  const m = Math.floor(diff / 60);
  if (m < 60)     return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24)     return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
};

// ─── Cycle Timeline ──────────────────────────────────────────

function CycleTimeline({ status }: { status: "open" | "frozen" | "settled" | string }) {
  const steps = [
    { key: "open",    label: "Open",                icon: <Clock size={12} />         },
    { key: "frozen",  label: "Locked",              icon: <Lock size={12} />           },
    { key: "settled", label: "Profit Distributed",  icon: <CheckCircle2 size={12} />   },
  ];
  const activeIdx = steps.findIndex((s) => s.key === status);

  return (
    <div className="flex items-center gap-0">
      {steps.map((step, i) => {
        const done    = i < activeIdx;
        const current = i === activeIdx;
        return (
          <div key={step.key} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1.5">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center border-2 transition-all ${
                current ? "bg-slate-900 border-slate-900 text-white"
                : done   ? "bg-green-500 border-green-500 text-white"
                         : "bg-white border-slate-200 text-slate-300"
              }`}>
                {step.icon}
              </div>
              <p className={`text-[9px] font-bold uppercase tracking-wider whitespace-nowrap ${
                current ? "text-slate-900"
                : done   ? "text-green-600"
                         : "text-slate-300"
              }`}>
                {step.label}
              </p>
            </div>
            {i < steps.length - 1 && (
              <div className={`flex-1 h-0.5 mb-5 mx-1 ${
                i < activeIdx ? "bg-green-400" : "bg-slate-100"
              }`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── No Mudarabah State ───────────────────────────────────────

function NoMudarabahState() {
  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <div className="max-w-2xl mx-auto px-4 py-20 text-center space-y-6">
        <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto">
          <TrendingUp size={28} className="text-slate-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            No Mudarabah Account
          </h1>
          <p className="text-sm text-slate-500 mt-2 leading-relaxed max-w-sm mx-auto">
            You don't have a Mudarabah investment account yet. Open one to start
            earning Shariah-compliant profit on your capital.
          </p>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-6 text-left space-y-3">
          {[
            "Profit-sharing, not interest (Riba-free)",
            "Capital pooled and invested in Halal ventures",
            "Monthly cycle with transparent distribution",
            "Withdraw anytime when cycle is open",
          ].map((item) => (
            <div key={item} className="flex items-center gap-3 text-sm text-slate-600">
              <CheckCircle2 size={14} className="text-green-500 flex-shrink-0" />
              {item}
            </div>
          ))}
        </div>
        <button className="w-full py-3 bg-slate-900 text-white text-sm font-bold rounded-xl hover:bg-slate-800 transition-colors">
          Request Mudarabah Account
        </button>
        <Link href="/dashboard" className="block text-xs text-slate-400 hover:text-slate-700 transition-colors">
          ← Back to Dashboard
        </Link>
      </div>
    </div>
  );
}

// ─── Page ───────────────────────────────────────────────────

export default async function MudarabahPage() {
  const session = await getServerSession(authOptions);
  const uId     = Number((session?.user as { id?: string })?.id);

  const accounts     = await getUserAccounts(uId);
  const transactions = await getRecentTransactions(uId);

  const mudarabahAccounts = accounts.filter((a: any) => {
    const t = String(a.account_type ?? "").toLowerCase();
    return t === "mudarabah" || t === "savings";
  });

  if (mudarabahAccounts.length === 0) return <NoMudarabahState />;

  const mudarabahBalance = mudarabahAccounts.reduce(
    (s: number, a: any) => s + Number(a.balance), 0
  );

  // Filter transactions to mudarabah accounts only
  const mudarabahAccountIds = new Set(mudarabahAccounts.map((a: any) => a.account_id));
  const mudarabahTxns = (Array.isArray(transactions) ? transactions : [])
    .filter((t: any) => mudarabahAccountIds.has(t.account_id))
    .slice(0, 10);

  // Real cycle data from mudarabah_cycle table
  const rawCycle = await getCurrentMudarabahCycle();

  const cycle = rawCycle
    ? {
        status:     rawCycle.status,
        cycleMonth: new Date(rawCycle.cycle_month).toLocaleDateString("en-PK", {
          month: "long", year: "numeric",
        }),
        poolTotal:  rawCycle.pool_total,
        openAt:     rawCycle.open_at,
        frozenAt:   rawCycle.frozen_at,
        settledAt:  rawCycle.settled_at,
        profitLossPercent: rawCycle.profit_loss_percent,
        profitLossAmount:  rawCycle.profit_loss_amount,
        nextPayout: (() => {
          const d = new Date(rawCycle.cycle_month);
          d.setMonth(d.getMonth() + 1);
          return d.toISOString().split("T")[0];
        })(),
      }
    : null;

  const isLocked = cycle?.status === "frozen" || cycle?.status === "settled";

  // Per-account metrics
  const totalPool       = cycle?.poolTotal ?? 0;
  const sharePercent    = totalPool > 0 ? (mudarabahBalance / totalPool) * 100 : 0;
  const estimatedReturn = mudarabahBalance * 0.0482 / 12;
  const estimatedAnnual = mudarabahBalance * 0.0482;

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">

        {/* ── HEADER ── */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              href="/dashboard"
              className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-slate-700 transition-colors"
            >
              <ArrowLeft size={10} /> Dashboard
            </Link>
            <span className="text-slate-200">/</span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
              Mudarabah
            </span>
          </div>
          <div className="flex items-end justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                Investment Management Center
              </p>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 mt-0.5">
                Mudarabah Portfolio
              </h1>
            </div>
            <span className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full border ${
              cycle?.status === "open"
                ? "bg-green-50 text-green-700 border-green-200"
                : cycle?.status === "frozen"
                ? "bg-amber-50 text-amber-700 border-amber-200"
                : "bg-slate-100 text-slate-600 border-slate-200"
            }`}>
              Cycle: {cycle?.status ?? 'none'}
            </span>
          </div>
        </div>

        {/* ── OVERVIEW CARDS ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              label: "Invested Capital",
              value: `PKR ${fmt(mudarabahBalance)}`,
              sub:   `${mudarabahAccounts.length} account${mudarabahAccounts.length !== 1 ? "s" : ""}`,
              dark:  true,
            },
            {
              label: "Pool Share",
              value: `${sharePercent.toFixed(4)}%`,
              sub:   `of PKR ${fmt(totalPool)} pool`,
              dark:  false,
            },
            {
              label: "Est. Monthly Profit",
              value: `PKR ${fmt(estimatedReturn)}`,
              sub:   "at 4.82% annual rate",
              dark:  false,
            },
            {
              label: "Est. Annual Yield",
              value: `PKR ${fmt(estimatedAnnual)}`,
              sub:   "projected 4.82% p.a.",
              dark:  false,
            },
          ].map((card) => (
            <div
              key={card.label}
              className={`rounded-2xl border p-5 ${
                card.dark
                  ? "bg-slate-900 border-slate-900 shadow-sm shadow-slate-200/50"
                  : "bg-white border-slate-200"
              }`}
            >
              <p className={`text-[10px] font-bold uppercase tracking-widest mb-2 ${
                card.dark ? "text-white/40" : "text-slate-400"
              }`}>
                {card.label}
              </p>
              <p className={`text-lg font-bold tabular-nums tracking-tight ${
                card.dark ? "text-white" : "text-slate-900"
              }`}>
                {card.value}
              </p>
              <p className={`text-[10px] mt-1 ${
                card.dark ? "text-white/30" : "text-slate-400"
              }`}>
                {card.sub}
              </p>
            </div>
          ))}
        </div>

        {/* ── MAIN GRID ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* LEFT 8 */}
          <div className="lg:col-span-8 space-y-6">

            {/* Current Cycle Section */}
            <section className="bg-white border border-slate-200 rounded-2xl p-6">
              {!cycle ? (
                <div className="flex flex-col items-center py-8 text-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                    <Clock size={18} className="text-slate-400" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-700">No Active Cycle</p>
                    <p className="text-xs text-slate-400 mt-1">
                      The next Mudarabah cycle has not started yet.
                    </p>
                  </div>
                </div>
              ) : (
                <>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    Current Cycle
                  </p>
                  <h3 className="text-base font-bold text-slate-900 mt-0.5">{cycle?.cycleMonth ?? 'No Active Cycle'}</h3>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Pool Size</p>
                  <p className="text-sm font-bold text-slate-900 tabular-nums">PKR {fmt(totalPool)}</p>
                </div>
              </div>

              {/* Timeline */}
              <CycleTimeline status={cycle?.status ?? 'none'} />

              {/* Cycle Details */}
              <div className="mt-6 pt-5 border-t border-slate-100 grid grid-cols-3 gap-4">
                {[
                  { label: "Opened",      value: fmtDate(cycle?.openAt ?? null)                              },
                  { label: "Locked At",   value: cycle?.frozenAt ? fmtDate(cycle.frozenAt) : "—"             },
                  { label: "Next Payout", value: fmtDate(cycle?.nextPayout ?? null)                          },
                ].map((item) => (
                  <div key={item.label}>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                      {item.label}
                    </p>
                    <p className="text-sm font-semibold text-slate-900 mt-0.5">{item.value}</p>
                  </div>
                ))}
              </div>

              {/* Lock Warning */}
              {isLocked && (
                <div className="mt-5 flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
                  <Lock size={14} className="text-amber-600 flex-shrink-0" />
                  <p className="text-xs text-amber-700 font-medium">
                    Investment modifications are disabled during an active locked cycle.
                    Funds will be available after settlement.
                  </p>
                </div>
              )}
                </>
              )}
            </section>

            {/* My Accounts in this Cycle */}
            <section className="bg-white border border-slate-200 rounded-2xl">
              <div className="px-6 pt-5 pb-4 border-b border-slate-100">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  My Investment Position
                </p>
              </div>
              <div className="divide-y divide-slate-50">
                {mudarabahAccounts.map((acc: any) => {
                  const accBalance  = Number(acc.balance);
                  const accShare    = totalPool > 0 ? (accBalance / totalPool) * 100 : 0;
                  const accEstProfit = accBalance * 0.0482 / 12;
                  return (
                    <div key={acc.account_id} className="px-6 py-5">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-bold text-slate-900">
                              Account #{acc.account_id}
                            </p>
                            <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md border ${
                              acc.status === "active"
                                ? "bg-green-50 text-green-700 border-green-200"
                                : "bg-slate-100 text-slate-500 border-slate-200"
                            }`}>
                              {acc.status}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                            Mudarabah · Profit Share
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-bold tabular-nums text-slate-900">
                            PKR {fmt(accBalance)}
                          </p>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            {accShare.toFixed(4)}% of pool
                          </p>
                        </div>
                      </div>
                      <div className="mt-4 pt-4 border-t border-slate-50 grid grid-cols-3 gap-3">
                        {[
                          { label: "Weightage",        value: accShare.toFixed(5)     },
                          { label: "Est. Monthly",     value: `PKR ${fmt(accEstProfit)}` },
                          { label: "Participation",    value: isLocked ? "Locked" : "Active"  },
                        ].map((m) => (
                          <div key={m.label}>
                            <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">
                              {m.label}
                            </p>
                            <p className="text-xs font-bold text-slate-900 mt-0.5">{m.value}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Profit History Table */}
            <section className="bg-white border border-slate-200 rounded-2xl">
              <div className="px-6 pt-5 pb-4 border-b border-slate-100 flex items-center justify-between">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  Transaction History
                </p>
                <span className="text-[10px] text-slate-400">
                  {mudarabahTxns.length} records
                </span>
              </div>
              {mudarabahTxns.length === 0 ? (
                <div className="px-6 py-12 text-center text-xs text-slate-400">
                  No transactions yet for this account
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-[10px] font-bold uppercase tracking-widest text-slate-400 border-b border-slate-100">
                        <th className="text-left px-6 py-3">Reference</th>
                        <th className="text-left px-6 py-3">Type</th>
                        <th className="text-left px-6 py-3">Direction</th>
                        <th className="text-right px-6 py-3">Amount</th>
                        <th className="text-right px-6 py-3">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {mudarabahTxns.map((tx: any) => {
                        const isCredit = String(tx.direction ?? "").toUpperCase() === "CREDIT";
                        return (
                          <tr key={tx.txn_id ?? tx.transaction_id} className="hover:bg-slate-50/60 transition-colors">
                            <td className="px-6 py-3.5 text-slate-700 text-xs">
                              {tx.reference_note || "—"}
                            </td>
                            <td className="px-6 py-3.5">
                              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                                {tx.txn_type || "—"}
                              </span>
                            </td>
                            <td className="px-6 py-3.5">
                              <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                                isCredit ? "bg-green-50 text-green-700" : "bg-slate-100 text-slate-600"
                              }`}>
                                {isCredit ? "+" : "−"} {tx.direction}
                              </span>
                            </td>
                            <td className={`px-6 py-3.5 text-right font-mono font-semibold tabular-nums ${
                              isCredit ? "text-green-600" : "text-slate-900"
                            }`}>
                              PKR {fmt(Number(tx.amount ?? 0))}
                            </td>
                            <td className="px-6 py-3.5 text-right text-xs text-slate-400">
                              {timeAgo(tx.created_at)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

          </div>

          {/* RIGHT 4 — Sidebar */}
          <aside className="lg:col-span-4 space-y-4">

            {/* Account Controls */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-4">
                Account Controls
              </p>
              {isLocked ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5">
                    <Lock size={12} className="flex-shrink-0" />
                    <p className="text-[10px] font-bold uppercase tracking-wider">
                      Cycle Locked
                    </p>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Modifications are paused during the active cycle. Controls will
                    re-open after profit distribution.
                  </p>
                  {[
                    { label: "Add Funds",           disabled: true },
                    { label: "Withdraw",            disabled: true },
                    { label: "Modify Participation", disabled: true },
                  ].map((btn) => (
                    <button
                      key={btn.label}
                      disabled
                      className="w-full py-2.5 text-xs font-bold border border-slate-100 rounded-lg text-slate-300 cursor-not-allowed bg-slate-50"
                    >
                      {btn.label}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  <button className="w-full py-2.5 text-xs font-bold border border-slate-900 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors">
                    Add Funds
                  </button>
                  <button className="w-full py-2.5 text-xs font-bold border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors">
                    Withdraw
                  </button>
                  <button className="w-full py-2.5 text-xs font-bold border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors">
                    Modify Participation
                  </button>
                </div>
              )}
            </div>

            {/* Profit Snapshot */}
            <div className="bg-slate-900 rounded-2xl p-6 text-white">
              <div className="flex items-center justify-between mb-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">
                  Profit Snapshot
                </p>
                <TrendingUp size={14} className="text-green-400" />
              </div>
              <div className="space-y-3">
                {[
                  { label: "Annual Rate",    value: "4.82%",                  green: true  },
                  { label: "Monthly Est.",   value: `PKR ${fmt(estimatedReturn)}`, green: false },
                  { label: "Annual Est.",    value: `PKR ${fmt(estimatedAnnual)}`, green: false },
                  { label: "Pool Weightage", value: `${sharePercent.toFixed(5)}%`, green: false },
                ].map((row) => (
                  <div key={row.label} className="flex justify-between items-center py-1.5 border-b border-white/10 last:border-0">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-white/40">
                      {row.label}
                    </span>
                    <span className={`text-xs font-bold tabular-nums ${
                      row.green ? "text-green-400" : "text-white"
                    }`}>
                      {row.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Shariah Note */}
            <div className="bg-green-50 border border-green-200 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-2">
                <ShieldCheck size={13} className="text-green-600" />
                <p className="text-[10px] font-bold uppercase tracking-widest text-green-700">
                  Shariah Compliance
                </p>
              </div>
              <p className="text-xs text-green-700/70 leading-relaxed">
                Profit is distributed based on actual performance of pooled investments.
                No guaranteed returns. No riba. Certified Halal.
              </p>
              <div className="mt-3 flex items-start gap-2 text-[10px] text-green-600/60 italic">
                <Info size={11} className="flex-shrink-0 mt-0.5" />
                <span>Calculated on daily average balance basis</span>
              </div>
            </div>

          </aside>
        </div>
      </div>
    </div>
  );
}