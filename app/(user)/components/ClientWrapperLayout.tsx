"use client";
import React, { useState } from "react";
import {
  LayoutDashboard,
  SendHorizontal,
  History,
  FileCheck2,
  Settings,
} from "lucide-react";
import Sidebar, { type NavItem } from "@/app/components/sidebar";
import Header from "@/app/components/header";
import { UserProvider } from "@/app/(user)/context/UserContext";

export default function ClientLayoutWrapper({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const userNavItems: NavItem[] = [
    { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
    { label: "Transfer", href: "/transfers", icon: SendHorizontal },
    { label: "Mudarbah Potfolio", href: "/mudarabah", icon: History },
    { label: "Transaction History", href: "/transactionhistory", icon: History },
    { label: "Contracts", href: "/contracts", icon: FileCheck2 },
    { label: "Settings", href: "/settings", icon: Settings },
  ];

  return (
    <UserProvider>
      <div className="flex h-screen bg-white text-slate-900 font-sans overflow-hidden">
        <Sidebar navItems={userNavItems} mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />

        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <Header onMenuClick={() => setMobileOpen(true)} />

          <main className="flex-1 overflow-y-auto bg-[#fafafa]">
            <div className="p-4 sm:p-6 lg:p-10 max-w-6xl mx-auto">
              {children}
            </div>
          </main>
        </div>
      </div>
    </UserProvider>
  );
}