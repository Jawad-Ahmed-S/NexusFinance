import React from "react";
import { TrendingUp, PieChart } from "lucide-react";

interface PortfolioCardsProps {
  totalAssets: number;
}

export default function PortfolioCards({ totalAssets }: PortfolioCardsProps) {
  return (
    <div className="space-y-6">
      {/* Page Heading */}
      <div className="flex justify-between items-end border-b border-slate-100 pb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Executive Summary
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time valuation of your Shariah-compliant holdings.
          </p>
        </div>
        <div className="text-right hidden sm:block">
          <p className="text-[10px] font-bold text-slate-400 uppercase">Last Refreshed</p>
          <p className="text-xs font-medium text-slate-700">Just now</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Consolidated Card */}
        <div className="lg:col-span-2 bg-white border border-slate-200 p-8 rounded-2xl shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Consolidated Liquidity
              </p>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-lg font-medium text-slate-400">PKR</span>
                {/* Sizing fixed here from 7xl to 5xl */}
                <h2 className="text-5xl font-bold text-slate-900 tracking-tighter">
                  {Number(totalAssets).toLocaleString()}
                </h2>
              </div>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl">
               <PieChart size={20} className="text-slate-400" />
            </div>
          </div>
          
          <div className="mt-8 grid grid-cols-2 gap-4 pt-6 border-t border-slate-50">
            <div className="flex items-center gap-2">
              <div className="size-2 bg-green-500 rounded-full" />
              <span className="text-[11px] font-bold text-slate-600 uppercase">Status: Fully Verified</span>
            </div>
            <div className="flex items-center gap-2 justify-end">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-tight">Standard Portfolio</span>
            </div>
          </div>
        </div>

        {/* Small "Insights" Card */}
        <div className="bg-slate-900 p-8 rounded-2xl flex flex-col justify-between shadow-lg">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-bold text-white/50 uppercase tracking-widest">Est. ROI (Mudarabah)</span>
            <TrendingUp size={16} className="text-green-400" />
          </div>
          <div>
            <p className="text-3xl font-bold text-white">4.82%</p>
            <p className="text-[10px] text-white/40 mt-1 uppercase tracking-tighter">Projected Annual Yield</p>
          </div>
          <button className="w-full py-2.5 bg-white/10 hover:bg-white/20 text-white text-[11px] font-bold rounded-lg transition-colors">
            Portfolio Settings
          </button>
        </div>
      </div>
    </div>
  );
}