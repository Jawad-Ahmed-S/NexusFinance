"use client";

import React, { useState } from "react";
import {
  UserPlus, Eye, EyeOff, CheckCircle2,
  AlertCircle, Loader2, LayoutDashboard,
  ChevronRight, X, ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import StatusPopup from "@/app/components/statuspopup";

const ONBOARDING_API = "/api/admin/onboarding";

async function checkUsernameExists(username: string): Promise<boolean> {
  const res = await fetch(
    `${ONBOARDING_API}?check=username&value=${encodeURIComponent(username)}`,
    { credentials: "same-origin" }
  );
  if (!res.ok) throw new Error("Could not verify username");
  const data = (await res.json()) as { exists?: boolean };
  return data.exists === true;
}

async function checkNationalIdExists(nationalId: string): Promise<boolean> {
  const res = await fetch(
    `${ONBOARDING_API}?check=nationalId&value=${encodeURIComponent(nationalId)}`,
    { credentials: "same-origin" }
  );
  if (!res.ok) throw new Error("Could not verify national ID");
  const data = (await res.json()) as { exists?: boolean };
  return data.exists === true;
}

type CreateAccountResponse =
  | {
      success: true;
      message: string;
      userId: number;
      customerId: number;
      accountId: number;
    }
  | { success: false; message: string };

async function createCustomerAccount(payload: {
  username: string;
  password: string;
  fullName: string;
  nationalId: string;
  phone: string;
  email: string;
  accountType: "wadi_ah" | "mudarabah";
  initialBalance: number;
}): Promise<CreateAccountResponse> {
  const res = await fetch(ONBOARDING_API, {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = (await res.json()) as {
    success?: boolean;
    message?: string;
    error?: string;
    userId?: number;
    customerId?: number;
    accountId?: number;
  };

  if (res.status === 401) {
    return { success: false, message: data.error ?? "Unauthorized" };
  }
  if (!res.ok) {
    return {
      success: false,
      message: data.message ?? data.error ?? "Request failed",
    };
  }
  if (
    data.success === true &&
    data.userId != null &&
    data.customerId != null &&
    data.accountId != null
  ) {
    return {
      success: true,
      message: data.message ?? "Account created",
      userId: data.userId,
      customerId: data.customerId,
      accountId: data.accountId,
    };
  }
  return {
    success: false,
    message: data.message ?? "Failed to create account",
  };
}

// ─── Types ───────────────────────────────────────────────────

interface FormState {
  // User
  username:        string;
  password:        string;
  confirmPassword: string;
  // Customer
  fullName:        string;
  nationalId:      string;
  phone:           string;
  email:           string;
  // Account
  accountType:     "wadi_ah" | "mudarabah";
  initialBalance:  string;
}

interface FieldError {
  [key: string]: string;
}

interface CreatedResult {
  userId:     number;
  customerId: number;
  accountId:  number;
  username:   string;
  fullName:   string;
  accountType: string;
}

// ─── Helpers ─────────────────────────────────────────────────

const EMPTY: FormState = {
  username:        "",
  password:        "",
  confirmPassword: "",
  fullName:        "",
  nationalId:      "",
  phone:           "",
  email:           "",
  accountType:     "wadi_ah",
  initialBalance:  "0",
};

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-4">
      {children}
    </p>
  );
}

function Field({
  label, error, required = true, children,
}: {
  label: string; error?: string; required?: boolean; children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block">
        {label}
        {required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {children}
      {error && (
        <p className="text-[10px] text-red-500 font-medium flex items-center gap-1">
          <AlertCircle size={10} /> {error}
        </p>
      )}
    </div>
  );
}

function Input({
  value, onChange, placeholder, type = "text", mono = false, disabled = false,
}: {
  value: string; onChange: (v: string) => void;
  placeholder?: string; type?: string; mono?: boolean; disabled?: boolean;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      className={`w-full px-4 py-2.5 text-sm border border-slate-200 rounded-lg bg-white text-slate-900
        placeholder:text-slate-300 focus:outline-none focus:border-slate-400 focus:ring-2
        focus:ring-slate-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed
        ${mono ? "font-mono" : ""}`}
    />
  );
}

// ─── Success Card ─────────────────────────────────────────────

function SuccessCard({
  result, onCreateAnother,
}: {
  result: CreatedResult; onCreateAnother: () => void;
}) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-8 space-y-6">
      <div className="flex flex-col items-center text-center space-y-3 py-4">
        <div className="w-16 h-16 bg-green-50 border-2 border-green-200 rounded-full flex items-center justify-center">
          <CheckCircle2 size={32} className="text-green-600" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-slate-900">Account Created</h3>
          <p className="text-sm text-slate-500 mt-1">
            Customer onboarded and account is active.
          </p>
        </div>
      </div>

      {/* Details */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl overflow-hidden">
        {[
          { label: "Full Name",    value: result.fullName                           },
          { label: "Username",     value: result.username                           },
          { label: "User ID",      value: `#${result.userId}`,      mono: true      },
          { label: "Customer ID",  value: `#${result.customerId}`,  mono: true      },
          { label: "Account ID",   value: `#${result.accountId}`,   mono: true      },
          { label: "Account Type", value: result.accountType === "wadi_ah" ? "Wadiah" : "Mudarabah" },
          { label: "Status",       value: "Active",                 green: true     },
        ].map(({ label, value, mono, green }) => (
          <div
            key={label}
            className="flex justify-between items-center px-5 py-3.5 border-b border-slate-100 last:border-0"
          >
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
              {label}
            </span>
            <span className={`text-sm font-bold ${
              green ? "text-green-600" : mono ? "font-mono text-slate-700" : "text-slate-800"
            }`}>
              {value}
            </span>
          </div>
        ))}
      </div>

      <div className="flex gap-3">
        <button
          onClick={onCreateAnother}
          className="flex-1 py-2.5 border border-slate-200 text-slate-700 text-sm font-bold rounded-lg hover:bg-slate-50 transition-colors"
        >
          Create Another
        </button>
        <Link
          href="/admin/accounts"
          className="flex-1 py-2.5 bg-slate-900 text-white text-sm font-bold rounded-lg hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
        >
          View Accounts <ChevronRight size={14} />
        </Link>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────

export default function CreateAccountPage() {
  const [form,        setForm]        = useState<FormState>(EMPTY);
  const [errors,      setErrors]      = useState<FieldError>({});
  const [globalError, setGlobalError] = useState("");
  const [loading,     setLoading]     = useState(false);
  const [showPass,    setShowPass]    = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [result,      setResult]      = useState<CreatedResult | null>(null);
  const [popup, setPopup] = useState<{ status: "success" | "error"; message: string } | null>(null);
  const patch = (p: Partial<FormState>) => setForm((prev) => ({ ...prev, ...p }));

  // ── Validation ───────────────────────────────────────────────

  async function validate(): Promise<boolean> {
    const e: FieldError = {};

    try {
      if (!form.username.trim())              e.username        = "Username is required";
      else if (form.username.length < 3)      e.username        = "Min 3 characters";
      else if (await checkUsernameExists(form.username.trim()))
                                              e.username        = "Username already taken";

      if (!form.password)                     e.password        = "Password is required";
      else if (form.password.length < 6)      e.password        = "Min 6 characters";

      if (form.confirmPassword !== form.password)
                                              e.confirmPassword = "Passwords do not match";

      if (!form.fullName.trim())              e.fullName        = "Full name is required";

      if (!form.nationalId.trim())            e.nationalId      = "National ID is required";
      else if (await checkNationalIdExists(form.nationalId.trim()))
                                              e.nationalId      = "National ID already registered";

      if (!form.phone.trim())                 e.phone           = "Phone is required";

      if (!form.email.trim())                 e.email           = "Email is required";
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
                                              e.email           = "Invalid email format";

      const bal = Number(form.initialBalance);
      if (isNaN(bal) || bal < 0)              e.initialBalance  = "Must be 0 or more";
    } catch {
      setGlobalError("Could not verify username or national ID. Please try again.");
      setErrors({});
      return false;
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  }

  // ── Submit ───────────────────────────────────────────────────

  async function handleSubmit() {
    setGlobalError("");
    setLoading(true);
  
    const valid = await validate();
    if (!valid) { setLoading(false); return; }
  
    let res: CreateAccountResponse;
    try {
      res = await createCustomerAccount({
        username:       form.username.trim(),
        password:       form.password,
        fullName:       form.fullName.trim(),
        nationalId:     form.nationalId.trim(),
        phone:          form.phone.trim(),
        email:          form.email.trim(),
        accountType:    form.accountType,
        initialBalance: Number(form.initialBalance),
      });
    } catch {
      setLoading(false);
      const msg = "Could not reach the server. Please try again.";
      setGlobalError(msg);
      setPopup({ status: "error", message: msg });
      return;
    }
  
    setLoading(false);
  
    if (!res.success) {
      setGlobalError(res.message);
      setPopup({ status: "error", message: res.message });
      return;
    }
  
    setPopup({ status: "success", message: res.message });
  
    setResult({
      userId:      res.userId!,
      customerId:  res.customerId!,
      accountId:   res.accountId!,
      username:    form.username.trim(),
      fullName:    form.fullName.trim(),
      accountType: form.accountType,
    });
  }

  // ── Reset ────────────────────────────────────────────────────

  function handleReset() {
    setForm(EMPTY);
    setErrors({});
    setGlobalError("");
    setResult(null);
  }

  // ── Render ───────────────────────────────────────────────────

  return (
    
  <main className="min-h-screen bg-[#FAFAFA] font-sans">
    {popup && (
      <StatusPopup
        status={popup.status}
        message={popup.message}
        onClose={() => setPopup(null)}
      />
    )}
    {/* rest of page */}
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
            Financial Portal / Account Onboarding
          </p>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2 mt-0.5">
            <UserPlus strokeWidth={2} className="w-5 h-5 text-slate-400" />
            Create New Account
          </h1>
        </div>
        <Link
          href="/admin/dashboard"
          className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors"
        >
          <LayoutDashboard strokeWidth={2} className="w-3.5 h-3.5" />
          Dashboard
        </Link>
      </header>

      <div className="px-8 py-8 max-w-2xl mx-auto">

        {/* Success state */}
        {result ? (
          <SuccessCard result={result} onCreateAnother={handleReset} />
        ) : (
          <div className="space-y-6">

            {/* Global error */}
            {globalError && (
              <div className="flex items-center justify-between gap-3 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                <div className="flex items-center gap-3">
                  <AlertCircle strokeWidth={2} className="w-4 h-4 text-red-500 flex-shrink-0" />
                  <p className="text-sm text-red-700">{globalError}</p>
                </div>
                <button onClick={() => setGlobalError("")}>
                  <X size={14} className="text-red-400 hover:text-red-700" />
                </button>
              </div>
            )}

            {/* ── Section 1: Login Credentials ── */}
            <section className="bg-white border border-slate-200 rounded-2xl p-6">
              <SectionLabel>Login Credentials</SectionLabel>
              <div className="space-y-4">

                <Field label="Username" error={errors.username}>
                  <Input
                    value={form.username}
                    onChange={(v) => patch({ username: v })}
                    placeholder="e.g. jawad_khan"
                    mono
                    disabled={loading}
                  />
                </Field>

                <Field label="Password" error={errors.password}>
                  <div className="relative">
                    <input
                      type={showPass ? "text" : "password"}
                      value={form.password}
                      onChange={(e) => patch({ password: e.target.value })}
                      placeholder="Min 6 characters"
                      disabled={loading}
                      className="w-full px-4 py-2.5 pr-10 text-sm border border-slate-200 rounded-lg bg-white text-slate-900 placeholder:text-slate-300 focus:outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100 transition-all disabled:opacity-50"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass((p) => !p)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors"
                    >
                      {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </Field>

                <Field label="Confirm Password" error={errors.confirmPassword}>
                  <div className="relative">
                    <input
                      type={showConfirm ? "text" : "password"}
                      value={form.confirmPassword}
                      onChange={(e) => patch({ confirmPassword: e.target.value })}
                      placeholder="Re-enter password"
                      disabled={loading}
                      className="w-full px-4 py-2.5 pr-10 text-sm border border-slate-200 rounded-lg bg-white text-slate-900 placeholder:text-slate-300 focus:outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100 transition-all disabled:opacity-50"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm((p) => !p)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors"
                    >
                      {showConfirm ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </Field>

              </div>
            </section>

            {/* ── Section 2: Customer Details ── */}
            <section className="bg-white border border-slate-200 rounded-2xl p-6">
              <SectionLabel>Customer Details</SectionLabel>
              <div className="space-y-4">

                <Field label="Full Name" error={errors.fullName}>
                  <Input
                    value={form.fullName}
                    onChange={(v) => patch({ fullName: v })}
                    placeholder="e.g. Jawad Khan"
                    disabled={loading}
                  />
                </Field>

                <Field label="National ID (CNIC)" error={errors.nationalId}>
                  <Input
                    value={form.nationalId}
                    onChange={(v) => patch({ nationalId: v })}
                    placeholder="e.g. 42101-1234567-1"
                    mono
                    disabled={loading}
                  />
                </Field>

                <div className="grid grid-cols-2 gap-4">
                  <Field label="Phone" error={errors.phone}>
                    <Input
                      value={form.phone}
                      onChange={(v) => patch({ phone: v })}
                      placeholder="03XX-XXXXXXX"
                      mono
                      disabled={loading}
                    />
                  </Field>

                  <Field label="Email" error={errors.email}>
                    <Input
                      value={form.email}
                      onChange={(v) => patch({ email: v })}
                      placeholder="email@example.com"
                      disabled={loading}
                    />
                  </Field>
                </div>

              </div>
            </section>

            {/* ── Section 3: Account Setup ── */}
            <section className="bg-white border border-slate-200 rounded-2xl p-6">
              <SectionLabel>Account Setup</SectionLabel>
              <div className="space-y-4">

                {/* Account Type */}
                <Field label="Account Type" error={errors.accountType}>
                  <div className="grid grid-cols-2 gap-3">
                    {([
                      { value: "wadi_ah",   label: "Wadiah",    sub: "Current / Savings"         },
                      { value: "mudarabah", label: "Mudarabah", sub: "Profit-sharing investment"  },
                    ] as const).map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => patch({ accountType: opt.value })}
                        disabled={loading}
                        className={`text-left px-4 py-3 rounded-xl border-2 transition-all ${
                          form.accountType === opt.value
                            ? "border-slate-900 bg-slate-900 text-white"
                            : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                        }`}
                      >
                        <p className={`text-sm font-bold ${
                          form.accountType === opt.value ? "text-white" : "text-slate-900"
                        }`}>
                          {opt.label}
                        </p>
                        <p className={`text-[10px] mt-0.5 ${
                          form.accountType === opt.value ? "text-white/60" : "text-slate-400"
                        }`}>
                          {opt.sub}
                        </p>
                      </button>
                    ))}
                  </div>
                </Field>

                {/* Initial Balance */}
                <Field label="Initial Balance (PKR)" error={errors.initialBalance} required={false}>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                      PKR
                    </span>
                    <input
                      type="number"
                      min={0}
                      value={form.initialBalance}
                      onChange={(e) => patch({ initialBalance: e.target.value })}
                      disabled={loading}
                      className="w-full pl-14 pr-4 py-2.5 text-sm font-mono border border-slate-200 rounded-lg bg-white text-slate-900 focus:outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100 transition-all tabular-nums disabled:opacity-50"
                    />
                  </div>
                </Field>

                {/* Shariah note */}
                <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-4 py-3">
                  <ShieldCheck size={14} className="text-green-600 flex-shrink-0" />
                  <p className="text-[10px] font-bold text-green-700">
                    {form.accountType === "wadi_ah"
                      ? "Wadiah accounts are fully Shariah-compliant. No interest is earned or charged."
                      : "Mudarabah accounts distribute profit based on monthly cycle performance."}
                  </p>
                </div>

              </div>
            </section>

            {/* ── Submit ── */}
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full py-3.5 bg-slate-900 text-white text-sm font-bold rounded-xl hover:bg-slate-800 active:scale-[0.99] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <><Loader2 size={16} className="animate-spin" /> Creating Account…</>
              ) : (
                <><UserPlus size={16} /> Create Account</>
              )}
            </button>

          </div>
        )}
      </div>
    </main>
  );
}