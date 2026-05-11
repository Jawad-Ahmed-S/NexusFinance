"use client";

import React, { useState, useEffect } from "react";
import {
  User, Lock, Phone, Mail, FileText,
  Download, ChevronRight, ShieldCheck,
  AlertCircle, X, Eye, EyeOff, Loader2,
} from "lucide-react";
import { useSession } from "next-auth/react";
import {
  getUserProfile,
  getCustomerId,
  updateFullName,
  updatePhone,
  updateEmail,
  updateUsername,
  getWadiahAccount,
  updateAccountStatus,
  hasMudarabahAccount,
  getMudarabahAccount,
  updateMudarabahStatus,
} from "@/app/(user)/lib/queries";
import { updatePassword } from "@/app/(user)/lib/password-actions";

// ─── Types ───────────────────────────────────────────────────

interface UserData {
  full_name: string;
  phone:     string;
  email:     string;
  username:  string;
}

interface AccountInfo {
  account_id: string;
  status:     string;
}

// ─── Small reusable row ───────────────────────────────────────

function SettingRow({
  label, value, onEdit, mono = false,
}: {
  label: string; value: string; onEdit?: () => void; mono?: boolean;
}) {
  return (
    <div className="flex items-center justify-between p-5 border-b border-slate-100 last:border-0 hover:bg-slate-50/50 transition-colors">
      <div>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</p>
        <p className={`text-sm font-semibold text-slate-900 mt-0.5 ${mono ? "font-mono" : ""}`}>
          {value || "—"}
        </p>
      </div>
      {onEdit && (
        <button
          onClick={onEdit}
          className="text-xs font-bold text-slate-400 hover:text-slate-900 transition-colors"
        >
          Edit
        </button>
      )}
    </div>
  );
}

function StatusDot({ status }: { status: string }) {
  const color =
    status === "active"   ? "bg-green-500" :
    status === "frozen"   ? "bg-amber-400" :
    status === "closed"   ? "bg-slate-300" : "bg-slate-300";
  return <span className={`inline-flex h-1.5 w-1.5 rounded-full ${color}`} />;
}

// ─── Popups ───────────────────────────────────────────────────

