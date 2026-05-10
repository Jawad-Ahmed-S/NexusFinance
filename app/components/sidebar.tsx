"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Landmark,
  ChevronRight,
  ChevronLeft,
  X,
  type LucideIcon,
} from "lucide-react";

type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
};

type SidebarProps = {
  navItems: NavItem[];
  mobileOpen: boolean;
  onMobileClose: () => void;
};

interface SidebarNavItemProps {
  icon: React.ReactNode;
  label: string;
  href: string;
  active?: boolean;
  collapsed?: boolean;
  onClick?: () => void;
}

function SidebarNavItem({
  icon,
  label,
  href,
  active = false,
  collapsed = false,
  onClick,
}: SidebarNavItemProps) {
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

export type { NavItem, SidebarProps };

export default function Sidebar({ navItems, mobileOpen, onMobileClose }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/30 backdrop-blur-sm lg:hidden"
          onClick={onMobileClose}
        />
      )}

      <aside
        className={`
          fixed inset-y-0 left-0 z-30 flex flex-col h-full bg-[#fcfcfc] border-r border-slate-200
          transition-all duration-300 ease-in-out
          ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
          lg:relative lg:translate-x-0
          ${collapsed ? "lg:w-18" : "lg:w-64"}
          w-64
        `}
      >
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

          <button
            onClick={onMobileClose}
            className="lg:hidden ml-2 p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            aria-label="Close sidebar"
          >
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 px-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <SidebarNavItem
                key={item.href}
                icon={<Icon size={18} />}
                label={item.label}
                href={item.href}
                active={pathname.startsWith(item.href)}
                collapsed={collapsed}
                onClick={onMobileClose}
              />
            );
          })}
        </nav>

        <button
          onClick={() => setCollapsed((c) => !c)}
          className="hidden lg:flex items-center justify-center gap-2 mx-4 mb-5 py-2 rounded-lg border border-slate-200 text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors text-xs font-medium"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <ChevronRight size={16} />
          ) : (
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
