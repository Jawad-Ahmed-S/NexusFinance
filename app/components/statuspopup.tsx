"use client";

import { useEffect, useState } from "react";
import { CheckCircle, XCircle, X } from "lucide-react";

type PopupStatus = "success" | "error" | null;

interface StatusPopupProps {
  status: PopupStatus;
  message: string;
  onClose: () => void;
  autoDismiss?: number; // ms, default 4000
}

export default function StatusPopup({
  status,
  message,
  onClose,
  autoDismiss = 4000,
}: StatusPopupProps) {
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (!status) return;

    setVisible(true);
    setProgress(100);

    // progress bar countdown
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev <= 0) {
          clearInterval(interval);
          return 0;
        }
        return prev - (100 / (autoDismiss / 100));
      });
    }, 100);

    // auto close
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onClose, 300); // wait for fade out
    }, autoDismiss);

    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [status, message]);

  if (!status) return null;

  const isSuccess = status === "success";

  return (
    <div
      className={`fixed bottom-6 right-6 z-50 transition-all duration-300 ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
      }`}
    >
      <div
        className={`relative w-80 rounded-2xl border shadow-lg overflow-hidden bg-white ${
          isSuccess ? "border-emerald-200" : "border-rose-200"
        }`}
      >
        {/* progress bar */}
        <div
          className={`absolute top-0 left-0 h-0.5 transition-all duration-100 ${
            isSuccess ? "bg-emerald-400" : "bg-rose-400"
          }`}
          style={{ width: `${progress}%` }}
        />

        <div className="p-4 flex items-start gap-3">
          {/* icon */}
          <div className={`mt-0.5 shrink-0 ${isSuccess ? "text-emerald-500" : "text-rose-500"}`}>
            {isSuccess
              ? <CheckCircle className="w-4 h-4" />
              : <XCircle className="w-4 h-4" />
            }
          </div>

          {/* content */}
          <div className="flex-1 min-w-0">
            <p className={`text-xs font-bold tracking-widest uppercase ${
              isSuccess ? "text-emerald-600" : "text-rose-600"
            }`}>
              {isSuccess ? "Success" : "Error"}
            </p>
            <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{message}</p>
          </div>

          {/* close button */}
          <button
            onClick={() => { setVisible(false); setTimeout(onClose, 300); }}
            className="shrink-0 text-slate-300 hover:text-slate-500 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}