// app/(user)/dashboard/page.tsx
import { getUserAccounts, getRecentTransactions } from "@/app/(user)/lib/queries";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import Link from "next/link";
import {
  ShieldCheck, TrendingUp, ArrowRightLeft, Send,
  Smartphone, FileText, ChevronRight, ArrowUpRight,
  ArrowDownLeft, Wallet,
} from "lucide-react";

// ─── Helpers ────────────────────────────────────────────────

const fmt = (n: number) =>
  new Intl.NumberFormat("en-PK", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);

const timeAgo = (date: string | Date) => {
  const diff = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (diff < 60)  return `${diff}s ago`;
  const m = Math.floor(diff / 60);
  if (m < 60)     return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24)     return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
};

// ─── Page ───────────────────────────────────────────────────

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const uId     = Number((session?.user as { id?: string })?.id);
  const name    = (session?.user as { name?: string })?.name ?? "User";
  const firstName = name.split(" ")[0];

  const accounts     = await getUserAccounts(uId);
  const transactions = await getRecentTransactions(uId);

  const wadiahAccounts = accounts.filter((a: any) => {
    const t = String(a.account_type ?? "").toLowerCase();
    return t === "wadi_ah" || t === "wadiah" || t === "current";
  });

  const mudarabahAccounts = accounts.filter((a: any) => {
    const t = String(a.account_type ?? "").toLowerCase();
    return t === "mudarabah" || t === "savings";
  });

  const totalBalance    = accounts.reduce((s: number, a: any) => s + Number(a.balance), 0);
  const wadiahBalance   = wadiahAccounts.reduce((s: number, a: any) => s + Number(a.balance), 0);
  const mudarabahBalance = mudarabahAccounts.reduce((s: number, a: any) => s + Number(a.balance), 0);
  const hasMudarabah    = mudarabahAccounts.length > 0;

  const recentTxns = Array.isArray(transactions) ? transactions.slice(0, 5) : [];

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">

        {/* ── GREETING ── */}
        <div className="flex items-end justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
              Nexus Bank · Personal Banking
            </p>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 mt-1">
              Welcome back, {firstName}
            </h1>
          </div>
          <div className="text-right hidden sm:block">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Portfolio</p>
            <p className="text-xs font-medium text-slate-600">
              {accounts.length} account{accounts.length !== 1 ? "s" : ""} active
            </p>
          </div>
        </div>

        {/* ── TOTAL BALANCE HERO ── */}
        <div className="bg-slate-900 rounded-2xl p-8 shadow-sm shadow-slate-200/50">
          <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">
            Consolidated Net Worth
          </p>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-lg font-medium text-white/40">PKR</span>
            <h2 className="text-5xl font-bold text-white tracking-tighter tabular-nums">
              {fmt(totalBalance)}
            </h2>
          </div>
          <div className="mt-6 pt-5 border-t border-white/10 grid grid-cols-2 gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">
                Wadiah (Liquidity)
              </p>
              <p className="text-lg font-bold text-white tabular-nums mt-1">
                PKR {fmt(wadiahBalance)}
              </p>
            </div>
            {hasMudarabah ? (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-green-400/70">
                  Mudarabah (Investment)
                </p>
                <p className="text-lg font-bold text-green-400 tabular-nums mt-1">
                  PKR {fmt(mudarabahBalance)}
                </p>
              </div>
            ) : (
              <div className="flex items-center justify-end">
                <Link
                  href="/mudarabah"
                  className="text-[10px] font-bold uppercase tracking-widest text-white/40 hover:text-white transition-colors flex items-center gap-1"
                >
                  Open Investment Account
                  <ChevronRight size={10} />
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* ── QUICK ACTIONS ── */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Transfer",    icon: <Send size={16} />,       href: "/transfer",   primary: true  },
            { label: "Bills",       icon: <Smartphone size={16} />,  href: "/bills"                     },
            { label: "Statement",   icon: <FileText size={16} />,    href: "/statement"                  },
          ].map((a) => (
            <Link
              key={a.label}
              href={a.href}
              className={`flex flex-col items-center justify-center py-4 rounded-xl border transition-all gap-2 ${
                a.primary
                  ? "bg-slate-900 text-white border-slate-900 hover:bg-slate-800"
                  : "bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
              }`}
            >
              {a.icon}
              <span className="text-[10px] font-bold uppercase tracking-wide">{a.label}</span>
            </Link>
          ))}
        </div>

        {/* ── MAIN GRID ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* LEFT: Accounts + Transactions */}
          <div className="lg:col-span-8 space-y-6">

            {/* Wadiah Account Cards */}
            <section>
              <div className="flex items-center gap-2 mb-3">
                <ShieldCheck size={11} className="text-slate-400" />
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  Primary Liquidity — Wadiah Amanah
                </p>
              </div>
              <div className="space-y-3">
                {wadiahAccounts.length === 0 ? (
                  <div className="bg-white border border-slate-200 rounded-2xl p-6 text-center text-xs text-slate-400">
                    No Wadiah accounts found
                  </div>
                ) : (
                  wadiahAccounts.map((acc: any) => (
                    <div
                      key={acc.account_id}
                      className="bg-white border border-slate-200 rounded-2xl p-6 flex items-center justify-between hover:border-slate-300 transition-all shadow-sm shadow-slate-200/50"
                    >
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                          Wadiah Amanah Account
                        </p>
                        <p className="text-2xl font-bold text-slate-900 mt-1 tabular-nums">
                          <span className="text-sm font-medium text-slate-300 mr-1">PKR</span>
                          {fmt(Number(acc.balance))}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-mono text-slate-400">
                          ****{acc.account_id}
                        </p>
                        <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-md mt-1">
                          <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                          No Riba · Safe
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>

            {/* Mudarabah Snapshot — only if exists */}
            {hasMudarabah && (
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp size={11} className="text-slate-400" />
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    Investment Holdings — Mudarabah
                  </p>
                </div>
                {mudarabahAccounts.map((acc: any) => (
                  <div
                    key={acc.account_id}
                    className="bg-white border border-slate-200 border-l-4 border-l-green-500 rounded-2xl p-6 flex items-center justify-between hover:border-slate-300 transition-all"
                  >
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-green-600 italic">
                        Mudarabah · Profit Share
                      </p>
                      <p className="text-2xl font-bold text-slate-900 mt-1 tabular-nums">
                        <span className="text-sm font-medium text-slate-300 mr-1">PKR</span>
                        {fmt(Number(acc.balance))}
                      </p>
                    </div>
                    <Link
                      href="/mudarabah"
                      className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:text-slate-900 transition-colors border border-slate-200 rounded-lg px-3 py-2 hover:border-slate-400"
                    >
                      View Dashboard
                      <ChevronRight size={10} />
                    </Link>
                  </div>
                ))}
              </section>
            )}

            {/* Recent Transactions */}
            <section>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <ArrowRightLeft size={11} className="text-slate-400" />
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    Recent Activity
                  </p>
                </div>
                <Link
                  href="/transactions"
                  className="text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-colors flex items-center gap-1"
                >
                  View all <ChevronRight size={10} />
                </Link>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
                {recentTxns.length === 0 ? (
                  <div className="px-6 py-10 text-center text-xs text-slate-400">
                    No recent transactions
                  </div>
                ) : (
                  <div className="divide-y divide-slate-50">
                    {recentTxns.map((tx: any) => {
                      const isCredit = String(tx.direction ?? "").toUpperCase() === "CREDIT";
                      return (
                        <div
                          key={tx.txn_id ?? tx.transaction_id}
                          className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50/60 transition-colors"
                        >
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
                            isCredit ? "bg-green-50" : "bg-slate-100"
                          }`}>
                            {isCredit
                              ? <ArrowDownLeft size={14} className="text-green-600" />
                              : <ArrowUpRight  size={14} className="text-slate-500" />
                            }
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-800 truncate">
                              {tx.reference_note || tx.txn_type || "Transaction"}
                            </p>
                            <p className="text-[10px] text-slate-400 mt-0.5">
                              {timeAgo(tx.created_at)}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className={`font-mono font-semibold text-sm tabular-nums ${
                              isCredit ? "text-green-600" : "text-slate-900"
                            }`}>
                              {isCredit ? "+" : "−"} PKR {fmt(Number(tx.amount ?? 0))}
                            </p>
                            <p className="text-[10px] text-slate-400 mt-0.5 capitalize">
                              {String(tx.txn_type ?? "").toLowerCase()}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* RIGHT: Sidebar */}
          <aside className="lg:col-span-4 space-y-4">

            {/* Mudarabah CTA or Investment Insight */}
            {!hasMudarabah ? (
              <div className="bg-slate-900 rounded-2xl p-6 text-white">
                <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">
                  Growth Opportunity
                </p>
                <h4 className="text-lg font-bold mt-2 tracking-tight">
                  Open a Mudarabah Account
                </h4>
                <p className="text-xs text-white/50 mt-2 leading-relaxed">
                  Earn Shariah-compliant profit on your idle balance.
                  No interest. No risk to principal.
                </p>
                <Link
                  href="/mudarabah"
                  className="mt-5 w-full flex items-center justify-center py-2.5 bg-green-500 hover:bg-green-400 text-black text-xs font-bold rounded-xl transition-colors"
                >
                  Activate Now
                </Link>
              </div>
            ) : (
              <div className="bg-slate-900 rounded-2xl p-6 text-white space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">
                    Investment Summary
                  </p>
                  <TrendingUp size={14} className="text-green-400" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-1">
                    Invested Capital
                  </p>
                  <p className="text-2xl font-bold text-white tabular-nums">
                    PKR {fmt(mudarabahBalance)}
                  </p>
                </div>
                <div className="pt-4 border-t border-white/10 space-y-2">
                  <div className="flex justify-between text-[10px] font-bold">
                    <span className="text-white/40 uppercase">Est. Annual Yield</span>
                    <span className="text-green-400">4.82%</span>
                  </div>
                  <div className="flex justify-between text-[10px] font-bold">
                    <span className="text-white/40 uppercase">Cycle Status</span>
                    <span className="text-white">Open</span>
                  </div>
                </div>
                <Link
                  href="/mudarabah"
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-white/10 hover:bg-white/20 text-white text-[11px] font-bold rounded-lg transition-colors"
                >
                  View Investment Dashboard
                  <ChevronRight size={11} />
                </Link>
              </div>
            )}

            {/* Account Summary Card */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-4">
                Account Summary
              </p>
              <div className="space-y-3">
                {accounts.map((acc: any) => {
                  const t = String(acc.account_type ?? "").toLowerCase();
                  const isWadiah = t === "wadi_ah" || t === "wadiah";
                  return (
                    <div key={acc.account_id} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                      <div className="flex items-center gap-2.5">
                        <div className="w-6 h-6 rounded-md bg-slate-100 flex items-center justify-center">
                          {isWadiah
                            ? <ShieldCheck size={11} className="text-slate-500" />
                            : <TrendingUp  size={11} className="text-green-600" />
                          }
                        </div>
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
                            {isWadiah ? "Wadiah" : "Mudarabah"}
                          </p>
                          <p className="text-[9px] font-mono text-slate-400">****{acc.account_id}</p>
                        </div>
                      </div>
                      <p className="font-mono text-xs font-semibold text-slate-900 tabular-nums">
                        {fmt(Number(acc.balance))}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Shariah Compliance Badge */}
            <div className="bg-green-50 border border-green-200 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-2">
                <ShieldCheck size={14} className="text-green-600" />
                <p className="text-[10px] font-bold uppercase tracking-widest text-green-700">
                  Shariah Compliant
                </p>
              </div>
              <p className="text-xs text-green-700/70 leading-relaxed">
                All products are certified Halal. Zero riba. Fully compliant with Islamic finance principles.
              </p>
            </div>

          </aside>
        </div>
      </div>
    </div>
  );
}