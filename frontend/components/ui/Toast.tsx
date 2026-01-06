"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, XCircle, AlertTriangle, Info, X } from "lucide-react";

export type ToastType = "success" | "error" | "warning" | "info";

interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
}

interface ToastContextType {
  showToast: (type: ToastType, title: string, message?: string) => void;
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  warning: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

const toastConfig = {
  success: {
    icon: CheckCircle,
    iconColor: "text-web3-accent-green",
    bgColor: "from-web3-accent-green/10 to-web3-accent-cyan/10",
    borderColor: "border-web3-accent-green/30",
    progressColor: "bg-web3-accent-green",
  },
  error: {
    icon: XCircle,
    iconColor: "text-red-400",
    bgColor: "from-red-500/10 to-pink-500/10",
    borderColor: "border-red-500/30",
    progressColor: "bg-red-500",
  },
  warning: {
    icon: AlertTriangle,
    iconColor: "text-yellow-400",
    bgColor: "from-yellow-500/10 to-orange-500/10",
    borderColor: "border-yellow-500/30",
    progressColor: "bg-yellow-500",
  },
  info: {
    icon: Info,
    iconColor: "text-web3-accent-cyan",
    bgColor: "from-web3-accent-cyan/10 to-web3-accent-purple/10",
    borderColor: "border-web3-accent-cyan/30",
    progressColor: "bg-web3-accent-cyan",
  },
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((type: ToastType, title: string, message?: string) => {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    const newToast: Toast = { id, type, title, message };

    setToasts((prev) => [...prev, newToast]);

    // Auto remove after 4 seconds
    setTimeout(() => {
      removeToast(id);
    }, 4000);
  }, [removeToast]);

  const success = useCallback((title: string, message?: string) => {
    showToast("success", title, message);
  }, [showToast]);

  const error = useCallback((title: string, message?: string) => {
    showToast("error", title, message);
  }, [showToast]);

  const warning = useCallback((title: string, message?: string) => {
    showToast("warning", title, message);
  }, [showToast]);

  const info = useCallback((title: string, message?: string) => {
    showToast("info", title, message);
  }, [showToast]);

  return (
    <ToastContext.Provider value={{ showToast, success, error, warning, info }}>
      {children}

      {/* Toast Container */}
      <div className="fixed top-4 right-4 z-[200] flex flex-col gap-3 pointer-events-none">
        <AnimatePresence mode="popLayout">
          {toasts.map((toast) => {
            const config = toastConfig[toast.type];
            const Icon = config.icon;

            return (
              <motion.div
                key={toast.id}
                initial={{ opacity: 0, x: 100, scale: 0.9 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 100, scale: 0.9 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className={`pointer-events-auto min-w-[320px] max-w-md glass-card rounded-xl border ${config.borderColor} bg-gradient-to-r ${config.bgColor} shadow-2xl overflow-hidden`}
              >
                <div className="flex items-start gap-3 p-4">
                  <div className={`flex-shrink-0 ${config.iconColor}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-web3-text-primary text-sm">{toast.title}</p>
                    {toast.message && (
                      <p className="text-web3-text-secondary text-sm mt-0.5">{toast.message}</p>
                    )}
                  </div>
                  <button
                    onClick={() => removeToast(toast.id)}
                    className="flex-shrink-0 text-web3-text-secondary hover:text-web3-text-primary transition-colors p-1 rounded-lg hover:bg-white/5"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* Progress bar */}
                <motion.div
                  initial={{ width: "100%" }}
                  animate={{ width: "0%" }}
                  transition={{ duration: 4, ease: "linear" }}
                  className={`h-0.5 ${config.progressColor}`}
                />
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
