import React from "react";
import { ShieldCheck, Car, Briefcase } from "lucide-react";

export default function ActiveProducts() {
  const products = [
    { name: "Takaful Life", sub: "Policy: #9928", icon: <ShieldCheck size={16} /> },
    { name: "Auto Ijarah", sub: "VHR-8829", icon: <Car size={16} /> },
    { name: "Business Finance", sub: "Mudarabah Fixed", icon: <Briefcase size={16} /> },
  ];

  return (
    <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
      <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6">Active Portfolio</h3>
      <div className="space-y-4">
        {products.map((p) => (
          <div key={p.name} className="flex items-center gap-4 group cursor-pointer border-b border-slate-50 pb-3 last:border-0 last:pb-0">
            <div className="size-9 bg-slate-50 text-slate-400 rounded-lg flex items-center justify-center group-hover:bg-slate-900 group-hover:text-white transition-colors">
              {p.icon}
            </div>
            <div>
              <p className="text-xs font-bold text-slate-800">{p.name}</p>
              <p className="text-[9px] text-slate-400 uppercase font-medium">{p.sub}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}