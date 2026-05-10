// app/admin/accounts/page.tsx
// Nexus Bank — Account Management | Next.js Server Component + Server Actions

import { getAccounts } from "../lib/queries";
import { freezeAccount, unfreezeAccount, closeAccount } from "../lib/queries";
import { revalidatePath } from "next/cache";
import {
  Landmark,
  Search,
  ShieldCheck,
  ShieldOff,
  Archive,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  LayoutDashboard,
  AlertTriangle,
} from "lucide-react";
import Link from "next/link";
import { ConfirmButton } from "./button";

// ─── helpers ────────────────────────────────────────────────

function fmt(n: number) {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}

function timeAgo(date: Date) {
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function statusConfig(status: string) {
  switch (status) {
    case "active":
      return { dot: "bg-green-500", badge: "bg-green-50 text-green-700", label: "Active" };
    case "frozen":
      return { dot: "bg-amber-400", badge: "bg-amber-50 text-amber-700", label: "Frozen" };
    case "closed":
      return { dot: "bg-slate-300", badge: "bg-slate-100 text-slate-500", label: "Closed" };
    default:
      return { dot: "bg-slate-300", badge: "bg-slate-100 text-slate-500", label: status };
  }
}

function typeLabel(type: string) {
  if (type === "wadi_ah") return "Wadiah";
  if (type === "mudarabah") return "Mudarabah";
  if (type === "charity") return "Charity";
  return type;
}

// ─── Server Actions ──────────────────────────────────────────

async function handleFreeze(formData: FormData) {
  "use server";
  const id = Number(formData.get("accountId"));
  try {
    await freezeAccount(id);
  } catch (e) {
    // errors surface via redirect with error param
    const msg = e instanceof Error ? e.message : "Unknown error";
    const { redirect } = await import("next/navigation");
    redirect(`/admin/accounts?error=${encodeURIComponent(msg)}`);
  }
  revalidatePath("/admin/accounts");
}

async function handleUnfreeze(formData: FormData) {
  "use server";
  const id = Number(formData.get("accountId"));
  try {
    await unfreezeAccount(id);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    const { redirect } = await import("next/navigation");
    redirect(`/admin/accounts?error=${encodeURIComponent(msg)}`);
  }
  revalidatePath("/admin/accounts");
}

async function handleClose(formData: FormData) {
  "use server";
  const id = Number(formData.get("accountId"));
  try {
    await closeAccount(id);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    const { redirect } = await import("next/navigation");
    redirect(`/admin/accounts?error=${encodeURIComponent(msg)}`);
  }
  revalidatePath("/admin/accounts");
}

// ─── Page ────────────────────────────────────────────────────

export default async function AccountManagementPage({
  searchParams,
}: {
  searchParams: { page?: string; status?: string; type?: string; search?: string; error?: string };
}) {
  const page       = Math.max(1, Number(searchParams.page ?? 1));
  const status     = searchParams.status ?? "";
  const accountType = searchParams.type ?? "";
  const search     = searchParams.search ?? "";
  const error      = searchParams.error ?? "";

  const { accounts, total, totalPages } = await getAccounts({
    page,
    limit: 15,
    status:      status      || undefined,
    accountType: accountType || undefined,
    search:      search      || undefined,
  });

  const now = new Date();

  // build query string helper for pagination links
  function pageHref(p: number) {
    const params = new URLSearchParams();
    params.set("page", String(p));
    if (status)      params.set("status", status);
    if (accountType) params.set("type", accountType);
    if (search)      params.set("search", search);
    return `/admin/accounts?${params.toString()}`;
  }

  return (
    <main className="min-h-screen bg-[#FAFAFA] font-sans">

      {/* ── HEADER ── */}
      <header className="bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
            Financial Portal / Account Management
          </p>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2 mt-0.5">
            <Landmark strokeWidth={2} className="w-5 h-5 text-slate-400" />
            Account Control Center
          </h1>
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="/admin/dashboard"
            className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors"
          >
            <LayoutDashboard strokeWidth={2} className="w-3.5 h-3.5" />
            Dashboard
          </Link>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-600" />
            {total} total accounts
          </div>
        </div>
      </header>

      <div className="px-8 py-8 max-w-[1400px] mx-auto space-y-6">

        {/* ── ERROR BANNER ── */}
        {error && (
          <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
            <AlertTriangle strokeWidth={2} className="w-4 h-4 text-red-500 flex-shrink-0" />
            <p className="text-sm text-red-700">{decodeURIComponent(error)}</p>
          </div>
        )}

        {/* ── FILTERS ── */}
        <section className="bg-white rounded-2xl border border-slate-200 p-5">
          <div className="flex items-center gap-2 mb-4">
            <SlidersHorizontal strokeWidth={2} className="w-3.5 h-3.5 text-slate-400" />
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Filters</p>
          </div>
          <form method="GET" action="/admin/accounts" className="flex flex-wrap gap-3 items-end">
            {/* Search */}
            <div className="flex-1 min-w-[200px]">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-1.5">
                Search
              </label>
              <div className="relative">
                <Search strokeWidth={2} className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  name="search"
                  defaultValue={search}
                  placeholder="Account ID or customer name"
                  className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-400 transition-colors"
                />
              </div>
            </div>

            {/* Account Type */}
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-1.5">
                Account Type
              </label>
              <select
                name="type"
                defaultValue={accountType}
                className="px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white text-slate-700 focus:outline-none focus:border-slate-400 transition-colors"
              >
                <option value="">All Types</option>
                <option value="wadi_ah">Wadiah</option>
                <option value="mudarabah">Mudarabah</option>
                <option value="charity">Charity</option>
              </select>
            </div>

            {/* Status */}
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-1.5">
                Status
              </label>
              <select
                name="status"
                defaultValue={status}
                className="px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white text-slate-700 focus:outline-none focus:border-slate-400 transition-colors"
              >
                <option value="">All Statuses</option>
                <option value="active">Active</option>
                <option value="frozen">Frozen</option>
                <option value="closed">Closed</option>
              </select>
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                className="px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-700 transition-colors"
              >
                Apply
              </button>
              <Link
                href="/admin/accounts"
                className="px-4 py-2 border border-slate-200 text-slate-600 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors"
              >
                Reset
              </Link>
            </div>
          </form>
        </section>

        {/* ── ACCOUNTS TABLE ── */}
        <section className="bg-white rounded-2xl border border-slate-200">
          <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-slate-100">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
              Accounts — Page {page} of {totalPages}
            </p>
            <p className="text-xs text-slate-400 tabular-nums">
              {total} result{total !== 1 ? "s" : ""}
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[10px] font-bold uppercase tracking-widest text-slate-400 border-b border-slate-100">
                  <th className="text-left px-6 py-3">Account ID</th>
                  <th className="text-left px-6 py-3">Customer</th>
                  <th className="text-left px-6 py-3">Type</th>
                  <th className="text-left px-6 py-3">Status</th>
                  <th className="text-right px-6 py-3">Balance</th>
                  <th className="text-left px-6 py-3">Opened</th>
                  <th className="text-right px-6 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {accounts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-16 text-center">
                      <p className="text-slate-400 text-sm">No accounts found</p>
                      <p className="text-slate-300 text-xs mt-1">Try adjusting your filters</p>
                    </td>
                  </tr>
                ) : (
                  accounts.map((acc) => {
                    const sc = statusConfig(acc.status);
                    return (
                      <tr key={acc.accountId} className="hover:bg-slate-50/60 transition-colors">
                        {/* Account ID */}
                        <td className="px-6 py-4 font-mono text-xs text-slate-500">
                          #{acc.accountId}
                        </td>

                        {/* Customer */}
                        <td className="px-6 py-4">
                          <p className="font-medium text-slate-800">{acc.customerName}</p>
                        </td>

                        {/* Type */}
                        <td className="px-6 py-4">
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                            {typeLabel(acc.accountType)}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${sc.badge}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                            {sc.label}
                          </span>
                        </td>

                        {/* Balance */}
                        <td className="px-6 py-4 text-right font-mono font-semibold tabular-nums text-slate-900">
                          PKR {fmt(acc.balance)}
                        </td>

                        {/* Opened */}
                        <td className="px-6 py-4 text-xs text-slate-400">
                          {timeAgo(acc.openedAt)}
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2">
                            {/* Freeze — only for active */}
                            {acc.status === "active" && (
                              <form action={handleFreeze}>
                                <input type="hidden" name="accountId" value={acc.accountId} />
                                
                                <ConfirmButton message={`Freeze account #${acc.accountId}?`} className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1.5 rounded-md border border-amber-200 text-amber-700 bg-amber-50 hover:bg-amber-100 transition-colors">
                                  <ShieldOff strokeWidth={2} className="w-3 h-3" />
                                  Freeze
                                </ConfirmButton>
                              </form>
                            )}

                            {/* Unfreeze — only for frozen */}
                            {acc.status === "frozen" && (
                              <form action={handleUnfreeze}>
                                <input type="hidden" name="accountId" value={acc.accountId} />
                                <ConfirmButton message={`Unfreeze account #${acc.accountId}?`} className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1.5 rounded-md border border-green-200 text-green-700 bg-green-50 hover:bg-green-100 transition-colors">
                                  <ShieldCheck strokeWidth={2} className="w-3 h-3" />
                                  Unfreeze
                                </ConfirmButton>
                              </form>
                            )}

                            {/* Close — active or frozen only */}
                            {acc.status !== "closed" && (
                              <form action={handleClose}>
                                <input type="hidden" name="accountId" value={acc.accountId} />
                                <ConfirmButton message={`Permanently close account #${acc.accountId}? This cannot be undone.`} className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1.5 rounded-md border border-slate-200 text-slate-500 bg-white hover:bg-slate-50 hover:text-slate-800 transition-colors">
                                  <Archive strokeWidth={2} className="w-3 h-3" />
                                  Close
                                </ConfirmButton>
                              </form>
                            )}

                            {/* Closed state — no actions */}
                            {acc.status === "closed" && (
                              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300">
                                No actions
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* ── PAGINATION ── */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100">
              <p className="text-xs text-slate-400 tabular-nums">
                Showing {(page - 1) * 15 + 1}–{Math.min(page * 15, total)} of {total}
              </p>
              <div className="flex items-center gap-2">
                {page > 1 ? (
                  <Link
                    href={pageHref(page - 1)}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors"
                  >
                    <ChevronLeft strokeWidth={2} className="w-3.5 h-3.5" />
                    Prev
                  </Link>
                ) : (
                  <span className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium border border-slate-100 rounded-lg text-slate-300 cursor-not-allowed">
                    <ChevronLeft strokeWidth={2} className="w-3.5 h-3.5" />
                    Prev
                  </span>
                )}

                {/* Page numbers */}
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let p: number;
                    if (totalPages <= 5) {
                      p = i + 1;
                    } else if (page <= 3) {
                      p = i + 1;
                    } else if (page >= totalPages - 2) {
                      p = totalPages - 4 + i;
                    } else {
                      p = page - 2 + i;
                    }
                    return (
                      <Link
                        key={p}
                        href={pageHref(p)}
                        className={`w-8 h-8 flex items-center justify-center text-xs font-medium rounded-lg transition-colors ${
                          p === page
                            ? "bg-slate-900 text-white"
                            : "border border-slate-200 text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        {p}
                      </Link>
                    );
                  })}
                </div>

                {page < totalPages ? (
                  <Link
                    href={pageHref(page + 1)}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors"
                  >
                    Next
                    <ChevronRight strokeWidth={2} className="w-3.5 h-3.5" />
                  </Link>
                ) : (
                  <span className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium border border-slate-100 rounded-lg text-slate-300 cursor-not-allowed">
                    Next
                    <ChevronRight strokeWidth={2} className="w-3.5 h-3.5" />
                  </span>
                )}
              </div>
            </div>
          )}
        </section>

      </div>
    </main>
  );
}