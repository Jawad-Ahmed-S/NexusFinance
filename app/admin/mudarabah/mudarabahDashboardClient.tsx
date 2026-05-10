"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Lock, Play, TrendingUp, TrendingDown,
  Users, Wallet, Activity, ChevronDown, ChevronUp
} from "lucide-react";
import StatusPopup from "@/app/components/statuspopup";
import { createCycleAction, lockCycleAction, settleCycleAction } from "./actionQueries";
import type { MudarabahCycle, MudarabahAccount } from "../lib/queries";

function formatAmount(amount: number) {
  return new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-PK", {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function CycleStatusBadge({ status }: { status: MudarabahCycle["status"] }) {
  const map = {
    open:    "bg-emerald-50 text-emerald-600 border-emerald-200",
    frozen:  "bg-blue-50 text-blue-600 border-blue-200",
    settled: "bg-slate-100 text-slate-500 border-slate-200",
  };
  return (
    <span className={`text-[10px] font-bold tracking-widest uppercase border rounded-full px-2.5 py-0.5 ${map[status]}`}>
      {status}
    </span>
  );
}

interface Props {
  cycle: MudarabahCycle | null;
  history: MudarabahCycle[];
  accounts: MudarabahAccount[];
}

export default function MudarabahDashboardClient({ cycle, history, accounts }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [popup, setPopup] = useState<{ status: "success" | "error"; message: string } | null>(null);
  const [showSettle, setShowSettle] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [percent, setPercent] = useState("");

  const totalBalance = accounts.reduce((s, a) => s + a.balance, 0);
  const activeAccounts = accounts.filter(a => a.status === "active").length;

  function showResult(result: { status: string; message: string }) {
    setPopup({
      status: result.status === "SUCCESS" ? "success" : "error",
      message: result.message,
    });
    if (result.status === "SUCCESS") setTimeout(() => router.refresh(), 1000);
  }

  function handleCreate() {
    startTransition(async () => showResult(await createCycleAction()));
  }

  function handleLock() {
    startTransition(async () => showResult(await lockCycleAction()));
  }

  function handleSettle(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await settleCycleAction(fd);
      showResult(result);
      if (result.status === "SUCCESS") setShowSettle(false);
    });
  }

  const canCreate = !cycle;
  const canLock   = cycle?.status === "open";
  const canSettle = cycle?.status === "frozen";

  return (
    <div className="p-6 space-y-6">

      {/* ── Header ── */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 tracking-tight">Mudarabah</h1>
          <p className="text-xs text-slate-400 mt-0.5 tracking-wide">
            Investment pool management and profit distribution
          </p>
        </div>
        {cycle && (
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2">
            <span className="text-xs text-slate-500 font-medium">
              {new Date(cycle.cycle_month).toLocaleDateString("en-PK", { month: "long", year: "numeric" })}
            </span>
            <span className="w-px h-3 bg-slate-200" />
            <CycleStatusBadge status={cycle.status} />
          </div>
        )}
      </div>

      {/* ── Horizontal Stats Strip — all dark ── */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 px-6 py-5 grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-800">
        <div className="pb-4 sm:pb-0 sm:pr-6">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-6 h-6 rounded-md bg-slate-800 flex items-center justify-center">
              <Wallet className="w-3 h-3 text-slate-400" />
            </div>
            <p className="text-[10px] font-bold tracking-widest uppercase text-slate-500">Pool Total</p>
          </div>
          <p className="text-lg font-semibold text-white tabular-nums">
            {cycle ? formatAmount(cycle.pool_total) : formatAmount(totalBalance)}
          </p>
        </div>

        <div className="pt-4 sm:pt-0 sm:px-6">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-6 h-6 rounded-md bg-slate-800 flex items-center justify-center">
              <Users className="w-3 h-3 text-slate-400" />
            </div>
            <p className="text-[10px] font-bold tracking-widest uppercase text-slate-500">Active Accounts</p>
          </div>
          <p className="text-lg font-semibold text-white tabular-nums">{activeAccounts}</p>
        </div>

        <div className="pt-4 sm:pt-0 sm:px-6">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-6 h-6 rounded-md bg-slate-800 flex items-center justify-center">
              <Activity className="w-3 h-3 text-slate-400" />
            </div>
            <p className="text-[10px] font-bold tracking-widest uppercase text-slate-500">Cycle Accounts</p>
          </div>
          <p className="text-lg font-semibold text-white tabular-nums">
            {cycle ? cycle.account_count : "—"}
          </p>
        </div>

        <div className="pt-4 sm:pt-0 sm:pl-6">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-6 h-6 rounded-md bg-slate-800 flex items-center justify-center">
              {(cycle?.profit_loss_percent ?? history[0]?.profit_loss_percent ?? 0) >= 0
                ? <TrendingUp className="w-3 h-3 text-emerald-400" />
                : <TrendingDown className="w-3 h-3 text-rose-400" />
              }
            </div>
            <p className="text-[10px] font-bold tracking-widest uppercase text-slate-500">Last Return</p>
          </div>
          <p className={`text-lg font-semibold tabular-nums ${
            (cycle?.profit_loss_percent ?? history[0]?.profit_loss_percent ?? 0) >= 0
              ? "text-emerald-400" : "text-rose-400"
          }`}>
            {cycle?.profit_loss_percent != null
              ? `${cycle.profit_loss_percent > 0 ? "+" : ""}${cycle.profit_loss_percent}%`
              : history[0]?.profit_loss_percent != null
              ? `${history[0].profit_loss_percent > 0 ? "+" : ""}${history[0].profit_loss_percent}%`
              : "—"
            }
          </p>
        </div>
      </div>

      {/* ── Current Cycle Card — two column ── */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        {/* header with action buttons top right */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <p className="text-[10px] font-bold tracking-widest uppercase text-slate-400">Current Cycle</p>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCreate}
              disabled={!canCreate || isPending}
              className="text-xs font-medium bg-slate-900 text-white rounded-lg px-3 py-1.5 hover:bg-slate-700 transition-colors disabled:opacity-25 disabled:cursor-not-allowed flex items-center gap-1.5"
            >
              <Play className="w-3 h-3" />
              Create
            </button>
            <button
              onClick={handleLock}
              disabled={!canLock || isPending}
              className="text-xs font-medium bg-slate-900 text-white rounded-lg px-3 py-1.5 hover:bg-slate-700 transition-colors disabled:opacity-25 disabled:cursor-not-allowed flex items-center gap-1.5"
            >
              <Lock className="w-3 h-3" />
              Lock
            </button>
            <button
              onClick={() => setShowSettle(v => !v)}
              disabled={!canSettle || isPending}
              className="text-xs font-medium bg-slate-900 text-white rounded-lg px-3 py-1.5 hover:bg-slate-700 transition-colors disabled:opacity-25 disabled:cursor-not-allowed flex items-center gap-1.5"
            >
              <TrendingUp className="w-3 h-3" />
              Settle
            </button>
          </div>
        </div>

        {!cycle ? (
          <p className="px-5 py-8 text-xs text-slate-400 text-center">
            No cycle exists for this month — create one to begin.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2">
            {/* left — timeline */}
            <div className="px-5 py-5 border-b sm:border-b-0 sm:border-r border-slate-100">
              <p className="text-[10px] font-bold tracking-widest uppercase text-slate-400 mb-4">Timeline</p>
              <div className="flex flex-col gap-4">
                {[
                  { label: "Opened",  value: formatDate(cycle.open_at),   done: true },
                  { label: "Frozen",  value: formatDate(cycle.frozen_at),  done: !!cycle.frozen_at },
                  { label: "Settled", value: formatDate(cycle.settled_at), done: !!cycle.settled_at },
                ].map((step, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="flex flex-col items-center">
                      <div className={`w-2 h-2 rounded-full mt-0.5 ${step.done ? "bg-slate-900" : "bg-slate-200"}`} />
                      {i < 2 && <div className={`w-px h-6 mt-1 ${step.done ? "bg-slate-300" : "bg-slate-100"}`} />}
                    </div>
                    <div>
                      <p className="text-[10px] font-bold tracking-widest uppercase text-slate-400">{step.label}</p>
                      <p className="text-xs font-medium text-slate-900 mt-0.5">{step.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* right — financials */}
            <div className="px-5 py-5 flex flex-col gap-4">
              <p className="text-[10px] font-bold tracking-widest uppercase text-slate-400">Financials</p>
              <div>
                <p className="text-[10px] font-bold tracking-widest uppercase text-slate-400">Pool Total</p>
                <p className="text-2xl font-semibold text-slate-900 mt-1 tabular-nums">
                  {formatAmount(cycle.pool_total)}
                </p>
              </div>
              {cycle.profit_loss_amount != null && (
                <div>
                  <p className="text-[10px] font-bold tracking-widest uppercase text-slate-400">
                    {cycle.profit_loss_percent! >= 0 ? "Profit Distributed" : "Loss Applied"}
                  </p>
                  <p className={`text-xl font-semibold mt-1 tabular-nums ${
                    cycle.profit_loss_percent! >= 0 ? "text-emerald-600" : "text-rose-600"
                  }`}>
                    {cycle.profit_loss_percent! >= 0 ? "+" : "-"}{formatAmount(Math.abs(cycle.profit_loss_amount))}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* settle form */}
        {showSettle && canSettle && (
          <form onSubmit={handleSettle} className="px-5 py-4 border-t border-slate-100 bg-slate-50 flex flex-wrap items-end gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold tracking-widest uppercase text-slate-400">
                Profit / Loss %
              </label>
              <input
                name="percent"
                type="number"
                step="0.01"
                min="-100"
                max="100"
                value={percent}
                onChange={e => setPercent(e.target.value)}
                placeholder="e.g. 5.00 or -2.50"
                required
                className="text-xs border border-slate-200 rounded-lg px-3 py-2 w-48 bg-white focus:outline-none focus:ring-2 focus:ring-slate-200 transition-colors hover:border-slate-300 placeholder:text-slate-300"
              />
              <p className="text-[10px] text-slate-400">Positive = profit · Negative = loss</p>
            </div>
            <div className="flex gap-2 mb-5">
              <button
                type="submit"
                disabled={isPending}
                className="text-xs font-medium bg-slate-900 text-white rounded-lg px-4 py-2 hover:bg-slate-700 transition-colors disabled:opacity-50"
              >
                {isPending ? "Processing..." : "Confirm"}
              </button>
              <button
                type="button"
                onClick={() => setShowSettle(false)}
                className="text-xs font-medium text-slate-500 border border-slate-200 bg-white rounded-lg px-4 py-2 hover:border-slate-300 hover:text-slate-700 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>

      {/* ── Participating Accounts Table ── */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <p className="text-[10px] font-bold tracking-widest uppercase text-slate-400">
            Participating Accounts
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100">
                {["Account ID", "Customer", "Balance", "Share %", "P&L Amount", "Status"].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-[10px] font-bold tracking-widest uppercase text-slate-400">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {accounts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-xs text-slate-400">
                    No Mudarabah accounts found
                  </td>
                </tr>
              ) : accounts.map(acc => {
                const share = acc.share_percent ?? 0;
                const accentOpacity = Math.max(0.12, Math.min(share * 4, 0.9));
                return (
                  <tr
                    key={acc.account_id}
                    className="border-b border-slate-50 hover:bg-slate-50 transition-colors"
                    style={{ borderLeft: `3px solid rgba(15,23,42,${accentOpacity})` }}
                  >
                    <td className="px-5 py-3 text-xs text-slate-500 font-mono">#{acc.account_id}</td>
                    <td className="px-5 py-3 text-xs font-medium text-slate-900">{acc.full_name}</td>
                    <td className="px-5 py-3 text-xs text-slate-900 tabular-nums">{formatAmount(acc.balance)}</td>
                    <td className="px-5 py-3 text-xs text-slate-600 tabular-nums">
                      {acc.share_percent != null ? `${(acc.share_percent * 100).toFixed(2)}%` : "—"}
                    </td>
                    <td className="px-5 py-3 text-xs tabular-nums">
                      {acc.profit_loss_amount != null ? (
                        <span className={acc.profit_loss_amount >= 0 ? "text-emerald-600" : "text-rose-600"}>
                          {formatAmount(acc.profit_loss_amount)}
                        </span>
                      ) : "—"}
                    </td>
                    <td className="px-5 py-3">
                      <span className={`text-[10px] font-bold tracking-widest uppercase border rounded-full px-2 py-0.5 ${
                        acc.status === "active"
                          ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                          : "bg-slate-100 text-slate-500 border-slate-200"
                      }`}>
                        {acc.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Cycle History ── */}
      {history.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <button
            onClick={() => setShowHistory(v => !v)}
            className="w-full px-5 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
          >
            <p className="text-[10px] font-bold tracking-widest uppercase text-slate-400">
              Cycle History ({history.length})
            </p>
            {showHistory
              ? <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
              : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            }
          </button>
          {showHistory && (
            <div className="overflow-x-auto border-t border-slate-100">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100">
                    {["Month", "Pool Total", "Accounts", "Return %", "P&L Amount", "Status", "Settled"].map(h => (
                      <th key={h} className="text-left px-5 py-3 text-[10px] font-bold tracking-widest uppercase text-slate-400">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {history.map(h => (
                    <tr key={h.cycle_id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-3 text-xs font-medium text-slate-900">
                        {new Date(h.cycle_month).toLocaleDateString("en-PK", { month: "long", year: "numeric" })}
                      </td>
                      <td className="px-5 py-3 text-xs text-slate-900 tabular-nums">{formatAmount(h.pool_total)}</td>
                      <td className="px-5 py-3 text-xs text-slate-600 tabular-nums">{h.account_count}</td>
                      <td className="px-5 py-3 text-xs tabular-nums">
                        {h.profit_loss_percent != null ? (
                          <span className={h.profit_loss_percent >= 0 ? "text-emerald-600" : "text-rose-600"}>
                            {h.profit_loss_percent > 0 ? "+" : ""}{h.profit_loss_percent}%
                          </span>
                        ) : "—"}
                      </td>
                      <td className="px-5 py-3 text-xs tabular-nums">
                        {h.profit_loss_amount != null ? (
                          <span className={h.profit_loss_amount >= 0 ? "text-emerald-600" : "text-rose-600"}>
                            {formatAmount(Math.abs(h.profit_loss_amount))}
                          </span>
                        ) : "—"}
                      </td>
                      <td className="px-5 py-3"><CycleStatusBadge status={h.status} /></td>
                      <td className="px-5 py-3 text-xs text-slate-500">{formatDate(h.settled_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Popup */}
      {popup && (
        <StatusPopup
          status={popup.status}
          message={popup.message}
          onClose={() => setPopup(null)}
        />
      )}

    </div>
  );
}