function Modal({ title, onClose, children }: {
  title: string; onClose: () => void; children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-md mx-4 shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <h3 className="text-base font-bold text-slate-900">{title}</h3>
          <button onClick={onClose} className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100">
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function ModalActions({ onCancel, onSave, saveLabel = "Save" }: {
  onCancel: () => void; onSave: () => void; saveLabel?: string;
}) {
  return (
    <div className="flex gap-3 p-5 pt-0">
      <button onClick={onCancel} className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-medium hover:bg-slate-50 transition-colors">
        Cancel
      </button>
      <button onClick={onSave} className="flex-1 px-4 py-2.5 rounded-xl bg-slate-900 text-white font-medium hover:bg-slate-800 transition-colors">
        {saveLabel}
      </button>
    </div>
  );
}

function EditFieldPopup({ field, currentValue, onSave, onClose }: {
  field: string; currentValue: string; onSave: (v: string) => void; onClose: () => void;
}) {
  const [value, setValue] = useState(currentValue);
  return (
    <Modal title={`Edit ${field}`} onClose={onClose}>
      <div className="p-5">
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 text-sm"
          placeholder={`Enter ${field.toLowerCase()}`}
        />
      </div>
      <ModalActions onCancel={onClose} onSave={() => onSave(value)} />
    </Modal>
  );
}

function PasswordInput({ label, value, onChange }: {
  label: string; value: string; onChange: (v: string) => void;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-medium text-slate-500">{label}</label>
      <div className="relative">
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 pr-10 text-sm"
        />
        <button
          type="button"
          onClick={() => setShow((p) => !p)}
          className="absolute right-3 bottom-2.5 text-slate-400"
        >
          {show ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
    </div>
  );
}

function ChangePasswordPopup({ userId, onClose }: { userId: number; onClose: () => void }) {
  const [oldPassword,     setOldPassword]     = useState("");
  const [newPassword,     setNewPassword]     = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error,           setError]           = useState("");
  const [loading,         setLoading]         = useState(false);

  const handleSubmit = async () => {
    setError("");
    if (newPassword !== confirmPassword) { setError("Passwords do not match"); return; }
    if (newPassword.length < 6)          { setError("Min 6 characters");        return; }
    setLoading(true);
    try {
      await updatePassword(userId, oldPassword, newPassword);
      onClose();
    } catch (e: any) {
      setError(e?.message ?? "Failed to update password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal title="Change Password" onClose={onClose}>
      <div className="p-5 space-y-4">
        <PasswordInput label="Current Password"  value={oldPassword}     onChange={setOldPassword}     />
        <PasswordInput label="New Password"       value={newPassword}     onChange={setNewPassword}     />
        <PasswordInput label="Confirm Password"   value={confirmPassword} onChange={setConfirmPassword} />
        {error && (
          <p className="text-xs text-red-500 flex items-center gap-1">
            <AlertCircle size={12} /> {error}
          </p>
        )}
      </div>
      <ModalActions
        onCancel={onClose}
        onSave={handleSubmit}
        saveLabel={loading ? "Updating…" : "Update Password"}
      />
    </Modal>
  );
}

function ChangeStatusPopup({ accountType, currentStatus, onSave, onClose }: {
  accountType: string; currentStatus: string;
  onSave: (s: string) => void; onClose: () => void;
}) {
  const [selected, setSelected] = useState(currentStatus);
  const options = [
    { value: "active", label: "Active"  },
    { value: "frozen", label: "Frozen"  },
    { value: "closed", label: "Closed"  },
  ];
  return (
    <Modal title={`Change ${accountType} Status`} onClose={onClose}>
      <div className="p-5 space-y-3">
        {options.map((opt) => (
          <label key={opt.value} className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50 transition-colors">
            <input
              type="radio"
              name="status"
              value={opt.value}
              checked={selected === opt.value}
              onChange={() => setSelected(opt.value)}
              className="w-4 h-4"
            />
            <span className="text-sm font-medium text-slate-700">{opt.label}</span>
          </label>
        ))}
      </div>
      <ModalActions onCancel={onClose} onSave={() => onSave(selected)} saveLabel="Save Changes" />
    </Modal>
  );
}

// ─── Main Page ────────────────────────────────────────────────

export default function SettingsPage() {
  const { data: session, status: sessionStatus } = useSession();
  const userId = Number((session?.user as { id?: string })?.id);

  const [userData,        setUserData]        = useState<UserData>({ full_name: "", phone: "", email: "", username: "" });
  const [customerId,      setCustomerId]      = useState<number | null>(null);
  const [wadiahAccount,   setWadiahAccount]   = useState<AccountInfo>({ account_id: "", status: "active" });
  const [hasMudarabah,    setHasMudarabah]    = useState(false);
  const [mudarabahAccount, setMudarabahAccount] = useState<AccountInfo>({ account_id: "", status: "active" });
  const [loading,         setLoading]         = useState(true);
  const [activePopup,     setActivePopup]     = useState<string | null>(null);
  const [popupData,       setPopupData]       = useState<any>({});

  const close = () => setActivePopup(null);

  // ── Load data ────────────────────────────────────────────────

  useEffect(() => {
    if (!userId || isNaN(userId) || userId <= 0) return;

    async function load() {
      setLoading(true);
      try {
        // profile (joins users + customers)
        const profile = await getUserProfile(userId);
        setUserData({
          full_name: profile.full_name,
          phone:     profile.phone,
          email:     profile.email,
          username:  profile.username,
        });

        // customer_id needed for account queries
        const cId = await getCustomerId(userId);
        if (!cId) throw new Error("Customer not found");
        setCustomerId(cId);

        // wadiah account
        const wadiah = await getWadiahAccount(cId);
        setWadiahAccount({ account_id: String(wadiah.account_id), status: wadiah.status });

        // mudarabah
        const hasMud = await hasMudarabahAccount(cId);
        setHasMudarabah(hasMud);
        if (hasMud) {
          const mud = await getMudarabahAccount(cId);
          setMudarabahAccount({ account_id: String(mud.account_id), status: mud.status });
        }
      } catch (e) {
        console.error("Settings load error:", e);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [userId]);

  // ── Handlers ─────────────────────────────────────────────────

  async function handleProfileUpdate(field: string, value: string) {
    try {
      if (field === "full_name") await updateFullName(userId, value);
      if (field === "phone")     await updatePhone(userId, value);
      if (field === "email")     await updateEmail(userId, value);
      if (field === "username")  await updateUsername(userId, value);
      setUserData((prev) => ({ ...prev, [field]: value }));
    } catch (e) {
      console.error(`Update ${field} failed:`, e);
    }
    close();
  }

  async function handleStatusUpdate(accountType: string, newStatus: string) {
    try {
      if (accountType === "wadiah") {
        await updateAccountStatus(wadiahAccount.account_id, newStatus);
        setWadiahAccount((prev) => ({ ...prev, status: newStatus }));
      } else {
        await updateMudarabahStatus(mudarabahAccount.account_id, newStatus);
        setMudarabahAccount((prev) => ({ ...prev, status: newStatus }));
      }
    } catch (e) {
      console.error("Status update failed:", e);
    }
    close();
  }

  // ── Loading / session guard ───────────────────────────────────

  if (sessionStatus === "loading" || loading) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={24} className="animate-spin text-slate-400" />
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            Loading settings…
          </p>
        </div>
      </div>
    );
  }

  // ── Render ───────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-8">

        {/* Header */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
            Personal Banking / Settings
          </p>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight mt-0.5">
            Account Settings
          </h1>
        </div>

        {/* ── Profile & Security ── */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <User size={11} className="text-slate-400" />
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
              Profile & Security
            </p>
          </div>
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm shadow-slate-200/50">
            <SettingRow
              label="Full Name" value={userData.full_name}
              onEdit={() => { setPopupData({ field: "Full Name", key: "full_name", value: userData.full_name }); setActivePopup("edit-field"); }}
            />
            <SettingRow
              label="Phone" value={userData.phone}
              onEdit={() => { setPopupData({ field: "Phone", key: "phone", value: userData.phone }); setActivePopup("edit-field"); }}
            />
            <SettingRow
              label="Email" value={userData.email}
              onEdit={() => { setPopupData({ field: "Email", key: "email", value: userData.email }); setActivePopup("edit-field"); }}
            />
            <SettingRow
              label="Username" value={userData.username} mono
              onEdit={() => { setPopupData({ field: "Username", key: "username", value: userData.username }); setActivePopup("edit-field"); }}
            />
            {/* Password row — manual since value is masked */}
            <div className="flex items-center justify-between p-5 hover:bg-slate-50/50 transition-colors">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Password</p>
                <p className="text-sm font-mono text-slate-400 mt-0.5">••••••••</p>
              </div>
              <button
                onClick={() => setActivePopup("change-password")}
                className="text-xs font-bold text-slate-400 hover:text-slate-900 transition-colors"
              >
                Change
              </button>
            </div>
          </div>
        </section>

        {/* ── Wadiah Account ── */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <ShieldCheck size={11} className="text-slate-400" />
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
              Wadiah Account
            </p>
          </div>
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm shadow-slate-200/50">
            <SettingRow label="Account ID" value={wadiahAccount.account_id} mono />
            <div className="flex items-center justify-between p-5 border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <StatusDot status={wadiahAccount.status} />
                  <p className="text-sm font-semibold text-slate-900 capitalize">{wadiahAccount.status}</p>
                </div>
              </div>
              <button
                onClick={() => { setPopupData({ accountType: "wadiah", currentStatus: wadiahAccount.status }); setActivePopup("change-status"); }}
                className="text-xs font-bold text-slate-400 hover:text-slate-900 transition-colors"
              >
                Change
              </button>
            </div>
            <div className="flex items-center justify-between p-5">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Statement</p>
                <p className="text-xs text-slate-400 mt-0.5">Last 30 days activity</p>
              </div>
              <button className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition-colors">
                <Download size={12} /> Download PDF
              </button>
            </div>
          </div>
        </section>

        {/* ── Mudarabah Account ── */}
        {hasMudarabah && (
          <section>
            <div className="flex items-center gap-2 mb-3">
              <FileText size={11} className="text-slate-400" />
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                Mudarabah Account
              </p>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm shadow-slate-200/50">
              <SettingRow label="Account ID" value={mudarabahAccount.account_id} mono />
              <div className="flex items-center justify-between p-5 border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <StatusDot status={mudarabahAccount.status} />
                    <p className="text-sm font-semibold text-slate-900 capitalize">{mudarabahAccount.status}</p>
                  </div>
                </div>
                <button
                  onClick={() => { setPopupData({ accountType: "mudarabah", currentStatus: mudarabahAccount.status }); setActivePopup("change-status"); }}
                  className="text-xs font-bold text-slate-400 hover:text-slate-900 transition-colors"
                >
                  Change
                </button>
              </div>
              <div className="flex items-center justify-between p-5">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Investment Dashboard</p>
                  <p className="text-xs text-slate-400 mt-0.5">View full Mudarabah details</p>
                </div>
                <a
                  href="/mudarabah"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition-colors"
                >
                  View <ChevronRight size={12} />
                </a>
              </div>
            </div>
          </section>
        )}

      </div>

      {/* ── Popups ── */}
      {activePopup === "edit-field" && (
        <EditFieldPopup
          field={popupData.field}
          currentValue={popupData.value}
          onClose={close}
          onSave={(val) => handleProfileUpdate(popupData.key, val)}
        />
      )}

      {activePopup === "change-password" && (
        <ChangePasswordPopup userId={userId} onClose={close} />
      )}

      {activePopup === "change-status" && (
        <ChangeStatusPopup
          accountType={popupData.accountType}
          currentStatus={popupData.currentStatus}
          onClose={close}
          onSave={(s) => handleStatusUpdate(popupData.accountType, s)}
        />
      )}
    </div>
  );
}