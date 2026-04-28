"use client"
import { signIn } from "next-auth/react";
import { useState } from "react";
import { Landmark, ShieldCheck, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    const res = await signIn("credentials", {
      username,
      password,
      callbackUrl: "/dashboard", // Login ke baad kahan jana hai
      redirect: false,
    });

    if (res?.error) {
      setError("Invalid credentials. Access denied.");
    } else {
      router.push(res?.url || "/dashboard");
    }
  };

  return (
    <div className="min-h-screen bg-[#fafafa] flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-[400px] space-y-8">
        <div className="text-center">
          <div className="inline-flex items-center justify-center size-14 bg-slate-900 rounded-2xl mb-4 shadow-xl">
            <Landmark className="text-white" size={28} />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Nexus Islamic Bank</h1>
          <p className="text-sm text-slate-500 mt-2 font-medium italic underline decoration-slate-200">Retail Banking Portal</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-5">
          {error && (
            <div className="bg-red-50 border border-red-100 text-red-600 p-3 rounded-xl text-xs font-bold flex items-center gap-2 animate-shake">
              <AlertCircle size={14} /> {error}
            </div>
          )}

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Username</label>
            <input 
              type="username" required
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-1 focus:ring-slate-900 outline-none transition-all text-sm font-medium"
              placeholder="e.g. jawad@nexus.com"
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Password</label>
            <input 
              type="password" required
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-1 focus:ring-slate-900 outline-none transition-all text-sm font-medium"
              placeholder="••••••••"
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-200 mt-2 text-sm">
            Sign In
          </button>

          <div className="text-center pt-2">
            <button type="button" onClick={() => alert("Please contact branch for password reset.")} className="text-[10px] font-bold text-slate-400 hover:text-slate-900 uppercase tracking-widest">
              Forgot Credentials?
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}