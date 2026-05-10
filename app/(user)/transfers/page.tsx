"use client";

import React, { useState, useTransition, useRef, useEffect } from "react";
import {
  ArrowLeft,
  Search,
  CheckCircle2,
  AlertCircle,
  Send,
  ChevronRight,
  Loader2,
  ShieldCheck,
  RefreshCw,
  Copy,
  X,
} from "lucide-react";
import { getAccountHolderByAccountNumber, handleTransfer, getCustomerId, getUserAccounts } from "../lib/queries";
import Link from "next/link";
import { useUser } from "@/app/(user)/context/UserContext";

// ─── Types ────────────────────────────────────────────────────────────────────

type Step = "entry" | "confirm" | "pin" | "success" | "error";

interface AccountHolder {
  name: string;
  accountId: string;
  maskedId: string;
  type: "WADIAH" | "CURRENT";
}

interface TransferState {
  toAccountRaw: string;
  amount: string;
  note: string;
  recipient: AccountHolder | null;
  referenceNo: string;
}

interface WadiahAccount {
  account_id: string;
  balance: number;
  maskedId: string;
}

// ─── Mock: Lookup account holder by account number ────────────────────────────
// Replace this with your actual server action / API call
async function lookupAccount(accountNumber: number): Promise<AccountHolder | null> {
  await new Promise((r) => setTimeout(r, 900)); // simulate network delay
  const accountDetails = await getAccountHolderByAccountNumber(accountNumber);

  return accountDetails;
}

// ─── Mock: Execute transfer ───────────────────────────────────────────────────
async function executeTransfer(_payload: {
  fromAccountId: number;
  toAccountId: number;
  amount: number;
  note: string;
}): Promise<{ referenceNo: string }> {
  
  const {fromAccountId,toAccountId,amount} = _payload;
  await handleTransfer(fromAccountId,toAccountId,amount);
  const ref = "TXN" + Date.now().toString().slice(-8).toUpperCase();
  return { referenceNo: ref };
}

// ─── Sub-component: Step indicator ───────────────────────────────────────────

