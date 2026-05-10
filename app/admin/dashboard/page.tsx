import {
    getSystemOverview,
    getAccountTypeBreakdown,
    getAccountStatusSnapshot,
    getRecentTransactions,
    getRecentAccountActivity,
    getAccountRequestsSummary,
    getTransactionsFromView,
  } from "../lib/queries";
  
  import {
    Users,
    Landmark,
    ArrowLeftRight,
    DollarSign,
    ShieldCheck,
    ShieldOff,
    Archive,
    TrendingUp,
    Clock,
    CheckCircle2,
    XCircle,
    AlertCircle,
    ChevronRight,
    LayoutDashboard,
    FileText,
    UserCog,
    ListChecks,
  } from "lucide-react";
  import Link from "next/link";
  import TransactionsTable from "@/app/admin/components/transactionTable";
  
  // ─── helpers ────────────────────────────────────────────────
  
  function fmt(n: number) {
    return new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(n);
  }
  
  function fmtCount(n: number) {
    return new Intl.NumberFormat("en-US").format(n);
  }
  
  function timeAgo(date: Date) {
    const diff = Date.now() - date.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  }
  
  // ─── Async data fetcher (independent, never blocks each other) ───
  
  async function safeCall<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
    try {
      return await fn();
    } catch (error) {
      console.error("❌ SAFECALL ERROR:", error); // add this
      return fallback;
    }
  }
  
  // ─── page ────────────────────────────────────────────────────
  
  export default async function AdminDashboardPage() {
    // All queries fire in parallel — one failure doesn't block others
    const [overview, typeBreakdown, statusSnap, recentTxns, recentActivity, requestsSummary] =
      await Promise.all([
        safeCall(getSystemOverview, {
          totalCustomers: 0,
          totalAccounts: 0,
          totalTransactions: 0,
          totalBalance: 0,
        }),
        safeCall(getAccountTypeBreakdown, {
          wadiah: { count: 0, balance: 0 },
          mudarabah: { count: 0, balance: 0 },
        }),
        safeCall(getAccountStatusSnapshot, { active: 0, frozen: 0, closed: 0 }),
        safeCall(() => getRecentTransactions(20), []),
        safeCall(() => getRecentAccountActivity(10), []),
        safeCall(getAccountRequestsSummary, {
          pending: 0,
          rejected: 0,
          approvedToday: 0,
        }),
      ]);
  
    const now = new Date();
    const transactions1 = await getTransactionsFromView();

    return (

      <main className="min-h-screen bg-[#FAFAFA] font-sans">
        {/* ── HEADER ── */}
        <header className="bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
              Financial Portal / Retail Banking
            </p>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2 mt-0.5">
              <LayoutDashboard strokeWidth={2} className="w-5 h-5 text-slate-400" />
              System Dashboard
            </h1>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-600" />
            <span>
              Last updated:{" "}
              {now.toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
        </header>
  
        <div className="px-8 py-8 max-w-[1400px] mx-auto space-y-8">
  
          {/* ── 1. SYSTEM OVERVIEW CARDS ── */}
          <section>
            <SectionLabel>System Overview</SectionLabel>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3">
              <OverviewCard
                icon={<Users strokeWidth={2} className="w-4 h-4" />}
                label="Total Customers"
                value={fmtCount(overview.totalCustomers)}
              />
              <OverviewCard
                icon={<Landmark strokeWidth={2} className="w-4 h-4" />}
                label="Total Accounts"
                value={fmtCount(overview.totalAccounts)}
              />
              <OverviewCard
                icon={<ArrowLeftRight strokeWidth={2} className="w-4 h-4" />}
                label="Total Transactions"
                value={fmtCount(overview.totalTransactions)}
              />
              <OverviewCard
                icon={<DollarSign strokeWidth={2} className="w-4 h-4" />}
                label="System Balance"
                value={`PKR ${fmt(overview.totalBalance)}`}
                highlight
              />
            </div>
          </section>
  
          {/* ── 2. ACCOUNT TYPE BREAKDOWN + 3. STATUS SNAPSHOT ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
  
            {/* Type Breakdown */}
            <section className="bg-white rounded-2xl border border-slate-200 p-6">
              <SectionLabel>Account Type Breakdown</SectionLabel>
              <div className="mt-4 space-y-4">
                {/* Wadiah */}
                <div className="flex items-start justify-between py-3 border-b border-slate-100">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">
                      Wadiah
                    </p>
                    <p className="text-2xl font-bold tabular-nums tracking-tight text-slate-900">
                      PKR {fmt(typeBreakdown.wadiah.balance)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">
                      Accounts
                    </p>
                    <p className="text-2xl font-bold tabular-nums text-slate-900">
                      {fmtCount(typeBreakdown.wadiah.count)}
                    </p>
                  </div>
                </div>
                {/* Mudarabah */}
                <div className="flex items-start justify-between py-3">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">
                      Mudarabah
                    </p>
                    <p className="text-2xl font-bold tabular-nums tracking-tight text-slate-900">
                      PKR {fmt(typeBreakdown.mudarabah.balance)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">
                      Accounts
                    </p>
                    <p className="text-2xl font-bold tabular-nums text-slate-900">
                      {fmtCount(typeBreakdown.mudarabah.count)}
                    </p>
                  </div>
                </div>
                {/* bar */}
                {(() => {
                  const total = typeBreakdown.wadiah.balance + typeBreakdown.mudarabah.balance;
                  const wPct = total > 0 ? (typeBreakdown.wadiah.balance / total) * 100 : 50;
                  return (
                    <div className="flex h-1.5 rounded-full overflow-hidden bg-slate-100">
                      <div
                        className="bg-slate-900 transition-all"
                        style={{ width: `${wPct}%` }}
                      />
                      <div className="bg-green-600 flex-1" />
                    </div>
                  );
                })()}
                <div className="flex text-[10px] font-bold uppercase tracking-widest text-slate-400 justify-between">
                  <span>Wadiah</span><span>Mudarabah</span>
                </div>
              </div>
            </section>
  
            {/* Status Snapshot */}
            <section className="bg-white rounded-2xl border border-slate-200 p-6">
              <SectionLabel>Account Status Snapshot</SectionLabel>
              <div className="mt-4 space-y-3">
                <StatusRow
                  icon={<ShieldCheck strokeWidth={2} className="w-4 h-4 text-green-600" />}
                  label="Active"
                  count={statusSnap.active}
                  total={overview.totalAccounts}
                  color="bg-green-600"
                />
                <StatusRow
                  icon={<ShieldOff strokeWidth={2} className="w-4 h-4 text-amber-500" />}
                  label="Frozen"
                  count={statusSnap.frozen}
                  total={overview.totalAccounts}
                  color="bg-amber-400"
                />
                <StatusRow
                  icon={<Archive strokeWidth={2} className="w-4 h-4 text-slate-400" />}
                  label="Closed"
                  count={statusSnap.closed}
                  total={overview.totalAccounts}
                  color="bg-slate-300"
                />
              </div>
            </section>
          </div>
  
            {/* Recent Transactions */}
            <section className="bg-white rounded-2xl border border-slate-200 p-6">
            
            if(transactions){
              <TransactionsTable transactions={transactions1} />
            }
            </section>
  
          {/* ── 5. RECENT ACCOUNT ACTIVITY + 7. REQUESTS SUMMARY ── */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
  
            {/* Recent Account Activity */}
            <section className="md:col-span-2 bg-white rounded-2xl border border-slate-200">
              <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-slate-100">
                <SectionLabel>Recent Account Activity</SectionLabel>
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-300">
                  Last 10
                </span>
              </div>
              <div className="divide-y divide-slate-50">
                {recentActivity.length === 0 ? (
                  <p className="px-6 py-8 text-center text-slate-400 text-xs">No recent activity</p>
                ) : (
                  recentActivity.map((acc) => (
                    <div
                      key={acc.accountId}
                      className="flex items-center justify-between px-6 py-3.5 hover:bg-slate-50/60 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`w-2 h-2 rounded-full flex-shrink-0 ${
                            acc.status === "active"
                              ? "bg-green-500"
                              : acc.status === "frozen"
                              ? "bg-amber-400"
                              : "bg-slate-300"
                          }`}
                        />
                        <div>
                          <p className="text-sm font-medium text-slate-800">
                            Account #{acc.accountId}
                          </p>
                          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                            {acc.accountType} · Customer #{acc.customerId}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                            acc.status === "active"
                              ? "bg-green-50 text-green-700"
                              : acc.status === "frozen"
                              ? "bg-amber-50 text-amber-700"
                              : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {acc.status}
                        </span>
                        <p className="text-[10px] text-slate-400 mt-1">
                          {timeAgo(acc.openedAt)}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>
  
            {/* Account Requests Summary */}
            <section className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col justify-between">
              <SectionLabel>Account Requests</SectionLabel>
              <div className="mt-4 space-y-4 flex-1">
                <RequestMetric
                  icon={<AlertCircle strokeWidth={2} className="w-4 h-4 text-amber-500" />}
                  label="Pending"
                  value={requestsSummary.pending}
                />
                <RequestMetric
                  icon={<XCircle strokeWidth={2} className="w-4 h-4 text-slate-400" />}
                  label="Rejected"
                  value={requestsSummary.rejected}
                />
                <RequestMetric
                  icon={<CheckCircle2 strokeWidth={2} className="w-4 h-4 text-green-600" />}
                  label="Approved Today"
                  value={requestsSummary.approvedToday}
                  green
                />
              </div>
              <Link
                href="/admin/requests"
                className="mt-6 w-full flex items-center justify-center gap-2 py-2.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
              >
                <ListChecks strokeWidth={2} className="w-3.5 h-3.5" />
                View all requests
              </Link>
            </section>
          </div>
  
          {/* ── 6. QUICK ACTIONS ── */}
          <section>
            <SectionLabel>Quick Actions</SectionLabel>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
              <QuickAction href="/admin/accounts" icon={<Landmark strokeWidth={2} className="w-4 h-4" />} label="View All Accounts" />
              <QuickAction href="/admin/transactions" icon={<ArrowLeftRight strokeWidth={2} className="w-4 h-4" />} label="View All Transactions" />
              <QuickAction href="/admin/requests" icon={<FileText strokeWidth={2} className="w-4 h-4" />} label="Account Requests" />
              <QuickAction href="/admin/users" icon={<UserCog strokeWidth={2} className="w-4 h-4" />} label="User Management" />
            </div>
          </section>
  
        </div>
      </main>
    );
  }
  
  // ─── Small components ────────────────────────────────────────
  
  function SectionLabel({ children }: { children: React.ReactNode }) {
    return (
      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{children}</p>
    );
  }
  
  function OverviewCard({
    icon,
    label,
    value,
    highlight = false,
  }: {
    icon: React.ReactNode;
    label: string;
    value: string;
    highlight?: boolean;
  }) {
    return (
      <div
        className={`rounded-2xl border p-5 ${
          highlight
            ? "bg-slate-900 border-slate-900 shadow-sm shadow-slate-200/50"
            : "bg-white border-slate-200"
        }`}
      >
        <div className={`mb-3 ${highlight ? "text-slate-400" : "text-slate-400"}`}>{icon}</div>
        <p
          className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${
            highlight ? "text-slate-400" : "text-slate-400"
          }`}
        >
          {label}
        </p>
        <p
          className={`text-xl font-bold tabular-nums tracking-tight ${
            highlight ? "text-white" : "text-slate-900"
          }`}
        >
          {value}
        </p>
      </div>
    );
  }
  
  function StatusRow({
    icon,
    label,
    count,
    total,
    color,
  }: {
    icon: React.ReactNode;
    label: string;
    count: number;
    total: number;
    color: string;
  }) {
    const pct = total > 0 ? Math.round((count / total) * 100) : 0;
    return (
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {icon}
            <span className="text-sm font-medium text-slate-700">{label}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-mono font-semibold text-slate-900 tabular-nums">
              {fmtCount(count)}
            </span>
            <span className="text-[10px] font-bold text-slate-400">{pct}%</span>
          </div>
        </div>
        <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
          <div className={`h-full ${color} rounded-full`} style={{ width: `${pct}%` }} />
        </div>
      </div>
    );
  }
  
  function RequestMetric({
    icon,
    label,
    value,
    green = false,
  }: {
    icon: React.ReactNode;
    label: string;
    value: number;
    green?: boolean;
  }) {
    return (
      <div className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0">
        <div className="flex items-center gap-2">
          {icon}
          <span className="text-sm text-slate-600">{label}</span>
        </div>
        <span
          className={`font-mono font-bold tabular-nums text-lg ${
            green ? "text-green-600" : "text-slate-900"
          }`}
        >
          {fmtCount(value)}
        </span>
      </div>
    );
  }
  
  function QuickAction({
    href,
    icon,
    label,
  }: {
    href: string;
    icon: React.ReactNode;
    label: string;
  }) {
    return (
      <Link
        href={href}
        className="bg-white border border-slate-200 rounded-2xl px-5 py-4 flex items-center gap-3 hover:bg-slate-50 hover:border-slate-300 transition-all group"
      >
        <span className="text-slate-400 group-hover:text-slate-700 transition-colors">{icon}</span>
        <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900 transition-colors">
          {label}
        </span>
        <ChevronRight strokeWidth={2} className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-500 ml-auto transition-colors" />
      </Link>
    );
  }