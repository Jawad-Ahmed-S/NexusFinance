"use client";


import { UserCircle, Menu, LogOut  } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { signOut } from "next-auth/react";
import { useUser } from "@/app/(user)/context/UserContext";
import { getUserProfile } from "@/app/(user)/lib/queries";

type HeaderProps = {
  onMenuClick: () => void;
};

type HeaderProfile = {
  full_name: string;
  username: string;
};

export default function Header({ onMenuClick }: HeaderProps) {
  const { userId } = useUser();
  const [profile, setProfile] = useState<HeaderProfile>({
    full_name: "",
    username: "",
  });
  const [open, setOpen] = useState(false) 
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);
  useEffect(() => {
    let mounted = true;

    async function loadProfile() {
      if (!userId) {
        return;
      }

      try {
        const data = await getUserProfile(userId);
        if (mounted) {
          setProfile({
            full_name: data.full_name ?? "",
            username: data.username ?? "",
          });
        }
      } catch (error) {
        console.error("Failed to load header profile:", error);
      }
    }

    loadProfile();

    return () => {
      mounted = false;
    };
  }, [userId]);

  return (
    <header className="h-16 sm:h-20 border-b border-slate-200 flex items-center justify-between px-4 sm:px-6 lg:px-10 bg-white/80 backdrop-blur-sm shrink-0">
      <div className="flex items-center gap-3">
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

      <div className="relative">
  <button
    onClick={() => setOpen(v => !v)}
    className="flex items-center gap-3 hover:bg-slate-100 rounded-xl px-2 py-1.5 transition-colors"
  >
    <div className="text-right mr-1 hidden sm:block">
      <p className="text-xs font-bold text-slate-900">{profile.full_name || "User"}</p>
      <p className="text-[10px] text-slate-400 font-mono">
        {profile.username ? `@${profile.username}` : `ID: ${String(userId).padStart(4, "0")}`}
      </p>
    </div>
    <div className="size-9 sm:size-10 bg-slate-200 rounded-full flex items-center justify-center">
      <UserCircle size={22} className="text-slate-500" />
    </div>
  </button>

  {open && (
    <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-slate-200 rounded-2xl shadow-lg overflow-hidden z-50">
      <div className="px-4 py-3 border-b border-slate-100">
        <p className="text-xs font-bold text-slate-900">{profile.full_name || "User"}</p>
        <p className="text-[10px] text-slate-400 font-mono mt-0.5">
          {profile.username ? `@${profile.username}` : `ID: ${String(userId).padStart(4, "0")}`}
        </p>
      </div>
      <button
        onClick={() => signOut({ callbackUrl: "/login" })}
        className="w-full flex items-center gap-2.5 px-4 py-3 text-xs font-medium text-rose-500 hover:bg-rose-50 transition-colors"
      >
        <LogOut className="w-3.5 h-3.5" />
        Sign Out
      </button>
    </div>
  )}
</div>
    </header>
  );
}
