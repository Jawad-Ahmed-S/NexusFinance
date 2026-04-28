"use client";

import React from "react";
import { UserCircle, Menu } from "lucide-react";

interface HeaderProps {
  onMenuClick: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
  return (
    <header className="h-16 sm:h-20 border-b border-slate-200 flex items-center justify-between px-4 sm:px-6 lg:px-10 bg-white/80 backdrop-blur-sm shrink-0">
      {/* Left: hamburger (mobile) + breadcrumb */}
      <div className="flex items-center gap-3">
        {/* Mobile hamburger */}
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 -ml-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          aria-label="Open sidebar"
        >
          <Menu size={20} />
        </button>

        <h2 className="text-xs sm:text-sm font-medium text-slate-500 italic">
          <span className="hidden sm:inline">Financial Portal / </span>Retail Banking
        </h2>
      </div>

      {/* Right: user info */}
      <div className="flex items-center gap-3">
        <div className="text-right mr-1 hidden sm:block">
          <p className="text-xs font-bold text-slate-900">Jawad Ahmed</p>
          <p className="text-[10px] text-slate-400 font-mono">ID: 0001-A2</p>
        </div>
        <div className="size-9 sm:size-10 bg-slate-200 rounded-full flex items-center justify-center">
          <UserCircle size={22} className="text-slate-500" />
        </div>
      </div>
    </header>
  );
}