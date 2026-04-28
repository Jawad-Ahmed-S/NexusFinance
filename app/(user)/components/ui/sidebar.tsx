"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, 
  MonitorSmartphone, 
  SendHorizontal, 
  History, 
  FileCheck2, 
  Sparkles,
  Landmark,
  ChevronRight, 
  ChevronLeft, 
  Settings,
  X,
} from "lucide-react";

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  href: string;
  active?: boolean;
  collapsed?: boolean;
  onClick?: () => void;
}

function NavItem({ icon, label, href, active = false, collapsed = false, onClick }: NavItemProps) {
  return (
    <Link
      href={href}
      onClick={onClick}
      title={collapsed ? label : undefined}
      className={`flex items-center gap-3 px-4 py-2.5 rounded-lg cursor-pointer transition-all duration-200 text-sm font-medium
        ${active ? "bg-slate-900 text-white" : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"}
        ${collapsed ? "justify-center px-2" : ""}`}
    >
      <span className="shrink-0">{icon}</span>
      {!collapsed && <span className="truncate">{label}</span>}
    </Link>
  );
}

interface SidebarProps {
  mobileOpen: boolean;
  onMobileClose: () => void;
}

export default function Sidebar({ mobileOpen, onMobileClose }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const overviewHref = pathname.startsWith("/dashboard/") ? pathname : "/dashboard/1";

  return (
    <>
      {/* Mobile overlay backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/30 backdrop-blur-sm lg:hidden"
          onClick={onMobileClose}
        />
      )}

      {/* Sidebar panel */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-30 flex flex-col h-full bg-[#fcfcfc] border-r border-slate-200
          transition-all duration-300 ease-in-out
          /* Mobile: slide in/out */
          ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
          /* Desktop: always visible, width toggles */
          lg:relative lg:translate-x-0
          ${collapsed ? "lg:w-[72px]" : "lg:w-64"}
          w-64
        `}
      >
        {/* Logo */}
        <div className={`p-6 pb-8 flex items-center ${collapsed ? "lg:justify-center" : "justify-between"}`}>
          <div className="flex items-center gap-2 min-w-0">
            <div className="bg-slate-900 p-1.5 rounded-md shrink-0">
              <Landmark className="text-white" size={18} />
            </div>
            {!collapsed && (
              <span className="font-bold text-lg tracking-tight text-slate-900 truncate">
                NEXUS BANK
              </span>
            )}
          </div>

          {/* Mobile close button */}
          <button
            onClick={onMobileClose}
            className="lg:hidden ml-2 p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            aria-label="Close sidebar"
          >
            <X size={18} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 space-y-1">
          <NavItem
            icon={<LayoutDashboard size={18} />}
            label="Overview"
            href={overviewHref}
            active={pathname.startsWith("/dashboard/")}
            collapsed={collapsed}
            onClick={onMobileClose}
          />
          <NavItem
            icon={<MonitorSmartphone size={18} />}
            label="ATM Simulator"
            href="/atm-simulator"
            active={pathname.startsWith("/atm-simulator")}
            collapsed={collapsed}
            onClick={onMobileClose}
          />
          <NavItem
            icon={<SendHorizontal size={18} />}
            label="Transfer"
            href="/transfers"
            active={pathname.startsWith("/transfers")}
            collapsed={collapsed}
            onClick={onMobileClose}
          />
          <NavItem
            icon={<History size={18} />}
            label="Transaction History"
            href="/transactionhistory"
            active={pathname.startsWith("/transactionhistory")}
            collapsed={collapsed}
            onClick={onMobileClose}
          />
          <NavItem
            icon={<FileCheck2 size={18} />}
            label="Contracts"
            href="/contracts"
            active={pathname.startsWith("/contracts")}
            collapsed={collapsed}
            onClick={onMobileClose}
          />
          <NavItem
            icon={<Sparkles size={18} />}
            label="Recommendations"
            href="/recommendations"
            active={pathname.startsWith("/recommendations")}
            collapsed={collapsed}
            onClick={onMobileClose}
          />
          <NavItem
            icon={<Settings size={18} />}
            label="Settings"
            href="/settings"
            active={pathname.startsWith("/settings")}
            collapsed={collapsed}
            onClick={onMobileClose}
          />
        </nav>

        

        {/* Desktop collapse toggle */}
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="hidden lg:flex items-center justify-center gap-2 mx-4 mb-5 py-2 rounded-lg border border-slate-200 text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors text-xs font-medium"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight size={16} /> : (
            <>
              <ChevronLeft size={16} />
              <span>Collapse</span>
            </>
          )}
        </button>
      </aside>
    </>
  );
}