import { getUserAccounts, getRecentTransactions } from "@/app/(user)/lib/queries";
import PortfolioCards from "@/app/(user)/components/dashboard/accountportfolio";
import QuickActions from "@/app/(user)/components/dashboard/quickactions";
import WadiahSection from "@/app/(user)/components/dashboard/wadiah-account";
import MudarabahSection from "@/app/(user)/components/dashboard/mudarabah-account";
import TransactionTable from "@/app/(user)/components/dashboard/transactionledger";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const uId = Number((session?.user as { id?: string })?.id);

  const accounts = await getUserAccounts(uId);
  const transactions = await getRecentTransactions(uId);

  // Separate accounts by Islamic product type
  const wadiahAccounts = accounts.filter((a: any) => {
    const type = String(a.account_type ?? "").toLowerCase();
    return type === "wadi_ah" || type === "wadiah" || type === "current";
  });

  const mudarabahAccounts = accounts.filter((a: any) => {
    const type = String(a.account_type ?? "").toLowerCase();
    return type === "mudarabah" || type === "savings";
  });

  const totalAssets = accounts.reduce(
    (acc: number, curr: any) => acc + Number(curr.balance),
    0
  );

  const hasMudarabah = mudarabahAccounts.length > 0;

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-8">

      {/* ── Row 1: Portfolio Summary Header ── */}
      <PortfolioCards totalAssets={totalAssets} />

      {/* ── Row 2: Quick Action Buttons ── */}
      <QuickActions />

      {/* ── Row 3: Main Content Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* ── Left Column: Accounts + Transactions ── */}
        <div className="lg:col-span-8 space-y-8">

          {/* Wadiah Account(s) — always shown */}
          <WadiahSection accounts={wadiahAccounts} />

          {/* Mudarabah Account(s) + Analytics — conditional */}
          {hasMudarabah && (
            <MudarabahSection accounts={mudarabahAccounts} />
          )}

          {/* Transaction Ledger */}
          <TransactionTable transactions={transactions} />
        </div>

        {/* ── Right Column: Sidebar ── */}
        <aside className="lg:col-span-4 space-y-6">

          {/* Upsell card — only if user has no Mudarabah */}
          {!hasMudarabah && (
            <div className="p-6 bg-slate-900 rounded-2xl text-white">
              <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest">
                Growth Opportunity
              </p>
              <h4 className="text-lg font-bold mt-2">
                Open a Mudarabah Account
              </h4>
              <p className="text-xs text-white/60 mt-2 leading-relaxed">
                Start earning Shariah-compliant profit on your idle balance.
                No interest. No risk to principal.
              </p>
              <button className="w-full mt-5 py-2.5 bg-green-500 hover:bg-green-400 text-black text-xs font-bold rounded-xl transition-colors">
                Activate Now
              </button>
            </div>
          )}

          {/* Projected ROI insight — shown only when Mudarabah exists */}
          {hasMudarabah && (
            <div className="bg-slate-900 p-6 rounded-2xl text-white flex flex-col gap-4">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold text-white/50 uppercase tracking-widest">
                  Est. ROI (Mudarabah)
                </span>
              </div>
              <div>
                <p className="text-3xl font-bold text-white">4.82%</p>
                <p className="text-[10px] text-white/40 mt-1 uppercase tracking-tighter">
                  Projected Annual Yield
                </p>
              </div>
              <button className="w-full py-2.5 bg-white/10 hover:bg-white/20 text-white text-[11px] font-bold rounded-lg transition-colors">
                Portfolio Settings
              </button>
            </div>
          )}

          {/* Static Compliance Notice */}
          <div className="border border-slate-200 rounded-2xl p-5 bg-white">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">
              Shariah Compliance
            </p>
            <ul className="space-y-2">
              {[
                "All products certified Riba-free",
                "Audited by Shariah Supervisory Board",
                "SECP regulated Islamic window",
              ].map((item) => (
                <li key={item} className="flex items-center gap-2 text-[10px] text-slate-600 font-medium">
                  <span className="size-1.5 bg-green-500 rounded-full shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}