function StepDots({ current }: { current: Step }) {
  const steps: Step[] = ["entry", "confirm", "pin"];
  const idx = steps.indexOf(current);
  return (
    <div className="flex items-center gap-2">
      {steps.map((s, i) => (
        <React.Fragment key={s}>
          <div
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i < idx
                ? "w-6 bg-green-500"
                : i === idx
                ? "w-8 bg-slate-900"
                : "w-4 bg-slate-200"
            }`}
          />
        </React.Fragment>
      ))}
    </div>
  );
}

// ─── Sub-component: Step 1 — Account Entry ────────────────────────────────────

function EntryStep({
  state,
  onChange,
  senderBalance,
  onNext,
}: {
  state: TransferState;
  onChange: (patch: Partial<TransferState>) => void;
  senderBalance: number;
  onNext: (recipient: AccountHolder) => void;
}) {
  const [lookupState, setLookupState] = useState<"idle" | "loading" | "found" | "notfound">("idle");
  const [isPending, startTransition] = useTransition();

  const handleLookup = () => {
    if (!state.toAccountRaw.trim()) return;
    setLookupState("loading");
    startTransition(async () => {
      const result = await lookupAccount(Number(state.toAccountRaw));
      if (result) {
        onChange({ recipient: result });
        setLookupState("found");
      } else {
        onChange({ recipient: null });
        setLookupState("notfound");
      }
    });
  };

  const amountNum = Number(state.amount);
  const isAmountValid = amountNum > 0 && amountNum <= senderBalance;
  const canProceed = state.recipient && isAmountValid;

  return (
    <div className="space-y-6">
      {/* Account Number Lookup */}
      <div className="space-y-2">
        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
          Recipient Account Number
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            inputMode="numeric"
            placeholder="Enter account number"
            value={state.toAccountRaw}
            onChange={(e) => {
              onChange({ toAccountRaw: e.target.value, recipient: null });
              setLookupState("idle");
            }}
            onKeyDown={(e) => e.key === "Enter" && handleLookup()}
            className="flex-1 border border-slate-200 rounded-xl px-4 py-3 text-sm font-mono text-slate-900 placeholder:text-slate-300 focus:outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100 transition-all bg-white"
          />
          <button
            onClick={handleLookup}
            disabled={!state.toAccountRaw.trim() || lookupState === "loading"}
            className="px-4 py-3 bg-slate-900 text-white rounded-xl disabled:opacity-40 hover:bg-slate-800 transition-all flex items-center gap-2 text-xs font-bold"
          >
            {lookupState === "loading" ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Search size={14} />
            )}
            <span className="hidden sm:inline">Verify</span>
          </button>
        </div>

        {/* Recipient result */}
        {lookupState === "found" && state.recipient && (
          <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
            <CheckCircle2 size={16} className="text-green-600 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-slate-900 truncate">{state.recipient.name}</p>
              <p className="text-[10px] text-slate-400 font-mono">{state.recipient.maskedId} · {state.recipient.type}</p>
            </div>
          </div>
        )}
        {lookupState === "notfound" && (
          <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
            <AlertCircle size={16} className="text-red-500 shrink-0" />
            <p className="text-sm font-medium text-red-700">No Wadiah account found with this number.</p>
          </div>
        )}
      </div>

      {/* Amount */}
      <div className="space-y-2">
        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
          Amount
        </label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">PKR</span>
          <input
            type="number"
            placeholder="0"
            min={1}
            max={senderBalance}
            value={state.amount}
            onChange={(e) => onChange({ amount: e.target.value })}
            className="w-full border border-slate-200 rounded-xl pl-14 pr-4 py-3 text-lg font-bold text-slate-900 placeholder:text-slate-200 focus:outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100 transition-all tabular-nums bg-white"
          />
        </div>
        <div className="flex justify-between text-[10px] font-medium">
          <span className="text-slate-400">Available Balance</span>
          <span className={amountNum > senderBalance ? "text-red-500 font-bold" : "text-slate-600 font-bold"}>
            PKR {senderBalance.toLocaleString()}
          </span>
        </div>
        {/* Quick amount presets */}
        <div className="flex gap-2 flex-wrap">
          {[1000, 5000, 10000, 25000].map((preset) => (
            <button
              key={preset}
              onClick={() => onChange({ amount: String(preset) })}
              className="text-[10px] font-bold px-3 py-1 rounded-lg bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-all"
            >
              {preset.toLocaleString()}
            </button>
          ))}
        </div>
      </div>

      {/* Note */}
      <div className="space-y-2">
        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
          Reference Note <span className="text-slate-300 font-medium normal-case">(optional)</span>
        </label>
        <input
          type="text"
          maxLength={60}
          placeholder="e.g. Rent payment, Family transfer…"
          value={state.note}
          onChange={(e) => onChange({ note: e.target.value })}
          className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder:text-slate-300 focus:outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100 transition-all bg-white"
        />
      </div>

      {/* CTA */}
      <button
        disabled={!canProceed}
        onClick={() => state.recipient && onNext(state.recipient)}
        className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-30 hover:bg-slate-800 active:scale-[0.99] transition-all"
      >
        Review Transfer
        <ChevronRight size={16} />
      </button>
    </div>
  );
}

// ─── Sub-component: Step 2 — Confirm ─────────────────────────────────────────

function ConfirmStep({
  state,
  senderAccount,
  onBack,
  onConfirm,
}: {
  state: TransferState;
  senderAccount: { maskedId: string };
  onBack: () => void;
  onConfirm: () => void;
}) {
  const rows = [
    { label: "From",      value: `Wadiah ${senderAccount.maskedId}` },
    { label: "To",        value: `${state.recipient?.name} · ${state.recipient?.maskedId}` },
    { label: "Amount",    value: `PKR ${Number(state.amount).toLocaleString()}`, highlight: true },
    { label: "Note",      value: state.note || "—" },
    { label: "Fee",       value: "PKR 0.00 · No Riba" },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden">
        {rows.map(({ label, value, highlight }) => (
          <div
            key={label}
            className="flex justify-between items-center px-5 py-4 border-b border-slate-100 last:border-0"
          >
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</span>
            <span className={`text-sm font-bold text-right max-w-[60%] ${highlight ? "text-slate-900 text-base" : "text-slate-700"}`}>
              {value}
            </span>
          </div>
        ))}
      </div>

      <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
        <ShieldCheck size={16} className="text-amber-600 shrink-0 mt-0.5" />
        <p className="text-[11px] text-amber-800 leading-relaxed font-medium">
          This is an irreversible Shariah-compliant transfer. Please verify all details before continuing.
        </p>
      </div>

      <div className="flex gap-3">
        <button
          onClick={onBack}
          className="flex-1 py-3.5 border border-slate-200 text-slate-700 rounded-2xl font-bold text-sm hover:bg-slate-50 transition-all"
        >
          Edit
        </button>
        <button
          onClick={onConfirm}
          className="flex-2 py-3.5 bg-slate-900 text-white rounded-2xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-slate-800 active:scale-[0.99] transition-all"
        >
          Confirm & Enter PIN
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}

// ─── Sub-component: Step 3 — PIN Entry ───────────────────────────────────────

function PinStep({
  onBack,
  onSubmit,
}: {
  onBack: () => void;
  onSubmit: (pin: string) => void;
}) {
  const [pin, setPin] = useState(["", "", "", ""]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const refs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  const handleDigit = (idx: number, val: string) => {
    const digit = val.replace(/\D/g, "").slice(-1);
    const next = [...pin];
    next[idx] = digit;
    setPin(next);
    setError("");
    if (digit && idx < 3) refs[idx + 1].current?.focus();
  };

  const handleKey = (idx: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !pin[idx] && idx > 0) {
      refs[idx - 1].current?.focus();
    }
  };

  const handleSubmit = async () => {
    const full = pin.join("");
    if (full.length < 4) { setError("Please enter your 4-digit PIN."); return; }

    setIsLoading(true);
    // TODO: Validate PIN against the user's stored hashed PIN in DB
    // For now we simulate a brief check
    await new Promise((r) => setTimeout(r, 600));
    setIsLoading(false);

    // Mock: any PIN works except 0000
    if (full === "0000") {
      setError("Incorrect PIN. Please try again.");
      setPin(["", "", "", ""]);
      refs[0].current?.focus();
      return;
    }

    onSubmit(full);
  };

  return (
    <div className="space-y-8">
      <div className="text-center space-y-1">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Security Verification</p>
        <p className="text-slate-600 text-sm">Enter your 4-digit transaction PIN to authorise.</p>
      </div>

      {/* PIN inputs */}
      <div className="flex justify-center gap-4">
        {pin.map((d, i) => (
          <input
            key={i}
            ref={refs[i]}
            type="password"
            inputMode="numeric"
            maxLength={1}
            value={d}
            onChange={(e) => handleDigit(i, e.target.value)}
            onKeyDown={(e) => handleKey(i, e)}
            className={`size-14 text-center text-xl font-bold rounded-2xl border-2 focus:outline-none transition-all bg-white
              ${d ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 text-slate-900"}
              ${error ? "border-red-400" : "focus:border-slate-400"}
            `}
          />
        ))}
      </div>

      {error && (
        <div className="flex items-center gap-2 justify-center">
          <AlertCircle size={13} className="text-red-500" />
          <p className="text-xs text-red-600 font-medium">{error}</p>
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={onBack}
          disabled={isLoading}
          className="flex-1 py-3.5 border border-slate-200 text-slate-700 rounded-2xl font-bold text-sm hover:bg-slate-50 transition-all disabled:opacity-40"
        >
          Back
        </button>
        <button
          onClick={handleSubmit}
          disabled={pin.join("").length < 4 || isLoading}
          className="flex-2 py-3.5 bg-slate-900 text-white rounded-2xl font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-30 hover:bg-slate-800 active:scale-[0.99] transition-all"
        >
          {isLoading ? <Loader2 size={16} className="animate-spin" /> : <><Send size={15} /> Send Money</>}
        </button>
      </div>
    </div>
  );
}

// ─── Sub-component: Step 4 — Success ─────────────────────────────────────────

function SuccessStep({
  state,
  onDone,
}: {
  state: TransferState;
  onDone: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(state.referenceNo);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col items-center text-center space-y-6 py-4">
      {/* Icon */}
      <div className="size-20 rounded-full bg-green-50 border-2 border-green-200 flex items-center justify-center">
        <CheckCircle2 size={36} className="text-green-600" />
      </div>

      <div className="space-y-1">
        <h3 className="text-xl font-bold text-slate-900">Transfer Successful</h3>
        <p className="text-sm text-slate-500">
          PKR {Number(state.amount).toLocaleString()} sent to{" "}
          <span className="font-bold text-slate-800">{state.recipient?.name}</span>
        </p>
      </div>

      {/* Reference */}
      <div className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 flex items-center justify-between gap-3">
        <div className="text-left">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Reference No.</p>
          <p className="text-sm font-mono font-bold text-slate-900 mt-0.5">{state.referenceNo}</p>
        </div>
        <button
          onClick={handleCopy}
          className="shrink-0 p-2 rounded-lg hover:bg-slate-200 transition-all text-slate-400 hover:text-slate-700"
        >
          {copied ? <CheckCircle2 size={16} className="text-green-500" /> : <Copy size={16} />}
        </button>
      </div>

      {/* Breakdown */}
      <div className="w-full space-y-2 text-left">
        {[
          { label: "To Account", value: state.recipient?.maskedId },
          { label: "Date", value: new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) },
          { label: "Note", value: state.note || "—" },
          { label: "Shariah Status", value: "Riba-free · Compliant" },
        ].map(({ label, value }) => (
          <div key={label} className="flex justify-between text-[11px]">
            <span className="text-slate-400 font-bold uppercase tracking-wider">{label}</span>
            <span className="text-slate-700 font-bold">{value}</span>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="w-full flex gap-3 pt-2">
        <button
          onClick={onDone}
          className="flex-1 py-3 border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 hover:bg-slate-50 flex items-center justify-center gap-2 transition-all"
        >
          <RefreshCw size={14} />
          New Transfer
        </button>
        <Link
          href=".."
          className="flex-1 py-3 bg-slate-900 text-white rounded-2xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition-all"
        >
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
}

// ─── Sub-component: Step 5 — Error ───────────────────────────────────────────

function ErrorStep({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center text-center space-y-6 py-4">
      <div className="size-20 rounded-full bg-red-50 border-2 border-red-200 flex items-center justify-center">
        <X size={36} className="text-red-500" />
      </div>
      <div className="space-y-1">
        <h3 className="text-xl font-bold text-slate-900">Transfer Failed</h3>
        <p className="text-sm text-slate-500">Something went wrong while processing your transfer. Please try again.</p>
      </div>
      <button
        onClick={onRetry}
        className="w-full py-3.5 bg-slate-900 text-white rounded-2xl font-bold text-sm hover:bg-slate-800 transition-all"
      >
        Try Again
      </button>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function TransfersPage() {
  const { userId } = useUser();
  const [step, setStep] = useState<Step>("entry");
  const [isPending, startTransition] = useTransition();
  const [senderWadiahAccount, setSenderWadiahAccount] = useState<WadiahAccount | null>(null);
  const [customerId, setCustomerId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [transferState, setTransferState] = useState<TransferState>({
    toAccountRaw: "",
    amount: "",
    note: "",
    recipient: null,
    referenceNo: "",
  });

  const patch = (p: Partial<TransferState>) =>
    setTransferState((prev) => ({ ...prev, ...p }));

  const reset = () => {
    setTransferState({ toAccountRaw: "", amount: "", note: "", recipient: null, referenceNo: "" });
    setStep("entry");
  };

  // Fetch user's account data on mount
  useEffect(() => {
    async function fetchAccountData() {
      try {
        setIsLoading(true);
        const cId = await getCustomerId(userId);
        if (!cId) throw new Error("Customer not found");

        setCustomerId(cId);

        const accounts = await getUserAccounts(cId);
        const wadiahAccount = accounts?.find?.((a: any) => {
          const type = String(a.account_type ?? "").toLowerCase();
          return type === "wadi_ah" || type === "wadiah" || type === "current";
        });

        if (!wadiahAccount) throw new Error("No Wadiah account found");

        const maskedId = `****${String(wadiahAccount.account_id).slice(-4)}`;
        setSenderWadiahAccount({
          account_id: String(wadiahAccount.account_id),
          balance: Number(wadiahAccount.balance),
          maskedId,
        });
      } catch (error) {
        console.error("Error fetching account data:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchAccountData();
  }, [userId]);

  // Called after PIN confirmed — runs the actual transfer
  const handlePinConfirmed = (_pin: string) => {
    if (!customerId) return;
    startTransition(async () => {
      try {
        const result = await executeTransfer({
          fromAccountId: customerId,
          toAccountId: Number(transferState.toAccountRaw),
          amount: Number(transferState.amount),
          note: transferState.note,
        });
        patch({ referenceNo: result.referenceNo });
        setStep("success");
      } catch {
        setStep("error");
      }
    });
  };

  const stepLabel: Record<Step, string> = {
    entry: "New Transfer",
    confirm: "Review Details",
    pin: "Authorise",
    success: "Completed",
    error: "Failed",
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 size={32} className="animate-spin text-slate-400" />
          <p className="text-sm font-bold text-slate-500">Loading account details…</p>
        </div>
      </div>
    );
  }

  if (!senderWadiahAccount) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-bold text-slate-900 mb-2">Account Not Found</p>
          <p className="text-sm text-slate-500">Could not load your Wadiah account.</p>
          <Link href=".." className="text-blue-600 hover:underline mt-4 inline-block">
            Go back
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-lg mx-auto px-4 py-8">
        {/* ── Header ── */}
        <div className="flex items-center gap-4 mb-8">
          <Link
            href=".."
            className="size-9 flex items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50 transition-all shadow-sm"
          >
            <ArrowLeft size={16} />
          </Link>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-slate-900">{stepLabel[step]}</h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Wadiah Fund Transfer</p>
          </div>
          {!["success", "error"].includes(step) && <StepDots current={step} />}
        </div>

        {/* ── Sender Card ── */}
        {!["success", "error"].includes(step) && (
          <div className="bg-white border border-slate-200 rounded-2xl p-5 mb-6 flex items-center justify-between shadow-sm">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Sending From</p>
              <p className="text-sm font-bold text-slate-900 mt-0.5">Wadiah {senderWadiahAccount.maskedId}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Balance</p>
              <p className="text-sm font-bold text-slate-900 mt-0.5 tabular-nums">
                PKR {senderWadiahAccount.balance.toLocaleString()}
              </p>
            </div>
          </div>
        )}

        {/* ── Step Card ── */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          {isPending && (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <Loader2 size={32} className="animate-spin text-slate-400" />
              <p className="text-sm font-bold text-slate-500">Processing transfer…</p>
            </div>
          )}

          {!isPending && step === "entry" && (
            <EntryStep
              state={transferState}
              onChange={patch}
              senderBalance={senderWadiahAccount.balance}
              onNext={() => setStep("confirm")}
            />
          )}

          {!isPending && step === "confirm" && (
            <ConfirmStep
              state={transferState}
              senderAccount={{ maskedId: senderWadiahAccount.maskedId }}
              onBack={() => setStep("entry")}
              onConfirm={() => setStep("pin")}
            />
          )}

          {!isPending && step === "pin" && (
            <PinStep onBack={() => setStep("confirm")} onSubmit={handlePinConfirmed} />
          )}

          {!isPending && step === "success" && <SuccessStep state={transferState} onDone={reset} />}

          {!isPending && step === "error" && <ErrorStep onRetry={reset} />}
        </div>

        {/* ── Footer note ── */}
        {!["success", "error"].includes(step) && (
          <p className="text-center text-[10px] text-slate-400 font-medium mt-6">
            Transfers are Shariah-compliant and processed instantly between Wadiah accounts.
          </p>
        )}
      </div>
    </div>
  );
}