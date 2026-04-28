import React from "react";
import { ShieldCheck } from "lucide-react";

interface WadiahSectionProps {
  accounts: any[];
}

export default function WadiahAccount({ accounts }: WadiahSectionProps) {
  if (!accounts || accounts.length === 0) return null;

  return (
    <section className="space-y-3">
      {/* Section Label */}
      <div className="flex items-center gap-2 px-1">
        <ShieldCheck size={11} className="text-slate-400" />
        <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em]">
          Primary Liquidity — Wadiah Amanah
        </h3>
      </div>

      {/* Account Cards */}
      {accounts.map((account: any) => (
        <div
          key={account.account_id}
          className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 hover:border-slate-300 transition-all"
        >
          {/* Left: label + balance */}
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
              Wadiah Amanah Account
            </p>
            <p className="text-2xl font-bold text-slate-900 mt-1 tabular-nums">
              <span className="text-sm font-medium text-slate-300 mr-2">PKR</span>
              {Number(account.balance).toLocaleString()}
            </p>
          </div>

          {/* Right: ID + badge */}
          <div className="flex sm:flex-col sm:items-end items-center gap-3 sm:gap-1">
            <p className="text-[10px] font-mono text-slate-400 italic">
              ID: ****{account.account_id}
            </p>
            <span className="inline-flex items-center gap-1 text-[9px] font-black tracking-widest uppercase text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-md">
              <span className="size-1.5 bg-green-500 rounded-full inline-block" />
              No Riba · Safe
            </span>
          </div>
        </div>
      ))}
    </section>
  );
}