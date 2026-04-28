"use client";
import React, { useState } from "react";
import Sidebar from "@/app/(user)/components/ui/sidebar";
import Header from "@/app/(user)/components/ui/header";

export default function ClientLayoutWrapper({ 
  children, 
  session 
}: { 
  children: React.ReactNode; 
  session: any 
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen bg-white text-slate-900 font-sans overflow-hidden">
      
      <Sidebar
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header onMenuClick={() => setMobileOpen(true)} />

        <main className="flex-1 overflow-y-auto bg-[#fafafa]">
          <div className="p-4 sm:p-6 lg:p-10 max-w-6xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}