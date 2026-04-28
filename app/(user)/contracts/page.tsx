import React from "react";
import { getServerSession } from "next-auth";
import {
  ArrowLeft,
  ShieldCheck,
  Wallet,
  Landmark,
  Car,
  Home,
  HandCoins,
  ArrowUpRight,
  TrendingUp,
  Info,
} from "lucide-react";
import Link from "next/link";
import { getUserAccounts } from "@/app/(user)/lib/queries";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
// ─── Types ────────────────────────────────────────────────────────────────────

interface Account {
  account_id: string | number;
  account_type: string;
  balance: number | string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isWadiah(type: string) {
  const t = type.toLowerCase();
  return t === "wadiah" || t === "wadi_ah" || t === "current";
}

function isMudarabah(type: string) {
  const t = type.toLowerCase();
  return t === "mudarabah" || t === "savings";
}

// ─── Sub-component: Active Account Card ──────────────────────────────────────

function WadiahCard({ account }: { account: Account }) {
  return (
    <div className="bg-white border border-slate-200 border-l-4 border-l-slate-700 rounded-xl p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="size-10 bg-slate-100 rounded-lg flex items-center justify-center text-slate-600">
            <Landmark size={18} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Wadiah Amanah</p>
            <p className="text-sm font-bold text-slate-900 mt-0.5">Current Account</p>
          </div>
        </div>
        <span className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-green-700 bg-green-50 border border-green-200 px-2.5 py-1 rounded-lg">
          <span className="size-1.5 bg-green-500 rounded-full" />
          Active
        </span>
      </div>

      <div className="mt-5 flex items-end justify-between gap-4 flex-wrap">
        <div>
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Balance</p>
          <p className="text-2xl font-bold text-slate-900 tabular-nums mt-1">
            <span className="text-sm font-medium text-slate-400 mr-1.5">PKR</span>
            {Number(account.balance).toLocaleString()}
          </p>
        </div>
        <div className="text-right">
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Account ID</p>
          <p className="text-xs font-mono text-slate-500 mt-1">****{account.account_id}</p>
          <p className="text-[9px] font-black text-green-700 mt-1 uppercase tracking-wider">No Riba · Safe</p>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-slate-100">
        <div className="flex items-start gap-2 text-[10px] text-slate-400">
          <Info size={12} className="shrink-0 mt-0.5" />
          <span>Your funds are held in trust (amanah). The bank guarantees return of principal. No profit share — no riba.</span>
        </div>
      </div>
    </div>
  );
}

function MudarabahCard({ account }: { account: Account }) {
  return (
    <div className="bg-white border border-slate-200 border-l-4 border-l-green-500 rounded-xl p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="size-10 bg-green-50 rounded-lg flex items-center justify-center text-green-700">
            <TrendingUp size={18} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Mudarabah</p>
            <p className="text-sm font-bold text-slate-900 mt-0.5">Profit-Sharing Account</p>
          </div>
        </div>
        <span className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-green-700 bg-green-50 border border-green-200 px-2.5 py-1 rounded-lg">
          <span className="size-1.5 bg-green-500 rounded-full" />
          Active
        </span>
      </div>

      <div className="mt-5 flex items-end justify-between gap-4 flex-wrap">
        <div>
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Balance</p>
          <p className="text-2xl font-bold text-slate-900 tabular-nums mt-1">
            <span className="text-sm font-medium text-slate-400 mr-1.5">PKR</span>
            {Number(account.balance).toLocaleString()}
          </p>
        </div>
        <div className="text-right">
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Est. ROI</p>
          <p className="text-lg font-bold text-green-600 mt-1">4.82% p.a.</p>
          <p className="text-[9px] text-slate-400 mt-0.5">Next payout: May 1, 2026</p>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-slate-100">
        <div className="flex items-start gap-2 text-[10px] text-slate-400">
          <Info size={12} className="shrink-0 mt-0.5" />
          <span>Profit is distributed monthly based on your pool weightage. Capital is not guaranteed — invested in Shariah-screened assets only.</span>
        </div>
      </div>
    </div>
  );
}

// ─── Sub-component: Other Products Section ────────────────────────────────────

const OTHER_PRODUCTS = [
  {
    icon: <Car size={16} />,
    title: "Auto Ijarah",
    desc: "Lease-to-own vehicle financing. No interest — structured as a rental with gradual ownership transfer.",
    tag: "Ijarah",
    color: "text-slate-700 bg-slate-100",
  },
  {
    icon: <Home size={16} />,
    title: "Home Musharakah",
    desc: "Diminishing Musharakah for home purchase. Co-own with the bank and buy out its share over time.",
    tag: "Musharakah",
    color: "text-amber-700 bg-amber-50",
  },
  {
    icon: <HandCoins size={16} />,
    title: "Qarz-e-Hasana",
    desc: "Benevolent interest-free loan for personal needs. Repay only what you borrow — nothing more.",
    tag: "Qard",
    color: "text-blue-700 bg-blue-50",
  },
];

function OtherProductCard({ icon, title, desc, tag, color }: typeof OTHER_PRODUCTS[0]) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className={`size-9 rounded-lg flex items-center justify-center ${color}`}>
          {icon}
        </div>
        <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md border ${color} border-current/20`}>
          {tag}
        </span>
      </div>
      <div>
        <p className="text-sm font-bold text-slate-900">{title}</p>
        <p className="text-[11px] text-slate-500 leading-relaxed mt-1">{desc}</p>
      </div>
      <div className="mt-auto">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Not enrolled</span>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default async function ContractsPage({
}: {
  params: Promise<{ userId: string }>;
}) {
  const session = await getServerSession(authOptions);
  const userId = Number((session?.user as { id?: string })?.id);
  const accounts: Account[] = await getUserAccounts(userId);

  const wadiahAccounts    = accounts.filter(a => isWadiah(String(a.account_type)));
  const mudarabahAccounts = accounts.filter(a => isMudarabah(String(a.account_type)));
  const hasAnyAccount     = wadiahAccounts.length > 0 || mudarabahAccounts.length > 0;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">

        {/* ── Header ── */}
        <div className="flex items-center gap-4">
          <Link
            href=".."
            className="size-9 flex items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50 transition-all shadow-sm"
          >
            <ArrowLeft size={16} />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">My Contracts</h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
              Active Islamic Finance Products
            </p>
          </div>
        </div>

        {/* ── Active Accounts ── */}
        {hasAnyAccount ? (
          <section className="space-y-4">
            <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] px-1">
              Your Accounts
            </h2>

            {wadiahAccounts.map(acc => (
              <WadiahCard key={acc.account_id} account={acc} />
            ))}

            {mudarabahAccounts.map(acc => (
              <MudarabahCard key={acc.account_id} account={acc} />
            ))}
          </section>
        ) : (
          <div className="bg-white border border-slate-200 rounded-xl p-10 text-center shadow-sm">
            <div className="size-12 bg-slate-50 rounded-xl flex items-center justify-center mx-auto mb-3">
              <Wallet size={20} className="text-slate-400" />
            </div>
            <p className="font-bold text-slate-800 text-sm">No active accounts found</p>
            <p className="text-xs text-slate-400 mt-1">Contact your branch to get started.</p>
          </div>
        )}

        {/* ── Other Products ── */}
        <section className="space-y-4">
          <div className="flex items-end justify-between px-1">
            <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em]">
              Other Products
            </h2>
            <Link
              href="./products"
              className="flex items-center gap-1 text-[10px] font-bold text-slate-600 hover:text-slate-900 transition-colors"
            >
              See all
              <ArrowUpRight size={11} />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {OTHER_PRODUCTS.map(p => (
              <OtherProductCard key={p.title} {...p} />
            ))}
          </div>

          {/* CTA */}
          <div className="bg-slate-900 rounded-xl p-5 flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold text-white">Interested in any of these?</p>
              <p className="text-[10px] text-white/50 mt-0.5">Get personalised product recommendations.</p>
            </div>
            <Link
              href="./products"
              className="shrink-0 flex items-center gap-2 px-4 py-2.5 bg-green-500 hover:bg-green-400 text-black text-[11px] font-bold rounded-xl transition-colors"
            >
              Explore
              <ArrowUpRight size={13} />
            </Link>
          </div>
        </section>

        {/* ── Compliance note ── */}
        <div className="flex items-center gap-2 justify-center pb-2">
          <ShieldCheck size={13} className="text-green-600" />
          <p className="text-[10px] text-slate-400 font-medium">
            All products are Shariah-certified and SECP-regulated.
          </p>
        </div>

      </div>
    </div>
  );
}