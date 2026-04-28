"use client";

import React, { useState, useMemo, useRef, useEffect, useCallback } from "react";
import {
  ArrowLeft,
  Search,
  Filter,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownLeft,
  ChevronDown,
  X,
  Download,
  RefreshCw,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { getTransactionHistory } from "@/app/(user)/lib/queries";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Transaction {
  transaction_id: string | number;
  reference_note: string;
  txn_type: string;
  direction: "CREDIT" | "DEBIT";
  created_at: string | Date;
  amount: number | string;
  account_label?: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const TXN_TYPE_OPTIONS = ["ALL", "TRANSFER", "SALARY", "BILL PAY", "POS", "ATM", "DEPOSIT", "PROFIT"];
const DIRECTION_OPTIONS = ["ALL", "CREDIT", "DEBIT"];
const DATE_RANGE_OPTIONS = ["All Time", "This Month", "Last Month", "Last 3 Months", "Last 6 Months"];
const PAGE_SIZE = 20; // Changed to 20 per your requirement

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(d: string | Date) {
  return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function getDateRangeBounds(range: string): { start?: Date; end?: Date } {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  if (range === "This Month") {
    return {
      start: new Date(now.getFullYear(), now.getMonth(), 1),
      end: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999),
    };
  }

  if (range === "Last Month") {
    return {
      start: new Date(now.getFullYear(), now.getMonth() - 1, 1),
      end: new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999),
    };
  }

  if (range === "Last 3 Months") {
    return { start: new Date(now.getFullYear(), now.getMonth() - 3, 1), end: now };
  }

  if (range === "Last 6 Months") {
    return { start: new Date(now.getFullYear(), now.getMonth() - 6, 1), end: now };
  }

  return { start: startOfToday, end: now };
}

// ─── Sub-component: Custom Dropdown ──────────────────────────────────────────

interface DropdownOption { value: string; label: string }

function Dropdown({ value, onChange, options }: {
  value: string;
  onChange: (v: string) => void;
  options: DropdownOption[];
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className={`flex items-center gap-2 pl-3.5 pr-3 py-2 text-[11px] font-bold border rounded-xl bg-white transition-all whitespace-nowrap
          ${open
            ? "border-slate-400 text-slate-900 shadow-sm"
            : "border-slate-200 text-slate-600 hover:border-slate-300 hover:text-slate-800"
          }`}
      >
        {selected?.label}
        <ChevronDown size={11} className={`text-slate-400 transition-transform duration-150 ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1.5 z-50 bg-white border border-slate-200 rounded-xl shadow-lg py-1 min-w-[11rem] overflow-hidden">
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => { onChange(opt.value); setOpen(false); }}
              className={`w-full text-left px-4 py-2.5 text-[11px] font-bold transition-colors
                ${opt.value === value
                  ? "bg-slate-900 text-white"
                  : "text-slate-700 hover:bg-slate-50"
                }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Sub-component: Stat Card ─────────────────────────────────────────────────

function StatCard({ label, value, sub, accent }: {
  label: string; value: string; sub: string; accent: "green" | "slate" | "red";
}) {
  const pill = {
    green: "bg-green-50 border-green-200 text-green-700",
    slate: "bg-slate-50 border-slate-200 text-slate-500",
    red:   "bg-red-50 border-red-200 text-red-600",
  };
  const icon = {
    green: <TrendingUp size={13} />,
    slate: <RefreshCw size={13} />,
    red:   <TrendingDown size={13} />,
  };
  return (
    <div className="border border-slate-200 rounded-xl p-5 bg-white shadow-sm flex flex-col gap-3">
      <div className={`self-start flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg border ${pill[accent]}`}>
        {icon[accent]}
        {label}
      </div>
      <p className="text-2xl font-bold text-slate-900 tabular-nums">{value}</p>
      <p className="text-[10px] text-slate-400 font-medium">{sub}</p>
    </div>
  );
}

// ─── Sub-component: Filter Bar ────────────────────────────────────────────────

function FilterBar({
  search, setSearch,
  txnType, setTxnType,
  direction, setDirection,
  dateRange, setDateRange,
  activeCount, onClear,
  loading,
}: {
  search: string;      setSearch: (v: string) => void;
  txnType: string;     setTxnType: (v: string) => void;
  direction: string;   setDirection: (v: string) => void;
  dateRange: string;   setDateRange: (v: string) => void;
  activeCount: number; onClear: () => void;
  loading: boolean;
}) {
  const dateOptions = DATE_RANGE_OPTIONS.map((o) => ({ value: o, label: o }));
  const dirOptions  = DIRECTION_OPTIONS.map((o) => ({ value: o, label: o === "ALL" ? "All Directions" : o }));
  const typeOptions = TXN_TYPE_OPTIONS.map((o) => ({ value: o, label: o === "ALL" ? "All Types" : o }));

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-3">
      {/* Search */}
      <div className="relative">
        <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Search by reference or type…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          disabled={loading}
          className="w-full pl-9 pr-9 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100 transition-all bg-slate-50 text-slate-900 placeholder:text-slate-400 disabled:opacity-50"
        />
        {search && (
          <button type="button" onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors">
            <X size={13} />
          </button>
        )}
      </div>

      {/* Dropdowns row */}
      <div className="flex flex-wrap gap-2 items-center">
        <Dropdown value={dateRange} onChange={setDateRange} options={dateOptions} />
        <Dropdown value={direction} onChange={setDirection} options={dirOptions} />
        <Dropdown value={txnType}   onChange={setTxnType}   options={typeOptions} />

        {activeCount > 0 && (
          <button
            type="button"
            onClick={onClear}
            disabled={loading}
            className="flex items-center gap-1.5 text-[11px] font-bold px-3 py-2 rounded-xl bg-slate-900 text-white hover:bg-slate-700 transition-all disabled:opacity-50"
          >
            <X size={11} />
            Clear ({activeCount})
          </button>
        )}

        <div className="ml-auto">
          <button type="button" className="flex items-center gap-1.5 text-[11px] font-bold px-3 py-2 rounded-xl border border-slate-200 text-slate-600 hover:border-slate-400 hover:bg-slate-50 transition-all">
            <Download size={12} />
            Export
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Sub-component: Desktop Table ─────────────────────────────────────────────

function DesktopTable({ transactions, loading }: { transactions: Transaction[]; loading: boolean }) {
  return (
    <div className="hidden sm:block bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
      <table className="w-full text-left">
        <thead className="bg-slate-50 border-b border-slate-200 text-slate-400 text-[10px] uppercase font-bold tracking-wider">
          <tr>
            <th className="px-6 lg:px-8 py-4">Details</th>
            <th className="px-6 lg:px-8 py-4">Account</th>
            <th className="px-6 lg:px-8 py-4">Type</th>
            <th className="px-6 lg:px-8 py-4 text-right">Date</th>
            <th className="px-6 lg:px-8 py-4 text-right">Amount (PKR)</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {transactions.map((tx) => (
            <tr key={tx.transaction_id} className="hover:bg-slate-50/60 transition-colors">
              <td className="px-6 lg:px-8 py-5">
                <div className="flex items-center gap-3">
                  <div className={`size-8 rounded-lg flex items-center justify-center shrink-0
                    ${tx.direction === "CREDIT" ? "bg-green-50 text-green-600" : "bg-slate-50 text-slate-500"}`}>
                    {tx.direction === "CREDIT" ? <ArrowDownLeft size={14} /> : <ArrowUpRight size={14} />}
                  </div>
                  <span className="font-bold text-slate-800 text-sm">{tx.reference_note}</span>
                </div>
              </td>
              <td className="px-6 lg:px-8 py-5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                  {tx.account_label ?? "—"}
                </span>
              </td>
              <td className="px-6 lg:px-8 py-5">
                <span className={`text-[10px] font-black px-2.5 py-1 rounded-md border
                  ${tx.direction === "CREDIT"
                    ? "bg-green-50 border-green-200 text-green-700"
                    : "bg-slate-50 border-slate-200 text-slate-600"}`}>
                  {tx.txn_type}
                </span>
              </td>
              <td className="px-6 lg:px-8 py-5 text-right text-xs text-slate-400 font-medium tabular-nums">
                {formatDate(tx.created_at)}
              </td>
              <td className={`px-6 lg:px-8 py-5 text-right font-mono font-bold text-sm tabular-nums
                ${tx.direction === "CREDIT" ? "text-green-600" : "text-slate-900"}`}>
                {tx.direction === "CREDIT" ? "+" : "−"} {Number(tx.amount).toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Sub-component: Mobile Cards ──────────────────────────────────────────────

function MobileCards({ transactions }: { transactions: Transaction[] }) {
  return (
    <div className="sm:hidden space-y-3">
      {transactions.map((tx) => (
        <div key={tx.transaction_id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-start gap-3">
            <div className={`size-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5
              ${tx.direction === "CREDIT" ? "bg-green-50 text-green-600" : "bg-slate-50 text-slate-500"}`}>
              {tx.direction === "CREDIT" ? <ArrowDownLeft size={15} /> : <ArrowUpRight size={15} />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <p className="font-bold text-slate-800 text-sm leading-snug truncate pr-1">
                  {tx.reference_note}
                </p>
                <p className={`font-mono font-bold text-sm shrink-0 tabular-nums
                  ${tx.direction === "CREDIT" ? "text-green-600" : "text-slate-900"}`}>
                  {tx.direction === "CREDIT" ? "+" : "−"}{Number(tx.amount).toLocaleString()}
                </p>
              </div>
              <div className="flex items-center justify-between mt-2 gap-2">
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-md border
                    ${tx.direction === "CREDIT"
                      ? "bg-green-50 border-green-200 text-green-700"
                      : "bg-slate-50 border-slate-200 text-slate-600"}`}>
                    {tx.txn_type}
                  </span>
                  <span className="text-[10px] text-slate-400 font-bold uppercase">{tx.account_label}</span>
                </div>
                <p className="text-[10px] text-slate-400 font-medium tabular-nums">{formatDate(tx.created_at)}</p>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Sub-component: Empty State ───────────────────────────────────────────────

function EmptyState({ onClear }: { onClear: () => void }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-12 text-center shadow-sm">
      <div className="size-14 bg-slate-50 rounded-xl flex items-center justify-center mx-auto mb-4">
        <Filter size={20} className="text-slate-400" />
      </div>
      <p className="font-bold text-slate-800 text-sm">No transactions match your filters</p>
      <p className="text-xs text-slate-400 mt-1">Try adjusting the date range or clearing filters</p>
      <button
        type="button"
        onClick={onClear}
        className="mt-4 text-xs font-bold text-slate-600 underline hover:text-slate-900 transition-colors"
      >
        Clear all filters
      </button>
    </div>
  );
}

// ─── Sub-component: Load More ─────────────────────────────────────────────────

function LoadMore({ hasMore, total, onLoadMore, loading }: {
  hasMore: boolean; total: number; onLoadMore: () => void; loading: boolean;
}) {
  if (!hasMore && total > 0) {
    return (
      <p className="text-center text-[10px] text-slate-400 font-medium pb-4">
        All {total} transactions shown
      </p>
    );
  }
  if (!hasMore) return null;
  
  return (
    <div className="flex flex-col items-center gap-2 pb-4">
      <p className="text-[10px] text-slate-400 font-medium">
        Showing {total > 0 ? "partial" : "0"} results — load more
      </p>
      <button
        type="button"
        onClick={onLoadMore}
        disabled={loading}
        className="flex items-center gap-2 px-5 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:border-slate-400 bg-white shadow-sm transition-all disabled:opacity-50"
      >
        {loading ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
        Load more
      </button>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function TransactionHistoryPage({ userId }: { userId?: number }) {
  const searchParams = useSearchParams();
  const queryUserId = Number(searchParams.get("userId"));
  const resolvedUserId = Number.isFinite(userId) && Number(userId) > 0
    ? Number(userId)
    : (Number.isFinite(queryUserId) && queryUserId > 0 ? queryUserId : 1);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  
  // Filter states
  const [search, setSearch] = useState("");
  const [txnType, setTxnType] = useState("ALL");
  const [direction, setDirection] = useState("ALL");
  const [dateRange, setDateRange] = useState("All Time");

  const activeFilterCount = [
    search !== "",
    txnType !== "ALL",
    direction !== "ALL",
    dateRange !== "All Time",
  ].filter(Boolean).length;

  // Fetch transactions with current filters
  const fetchTransactions = useCallback(async (currentPage: number, append = false) => {
    if (currentPage === 1) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }

    try {
      const rows = await getTransactionHistory(resolvedUserId);
      
      const normalized: Transaction[] = rows.map((row: any) => ({
        transaction_id: row.txn_id,
        reference_note: row.reference_note ?? "—",
        txn_type: String(row.txn_type ?? "").toUpperCase(),
        direction: String(row.direction ?? "").toUpperCase() === "CREDIT" ? "CREDIT" : "DEBIT",
        created_at: row.created_at,
        amount: row.amount,
        account_label: row.account_type ? String(row.account_type).replace("_", " ").toUpperCase() : "—",
      }));


      const searchTerm = search.trim().toLowerCase();
      const filtered = normalized.filter((tx) => {
        const matchesSearch =
          !searchTerm ||
          tx.reference_note.toLowerCase().includes(searchTerm) ||
          tx.txn_type.toLowerCase().includes(searchTerm);

        const matchesType = txnType === "ALL" || tx.txn_type === txnType;
        const matchesDirection = direction === "ALL" || tx.direction === direction;

        let matchesDate = true;
        if (dateRange !== "All Time") {
          const txDate = new Date(tx.created_at);
          if (Number.isNaN(txDate.getTime())) {
            matchesDate = false;
          } else {
            const { start, end } = getDateRangeBounds(dateRange);
            if (start && txDate < start) matchesDate = false;
            if (end && txDate > end) matchesDate = false;
          }
        }

        return matchesSearch && matchesType && matchesDirection && matchesDate;
      });

      const nextSlice = filtered.slice(0, currentPage * PAGE_SIZE);
      setTransactions(nextSlice);
      setTotal(filtered.length);
      setHasMore(nextSlice.length < filtered.length);
      setPage(currentPage);
    } catch (error) {
      console.error("Failed to fetch transactions:", error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [resolvedUserId, search, txnType, direction, dateRange]);

  // Reset and fetch when filters change
  useEffect(() => {
    setPage(1);
    setTransactions([]);
    fetchTransactions(1, false);
  }, [search, txnType, direction, dateRange, fetchTransactions]);

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      fetchTransactions(page + 1, true);
    }
  };

  const clearFilters = () => {
    setSearch("");
    setTxnType("ALL");
    setDirection("ALL");
    setDateRange("All Time");
  };

  // Calculate stats from fetched transactions (only current page or all? 
  // For accurate stats you'd need a separate API call, but for simplicity using current)
  const totalCredits = transactions.filter(t => t.direction === "CREDIT").reduce((s, t) => s + Number(t.amount), 0);
  const totalDebits = transactions.filter(t => t.direction === "DEBIT").reduce((s, t) => s + Number(t.amount), 0);
  const netFlow = totalCredits - totalDebits;

  // Group transactions by month
  const grouped = useMemo(() => {
    const map = new Map<string, Transaction[]>();
    transactions.forEach((tx) => {
      const key = new Date(tx.created_at).toLocaleDateString("en-GB", { month: "long", year: "numeric" });
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(tx);
    });
    return map;
  }, [transactions]);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">

        {/* Header */}
        <div className="flex items-center gap-4">
          <Link
            href=".."
            className="size-9 flex items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50 transition-all shadow-sm"
          >
            <ArrowLeft size={16} />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Transaction History</h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
              Full Ledger · All Accounts
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            label="Total Credits"
            value={`PKR ${totalCredits.toLocaleString()}`}
            sub={`${transactions.filter(t => t.direction === "CREDIT").length} inbound transactions`}
            accent="green"
          />
          <StatCard
            label="Total Debits"
            value={`PKR ${totalDebits.toLocaleString()}`}
            sub={`${transactions.filter(t => t.direction === "DEBIT").length} outbound transactions`}
            accent="red"
          />
          <StatCard
            label="Net Flow"
            value={`${netFlow >= 0 ? "+" : "−"}PKR ${Math.abs(netFlow).toLocaleString()}`}
            sub={`Across ${transactions.length} loaded transactions`}
            accent={netFlow >= 0 ? "green" : "slate"}
          />
        </div>

        {/* Filter Bar */}
        <FilterBar
          search={search} setSearch={setSearch}
          txnType={txnType} setTxnType={setTxnType}
          direction={direction} setDirection={setDirection}
          dateRange={dateRange} setDateRange={setDateRange}
          activeCount={activeFilterCount}
          onClear={clearFilters}
          loading={loading}
        />

        {/* Transaction List */}
        {loading && transactions.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
            <Loader2 size={24} className="animate-spin text-slate-400 mx-auto" />
            <p className="text-xs text-slate-400 mt-3">Loading transactions...</p>
          </div>
        ) : transactions.length === 0 ? (
          <EmptyState onClear={clearFilters} />
        ) : (
          <div className="space-y-8">
            {Array.from(grouped.entries()).map(([month, txns]) => {
              const mCredits = txns.filter(t => t.direction === "CREDIT").reduce((s, t) => s + Number(t.amount), 0);
              const mDebits = txns.filter(t => t.direction === "DEBIT").reduce((s, t) => s + Number(t.amount), 0);
              return (
                <div key={month} className="space-y-3">
                  <div className="flex items-center justify-between px-1">
                    <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em]">{month}</h3>
                    <div className="flex items-center gap-4 text-[10px] font-bold">
                      <span className="text-green-600">+{mCredits.toLocaleString()}</span>
                      <span className="text-slate-400">−{mDebits.toLocaleString()}</span>
                    </div>
                  </div>
                  <DesktopTable transactions={txns} loading={loading} />
                  <MobileCards transactions={txns} />
                </div>
              );
            })}

            <LoadMore
              hasMore={hasMore}
              total={total}
              onLoadMore={handleLoadMore}
              loading={loadingMore}
            />
          </div>
        )}
      </div>
    </div>
  );
}