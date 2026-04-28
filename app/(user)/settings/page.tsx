"use client";

import React, { useState, useEffect } from "react";
import {
  User,
  Lock,
  Phone,
  Mail,
  FileText,
  Download,
  ChevronRight,
  ShieldCheck,
  AlertCircle,
  X,
  Eye,
  EyeOff,
} from "lucide-react";
import {
  getUserProfile,
  getCustomerId,
  updateFullName,
  updatePhone,
  updateEmail,
  updateUsername,
  updatePassword,
  getWadiahAccount,
  updateAccountStatus,
  downloadStatement,
  hasMudarabahAccount,
  getMudarabahAccount,
  updateMudarabahStatus,
} from "@/app/(user)/lib/queries";

interface UserData {
  full_name: string;
  phone: string;
  email: string;
  username: string;
}

interface WadiahAccount {
  account_id: string;
  status: "active" | "suspended" | "closed";
}

interface MudarabahAccount {
  account_id: string;
  status: "active" | "suspended" | "closed";
}

export default function SettingsPage() {
  const userId = 6;
  const [userData, setUserData] = useState<UserData>({
    full_name: "",
    phone: "",
    email: "",
    username: "",
  });

  const [wadiahAccount, setWadiahAccount] = useState<WadiahAccount>({
    account_id: "",
    status: "active",
  });

  const [hasMudarabah, setHasMudarabah] = useState(false);
  const [mudarabahAccount, setMudarabahAccount] = useState<MudarabahAccount>({
    account_id: "",
    status: "active",
  });

  const [activePopup, setActivePopup] = useState<string | null>(null);
  const [popupData, setPopupData] = useState<any>({});
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(true);

  const statusOptions = [
    { value: "active", label: "Active" },
    { value: "suspended", label: "Suspended" },
    { value: "closed", label: "Closed" },
  ];

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const customerId = await getCustomerId(userId);
      if (!customerId) {
        throw new Error("Customer not found for current user");
      }

      const profile = await getUserProfile(userId);
      setUserData({
        full_name: profile.full_name,
        phone: profile.phone,
        email: profile.email,
        username: profile.username,
      });

      const wadiah = await getWadiahAccount(customerId);
      setWadiahAccount({
        account_id: wadiah.account_id,
        status: wadiah.status,
      });

      const hasMudarabahAccountFlag = await hasMudarabahAccount(customerId);
      setHasMudarabah(hasMudarabahAccountFlag);

      if (hasMudarabahAccountFlag) {
        const mudarabah = await getMudarabahAccount(customerId);
        setMudarabahAccount({
          account_id: mudarabah.account_id,
          status: mudarabah.status,
        });
      }
    } catch (error) {
      console.error("Failed to load settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleProfileUpdate = async (field: string, value: string) => {
    try {
      switch (field) {
        case "full_name":
          await updateFullName(userId, value);
          break;
        case "phone":
          await updatePhone(userId, value);
          break;
        case "email":
          await updateEmail(userId, value);
          break;
        case "username":
          await updateUsername(userId, value);
          break;
      }
      setUserData((prev) => ({ ...prev, [field]: value }));
    } catch (error) {
      console.error(`Failed to update ${field}:`, error);
    }
    setActivePopup(null);
  };

  const handlePasswordUpdate = async (oldPassword: string, newPassword: string) => {
    try {
      await updatePassword(userId, oldPassword, newPassword);
      console.log("Password updated successfully");
    } catch (error) {
      console.error("Failed to update password:", error);
    }
    setActivePopup(null);
  };

  const handleStatusUpdate = async (accountType: string, newStatus: string) => {
    try {
      if (accountType === "wadiah") {
        await updateAccountStatus(wadiahAccount.account_id, newStatus);
        setWadiahAccount((prev) => ({ ...prev, status: newStatus as any }));
      } else if (accountType === "mudarabah") {
        await updateMudarabahStatus(mudarabahAccount.account_id, newStatus);
        setMudarabahAccount((prev) => ({ ...prev, status: newStatus as any }));
      }
    } catch (error) {
      console.error("Failed to update status:", error);
    }
    setActivePopup(null);
  };

  // const handleDownloadStatement = async (accountId: string) => {
  //   try {
  //     const pdfData = await downloadStatement(accountId, 30);
  //     // Handle PDF download (e.g., create blob link)
  //     const blob = new Blob([pdfData], { type: "application/pdf" });
  //     const url = URL.createObjectURL(blob);
  //     const a = document.createElement("a");
  //     a.href = url;
  //     a.download = `statement_${accountId}_${new Date().toISOString().split("T")[0]}.pdf`;
  //     a.click();
  //     URL.revokeObjectURL(url);
  //   } catch (error) {
  //     console.error("Failed to download statement:", error);
  //   }
  //   setActivePopup(null);
  // };

  const EditFieldPopup = ({ field, currentValue, onSave }: any) => {
    const [value, setValue] = useState(currentValue);

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <div className="bg-white rounded-2xl w-full max-w-md mx-4 shadow-2xl">
          <div className="flex items-center justify-between p-5 border-b border-slate-100">
            <h3 className="text-base font-bold text-slate-900">Edit {field}</h3>
            <button
              onClick={() => setActivePopup(null)}
              className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100"
            >
              <X size={18} />
            </button>
          </div>
          <div className="p-5">
            <input
              type="text"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
              placeholder={`Enter ${field.toLowerCase()}`}
            />
          </div>
          <div className="flex gap-3 p-5 pt-0">
            <button
              onClick={() => setActivePopup(null)}
              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-medium hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => onSave(value)}
              className="flex-1 px-4 py-2.5 rounded-xl bg-slate-900 text-white font-medium hover:bg-slate-800 transition-colors"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    );
  };

  const ChangePasswordPopup = () => {
    const [oldPassword, setOldPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");
    const [showOldPassword, setShowOldPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const handleSubmit = () => {
      if (newPassword !== confirmPassword) {
        setError("New passwords do not match");
        return;
      }
      if (newPassword.length < 6) {
        setError("Password must be at least 6 characters");
        return;
      }
      handlePasswordUpdate(oldPassword, newPassword);
    };

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <div className="bg-white rounded-2xl w-full max-w-md mx-4 shadow-2xl">
          <div className="flex items-center justify-between p-5 border-b border-slate-100">
            <h3 className="text-base font-bold text-slate-900">Change Password</h3>
            <button
              onClick={() => setActivePopup(null)}
              className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100"
            >
              <X size={18} />
            </button>
          </div>
          <div className="p-5 space-y-4">
            <div className="relative">
              <label className="block text-xs font-medium text-slate-500 mb-1.5">Old Password</label>
              <input
                type={showOldPassword ? "text" : "password"}
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 pr-10"
                placeholder="Enter old password"
              />
              <button
                onClick={() => setShowOldPassword(!showOldPassword)}
                className="absolute right-3 bottom-2.5 text-slate-400"
              >
                {showOldPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <div className="relative">
              <label className="block text-xs font-medium text-slate-500 mb-1.5">New Password</label>
              <input
                type={showNewPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 pr-10"
                placeholder="Enter new password"
              />
              <button
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 bottom-2.5 text-slate-400"
              >
                {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <div className="relative">
              <label className="block text-xs font-medium text-slate-500 mb-1.5">Confirm New Password</label>
              <input
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 pr-10"
                placeholder="Confirm new password"
              />
              <button
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 bottom-2.5 text-slate-400"
              >
                {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {error && (
              <p className="text-xs text-red-500 flex items-center gap-1">
                <AlertCircle size={12} /> {error}
              </p>
            )}
          </div>
          <div className="flex gap-3 p-5 pt-0">
            <button
              onClick={() => setActivePopup(null)}
              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-medium hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="flex-1 px-4 py-2.5 rounded-xl bg-slate-900 text-white font-medium hover:bg-slate-800"
            >
              Update Password
            </button>
          </div>
        </div>
      </div>
    );
  };

  const ChangeStatusPopup = ({ accountType, currentStatus, onSave }: any) => {
    const [selectedStatus, setSelectedStatus] = useState(currentStatus);

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <div className="bg-white rounded-2xl w-full max-w-md mx-4 shadow-2xl">
          <div className="flex items-center justify-between p-5 border-b border-slate-100">
            <h3 className="text-base font-bold text-slate-900">Change {accountType} Account Status</h3>
            <button
              onClick={() => setActivePopup(null)}
              className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100"
            >
              <X size={18} />
            </button>
          </div>
          <div className="p-5 space-y-3">
            {statusOptions.map((option) => (
              <label
                key={option.value}
                className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50 transition-colors"
              >
                <input
                  type="radio"
                  name="status"
                  value={option.value}
                  checked={selectedStatus === option.value}
                  onChange={() => setSelectedStatus(option.value)}
                  className="w-4 h-4 text-slate-900"
                />
                <span className="text-sm font-medium text-slate-700">{option.label}</span>
              </label>
            ))}
          </div>
          <div className="flex gap-3 p-5 pt-0">
            <button
              onClick={() => setActivePopup(null)}
              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-medium hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              onClick={() => onSave(selectedStatus)}
              className="flex-1 px-4 py-2.5 rounded-xl bg-slate-900 text-white font-medium hover:bg-slate-800"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    );
  };

  const DownloadConfirmationPopup = ({ accountId, onConfirm }: any) => {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <div className="bg-white rounded-2xl w-full max-w-sm mx-4 shadow-2xl">
          <div className="p-5 text-center">
            <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
              <Download size={24} className="text-slate-600" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Download Statement?</h3>
            <p className="text-sm text-slate-500">Your account statement will be downloaded as a PDF file for the last 30 days.</p>
          </div>
          <div className="flex gap-3 p-5 pt-0">
            <button
              onClick={() => setActivePopup(null)}
              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-medium hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                onConfirm();
                setActivePopup(null);
              }}
              className="flex-1 px-4 py-2.5 rounded-xl bg-slate-900 text-white font-medium hover:bg-slate-800"
            >
              Download
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-slate-200 border-t-slate-900 rounded-full animate-spin mx-auto"></div>
          <p className="text-xs text-slate-400 mt-3">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Settings</h1>
          <p className="text-sm text-slate-500 mt-1">Manage your profile and account preferences</p>
        </div>

        <div className="space-y-3 mb-8">
          <div className="flex items-center gap-2 px-1">
            <User size={11} className="text-slate-400" />
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em]">Profile & Security</h3>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
              <div>
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">Full Name</p>
                <p className="text-sm font-semibold text-slate-900 mt-0.5">{userData.full_name}</p>
              </div>
              <button
                onClick={() => {
                  setPopupData({ field: "Full Name", value: userData.full_name });
                  setActivePopup("edit-field");
                }}
                className="text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors"
              >
                Edit
              </button>
            </div>

            <div className="flex items-center justify-between p-5 border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
              <div>
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wide flex items-center gap-1.5">
                  <Phone size={11} /> Phone
                </p>
                <p className="text-sm font-semibold text-slate-900 mt-0.5">{userData.phone}</p>
              </div>
              <button
                onClick={() => {
                  setPopupData({ field: "Phone", value: userData.phone });
                  setActivePopup("edit-field");
                }}
                className="text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors"
              >
                Edit
              </button>
            </div>

            <div className="flex items-center justify-between p-5 border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
              <div>
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wide flex items-center gap-1.5">
                  <Mail size={11} /> Email
                </p>
                <p className="text-sm font-semibold text-slate-900 mt-0.5">{userData.email}</p>
              </div>
              <button
                onClick={() => {
                  setPopupData({ field: "Email", value: userData.email });
                  setActivePopup("edit-field");
                }}
                className="text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors"
              >
                Edit
              </button>
            </div>

            <div className="flex items-center justify-between p-5 border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
              <div>
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">Username</p>
                <p className="text-sm font-semibold text-slate-900 mt-0.5">{userData.username}</p>
              </div>
              <button
                onClick={() => {
                  setPopupData({ field: "Username", value: userData.username });
                  setActivePopup("edit-field");
                }}
                className="text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors"
              >
                Edit
              </button>
            </div>

            <div className="flex items-center justify-between p-5 hover:bg-slate-50/50 transition-colors">
              <div>
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wide flex items-center gap-1.5">
                  <Lock size={11} /> Password
                </p>
                <p className="text-sm font-mono text-slate-400 mt-0.5">••••••••</p>
              </div>
              <button
                onClick={() => setActivePopup("change-password")}
                className="text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors"
              >
                Change
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-3 mb-8">
          <div className="flex items-center gap-2 px-1">
            <ShieldCheck size={11} className="text-slate-400" />
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em]">Wadiah Account Settings</h3>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <div>
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">Account ID</p>
                <p className="text-sm font-mono font-semibold text-slate-900 mt-0.5">{wadiahAccount.account_id}</p>
              </div>
            </div>

            <div className="flex items-center justify-between p-5 border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
              <div>
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">Status</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className={`inline-flex h-1.5 w-1.5 rounded-full ${
                    wadiahAccount.status === "active" ? "bg-green-500" :
                    wadiahAccount.status === "suspended" ? "bg-yellow-500" : "bg-red-500"
                  }`} />
                  <p className="text-sm font-semibold text-slate-900 capitalize">{wadiahAccount.status}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setPopupData({ accountType: "wadiah", currentStatus: wadiahAccount.status });
                  setActivePopup("change-status");
                }}
                className="text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors"
              >
                Change
              </button>
            </div>

            <div className="flex items-center justify-between p-5 hover:bg-slate-50/50 transition-colors">
              <div>
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wide flex items-center gap-1.5">
                  <Download size={11} /> Statement
                </p>
                <p className="text-xs text-slate-400 mt-0.5">Download account statement for last 30 days</p>
              </div>
              <button
                onClick={() => {
                  setPopupData({ accountId: wadiahAccount.account_id });
                  setActivePopup("download-statement");
                }}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition-colors"
              >
                <Download size={12} />
                Download PDF
              </button>
            </div>
          </div>
        </div>

        {hasMudarabah && (
          <div className="space-y-3 mb-8">
            <div className="flex items-center gap-2 px-1">
              <FileText size={11} className="text-slate-400" />
              <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em]">Mudarabah Account Settings</h3>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
              <div className="flex items-center justify-between p-5 border-b border-slate-100">
                <div>
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">Account ID</p>
                  <p className="text-sm font-mono font-semibold text-slate-900 mt-0.5">{mudarabahAccount.account_id}</p>
                </div>
              </div>

              <div className="flex items-center justify-between p-5 border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                <div>
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">Status</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={`inline-flex h-1.5 w-1.5 rounded-full ${
                      mudarabahAccount.status === "active" ? "bg-green-500" :
                      mudarabahAccount.status === "suspended" ? "bg-yellow-500" : "bg-red-500"
                    }`} />
                    <p className="text-sm font-semibold text-slate-900 capitalize">{mudarabahAccount.status}</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setPopupData({ accountType: "mudarabah", currentStatus: mudarabahAccount.status });
                    setActivePopup("change-status");
                  }}
                  className="text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors"
                >
                  Change
                </button>
              </div>

              <div className="flex items-center justify-between p-5 hover:bg-slate-50/50 transition-colors">
                <div>
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">Account Details</p>
                  <p className="text-xs text-slate-400 mt-0.5">View complete Mudarabah account information</p>
                </div>
                <button
                  onClick={() => {
                    console.log("Navigate to Mudarabah details page");
                  }}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition-colors"
                >
                  View Details
                  <ChevronRight size={12} />
                </button>
              </div>
            </div>
          </div>
        )}

        {activePopup === "edit-field" && (
          <EditFieldPopup
            field={popupData.field}
            currentValue={popupData.value}
            onSave={(newValue: string) => {
              const fieldKey = popupData.field.toLowerCase().replace(" ", "_");
              handleProfileUpdate(fieldKey, newValue);
            }}
          />
        )}

        {activePopup === "change-password" && <ChangePasswordPopup />}

        {activePopup === "change-status" && (
          <ChangeStatusPopup
            accountType={popupData.accountType}
            currentStatus={popupData.currentStatus}
            onSave={(newStatus: string) => handleStatusUpdate(popupData.accountType, newStatus)}
          />
        )}

        {activePopup === "download-statement" && (
          <DownloadConfirmationPopup
            accountId={popupData.accountId}
            // onConfirm={() => handleDownloadStatement(popupData.accountId)}
          />
        )}
      </div>
    </div>
  );
}