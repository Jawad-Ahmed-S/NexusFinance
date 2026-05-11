"use client";

import React, { useState } from "react";
import {LayoutDashboard,
  Landmark,
  UserRoundCog,
  FileClock,
  ArrowLeftRight,
  ChartNoAxesCombined,
  BriefcaseBusiness,
  UserPlus} from "lucide-react";
import Sidebar, { type NavItem } from "@/app/components/sidebar";
import Header from "@/app/components/header";
import { UserProvider } from "@/app/(user)/context/UserContext";

export default function ClientWrapperLayout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const adminNavItems: NavItem[] = [
    {label: "Dashboard",href: "/admin/dashboard",icon: LayoutDashboard},
    {label: "Account Management",href: "/admin/accounts",icon: Landmark},
    {label: "Account Creation",href: "/admin/accountCreation",icon: UserPlus},
    {label: "Transactions",href: "/admin/transactions",icon: ArrowLeftRight},
    {label: "Mudarabah Dashboard",href: "/admin/mudarabah",icon: BriefcaseBusiness},
    {label: "Churn Analytics",href: "/admin/churn-analyzer",icon: ChartNoAxesCombined},
  ];

  return (
    <UserProvider>
      <div className="flex h-screen bg-white text-slate-900 font-sans overflow-hidden">
        <Sidebar navItems={adminNavItems} mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />

        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <Header onMenuClick={() => setMobileOpen(true)} />

          <main className="flex-1 overflow-y-auto bg-[#fafafa]">
            {children}
          </main>
        </div>
      </div>
    </UserProvider>
  );
}
