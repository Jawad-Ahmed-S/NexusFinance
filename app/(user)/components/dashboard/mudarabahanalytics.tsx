import React from "react";
import { TrendingUp, Info } from "lucide-react";

export default function MudarabahAnalytics() {
  return (
    <div className="bg-[#f8f9fa] border border-slate-200 p-6 rounded-2xl">
      <div className="flex justify-between items-start mb-4">
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Profit Accrual</p>
          <h4 className="text-xl font-bold text-slate-900 mt-1">+ PKR 4,120.50</h4>
        </div>
        <TrendingUp className="text-green-600 size-5" />
      </div>
      
      <div className="space-y-2 mt-6">
        <div className="flex justify-between text-[10px] font-bold border-b border-slate-100 pb-2">
            <span className="text-slate-400 uppercase">Pool Weightage</span>
            <span className="text-slate-900">0.00241</span>
        </div>
        <div className="flex justify-between text-[10px] font-bold pt-1">
            <span className="text-slate-400 uppercase">Next Payout</span>
            <span className="text-slate-900">May 01, 2026</span>
        </div>
      </div>

      <div className="mt-6 flex items-center gap-2 text-[10px] text-slate-400 italic">
        <Info size={12} />
        <span>Calculated on daily average balance</span>
      </div>
    </div>
  );
}