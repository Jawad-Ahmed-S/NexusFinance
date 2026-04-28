import React from "react";
import { Wallet, Landmark } from "lucide-react";

export default function AccountList({ accounts }: { accounts: any[] }) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center px-1">
        <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em]">
          Account Breakdown
        </h3>
        <button className="text-[10px] font-bold text-slate-900 hover:underline">+ Open New Account</button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {accounts.map((acc) => (
          <div key={acc.account_id} className="bg-white border border-slate-200 p-6 rounded-xl shadow-sm hover:border-slate-300 transition-all">
            <div className="flex items-center gap-3 mb-4">
              <div className="size-8 bg-slate-50 rounded flex items-center justify-center">
                {acc.account_type === 'SAVINGS' ? <Landmark size={14} className="text-slate-400" /> : <Wallet size={14} className="text-slate-400" />}
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-800 uppercase tracking-tight">
                  {acc.account_type} ACCOUNT
                </p>
                <p className="text-[9px] text-slate-400 font-mono">ID: ****{acc.account_id}</p>
              </div>
            </div>
            
            <div className="flex items-baseline gap-1">
              <span className="text-[10px] font-medium text-slate-400 uppercase">PKR</span>
              <p className="text-2xl font-bold text-slate-900">
                {Number(acc.balance).toLocaleString()}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}