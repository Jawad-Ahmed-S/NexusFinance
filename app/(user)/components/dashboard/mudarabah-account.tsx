import React from "react";
import { TrendingUp, Info } from "lucide-react";

interface MudarabahSectionProps {
  accounts: any[];
}

export default function MudarabahAccount({ accounts }: MudarabahSectionProps) {
  // Conditionally rendered by parent, but guard here too
  if (!accounts || accounts.length === 0) return null;

  return (
    <section className="space-y-3">
      {/* Section Label */}
      <div className="flex items-center gap-2 px-1">
        <TrendingUp size={11} className="text-slate-400" />
        <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em]">
          Investment Holdings — Mudarabah
        </h3>
      </div>

      {accounts.map((account: any) => (
        <div key={account.account_id} className="space-y-3">
          {/* Account Balance Card */}
          <div className="bg-slate-50 border border-slate-200 border-l-4 border-l-green-500 rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="text-[10px] font-bold text-green-600 uppercase tracking-tighter italic">
                Mudarabah Saving (Profit Share)
              </p>
              <p className="text-2xl font-bold text-slate-900 mt-1 tabular-nums">
                <span className="text-sm font-medium text-slate-300 mr-2">PKR</span>
                {Number(account.balance).toLocaleString()}
              </p>
            </div>
            <div className="sm:text-right">
              <p className="text-[10px] font-bold text-slate-900 uppercase">
                Weightage: 0.024
              </p>
              <p className="text-[10px] text-slate-400 mt-1">ROI Tracking Active</p>
            </div>
          </div>

          {/* Analytics Panel */}
          <div className="bg-[#f8f9fa] border border-slate-200 rounded-2xl p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Profit Accrual
                </p>
                <h4 className="text-xl font-bold text-slate-900 mt-1">+ PKR 4,120.50</h4>
              </div>
              <TrendingUp className="text-green-600 size-5 shrink-0" />
            </div>

            <div className="space-y-2 mt-4">
              <div className="flex justify-between text-[10px] font-bold border-b border-slate-100 pb-2">
                <span className="text-slate-400 uppercase">Pool Weightage</span>
                <span className="text-slate-900">0.00241</span>
              </div>
              <div className="flex justify-between text-[10px] font-bold pt-1">
                <span className="text-slate-400 uppercase">Next Payout</span>
                <span className="text-slate-900">May 01, 2026</span>
              </div>
            </div>

            <div className="mt-5 flex items-center gap-2 text-[10px] text-slate-400 italic">
              <Info size={12} />
              <span>Calculated on daily average balance</span>
            </div>
          </div>
        </div>
      ))}
    </section>
  );
}