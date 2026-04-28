import React from "react";
import { Send, Smartphone, FileText, Globe } from "lucide-react";

export default function QuickActions() {
  const actions = [
    { label: "Transfer", icon: <Send size={18} />, primary: true },
    { label: "Bills", icon: <Smartphone size={18} /> },
    { label: "E-Statement", icon: <FileText size={18} /> },
    { label: "Global", icon: <Globe size={18} /> },
  ];

  return (
    <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
      <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6">Operations</h3>
      <div className="grid grid-cols-2 gap-3">
        {actions.map((act) => (
          <button key={act.label} className={`flex flex-col items-center justify-center p-4 rounded-xl transition-all border ${act.primary ? 'bg-slate-900 text-white border-slate-900 hover:bg-slate-800' : 'bg-white text-slate-600 border-slate-100 hover:border-slate-300 hover:bg-slate-50'}`}>
            {act.icon}
            <span className="text-[10px] font-bold mt-2 tracking-tight">{act.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}