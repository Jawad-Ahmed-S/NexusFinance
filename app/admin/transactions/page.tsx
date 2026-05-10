import { getTransactionsFromView } from "../lib/queries";
import TransactionsTable from "@/app/admin/components/transactionTable";
import { ArrowLeftRight, TrendingUp, TrendingDown, Activity, Wallet, Landmark, Link, LayoutDashboard } from "lucide-react";

async function getTransactionStats(transactions: Awaited<ReturnType<typeof getTransactionsFromView>>) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const totalCount = transactions.length;

  const totalTransferVolume = transactions
    .filter(t => t.txn_type === "transfer")
    .reduce((sum, t) => sum + t.amount, 0);

  const depositsToday = transactions
    .filter(t => new Date(t.created_at) >= today && t.txn_type === "deposit")
    .reduce((sum, t) => sum + t.amount, 0);

  const withdrawalsToday = transactions
    .filter(t => new Date(t.created_at) >= today && t.txn_type === "withdrawal")
    .reduce((sum, t) => sum + t.amount, 0);

  const activeTransferCount = transactions.filter(t => t.txn_type === "transfer").length;

  return { totalCount, totalTransferVolume, depositsToday, withdrawalsToday, activeTransferCount };
}

function formatAmount(amount: number) {
  return new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    maximumFractionDigits: 0,
  }).format(amount);
}

const TRANSACTION_TYPES = ["all", "deposit", "withdrawal", "transfer", "purification", "profit_distribution"];
const DIRECTIONS = ["all", "debit", "credit"];

export default async function AdminTransactionsPage({
  searchParams,
}: {
  searchParams: { type?: string; direction?: string; account?: string; customer?: string };
}) {
  const allTransactions = await getTransactionsFromView();
  const stats = await getTransactionStats(allTransactions);

  const filtered = allTransactions.filter(t => {
    if (searchParams.type && searchParams.type !== "all" && t.txn_type !== searchParams.type) return false;
    if (searchParams.direction && searchParams.direction !== "all" && t.direction !== searchParams.direction) return false;
    if (searchParams.account) {
      const acc = Number(searchParams.account);
      if (t.from_account !== acc && t.to_account !== acc) return false;
    }
    if (searchParams.customer) {
      const q = searchParams.customer.toLowerCase();
      if (!t.from_customer?.toLowerCase().includes(q) && !t.to_customer?.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const statCards = [
    {
      label: "Total Transactions",
      value: stats.totalCount.toLocaleString(),
      icon: Activity,
      featured: true,
    },
    {
      label: "Transfer Volume",
      value: formatAmount(stats.totalTransferVolume),
      icon: ArrowLeftRight,
      featured: false,
    },
    {
      label: "Deposits Today",
      value: formatAmount(stats.depositsToday),
      icon: TrendingUp,
      featured: false,
    },
    {
      label: "Withdrawals Today",
      value: formatAmount(stats.withdrawalsToday),
      icon: TrendingDown,
      featured: false,
    },
    {
      label: "Transfer Count",
      value: stats.activeTransferCount.toLocaleString(),
      icon: Wallet,
      featured: false,
    },
  ];

  const isFiltered = searchParams.type || searchParams.direction || searchParams.account || searchParams.customer;

  return (
    <main className="min-h-screen bg-[#FAFAFA] font-sans">

      {/* Page Header */}
      <header className="bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
            Financial Portal / Transaction Management
          </p>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2 mt-0.5">
            <Landmark strokeWidth={2} className="w-5 h-5 text-slate-400" />
            Transaction Management
          </h1>
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="/admin/dashboard"
            className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors"
          >
            
            Dashboard
          </Link>
        </div>
      </header>
      
      

      {/* Stat Cards */}
      <div className="p-6 space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {statCards.map(card => (
          <div
            key={card.label}
            className={`rounded-2xl border p-4 flex flex-col justify-between gap-4 ${
              card.featured
                ? "bg-slate-900 border-slate-800"
                : "bg-white border-slate-200"
            }`}
          >
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
              card.featured ? "bg-slate-800" : "bg-slate-100"
            }`}>
              <card.icon className={`w-3.5 h-3.5 ${card.featured ? "text-slate-300" : "text-slate-500"}`} />
            </div>
            <div>
              <p className={`text-[10px] font-bold tracking-widest uppercase ${
                card.featured ? "text-slate-500" : "text-slate-400"
              }`}>
                {card.label}
              </p>
              <p className={`text-base font-semibold mt-0.5 tabular-nums ${
                card.featured ? "text-white" : "text-slate-900"
              }`}>
                {card.value}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5">
        <form method="GET">
          <div className="flex flex-wrap gap-4 items-end">

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                Type
              </label>
              <select
                name="type"
                defaultValue={searchParams.type ?? "all"}
                className="text-xs border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-200 transition-colors hover:border-slate-300 min-w-[130px]"
              >
                {TRANSACTION_TYPES.map(t => (
                    <option key={t} value={t}>
                    {t === "all" ? "All Types" : t.replace("_", " ").replace(/\b\w/g, c => c.toUpperCase())}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                Direction
              </label>
              <select
                name="direction"
                defaultValue={searchParams.direction ?? "all"}
                className="text-xs border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-200 transition-colors hover:border-slate-300 min-w-[110px]"
              >
                {DIRECTIONS.map(d => (
                  <option key={d} value={d}>
                    {d === "all" ? "All Directions" : d.charAt(0).toUpperCase() + d.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                Account ID
              </label>
              <input
                name="account"
                type="number"
                defaultValue={searchParams.account ?? ""}
                placeholder="e.g. 3"
                className="text-xs border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-700 w-24 focus:outline-none focus:ring-2 focus:ring-slate-200 transition-colors hover:border-slate-300 placeholder:text-slate-300"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                Customer
              </label>
              <input
                name="customer"
                type="text"
                defaultValue={searchParams.customer ?? ""}
                placeholder="Search name..."
                className="text-xs border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-700 w-40 focus:outline-none focus:ring-2 focus:ring-slate-200 transition-colors hover:border-slate-300 placeholder:text-slate-300"
                />
            </div>

            <div className="flex gap-2 pb-0.5">
              <button
                type="submit"
                className="text-xs font-medium bg-slate-900 text-white rounded-lg px-4 py-2 hover:bg-slate-700 transition-colors"
                >
                Apply
              </button>
              {isFiltered && (
                <a
                  href="/admin/transactions"
                  className="text-xs font-medium text-slate-500 border border-slate-200 rounded-lg px-4 py-2 hover:border-slate-300 hover:text-slate-700 transition-colors"
                >
                  Reset
                </a>
              )}
            </div>

          </div>

          {isFiltered && (
            <p className="text-[10px] text-slate-400 mt-3 tracking-wide">
              {filtered.length} of {allTransactions.length} transactions match filters
            </p>
          )}
        </form>
      </div>
    <section className="bg-white rounded-2xl border border-slate-200 p-6">
      <TransactionsTable transactions={filtered} />
    </section>
    </div>
    </main>
  );
}