"use client";

import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, CheckCircle, XCircle, Info, X } from "lucide-react";
import { ReactNode } from "react";

export type DialogVariant = "confirm" | "warning" | "danger" | "info";

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message?: string;
  children?: ReactNode;
  confirmText?: string;
  cancelText?: string;
  variant?: DialogVariant;
  loading?: boolean;
  disabled?: boolean;
}

const variantConfig = {
  confirm: {
    icon: CheckCircle,
    iconColor: "text-web3-accent-green",
    iconBg: "from-web3-accent-green/20 to-web3-accent-cyan/20",
    iconBorder: "border-web3-accent-green/30",
    buttonBg: "from-web3-accent-green to-web3-accent-cyan",
    buttonBorder: "border-web3-accent-green/50 hover:border-web3-accent-green",
  },
  warning: {
    icon: AlertTriangle,
    iconColor: "text-yellow-400",
    iconBg: "from-yellow-500/20 to-orange-500/20",
    iconBorder: "border-yellow-500/30",
    buttonBg: "from-yellow-500 to-orange-500",
    buttonBorder: "border-yellow-500/50 hover:border-yellow-500",
  },
  danger: {
    icon: XCircle,
    iconColor: "text-red-400",
    iconBg: "from-red-500/20 to-pink-500/20",
    iconBorder: "border-red-500/30",
    buttonBg: "from-red-500 to-pink-500",
    buttonBorder: "border-red-500/50 hover:border-red-500",
  },
  info: {
    icon: Info,
    iconColor: "text-web3-accent-cyan",
    iconBg: "from-web3-accent-cyan/20 to-web3-accent-purple/20",
    iconBorder: "border-web3-accent-cyan/30",
    buttonBg: "from-web3-accent-cyan to-web3-accent-purple",
    buttonBorder: "border-web3-accent-cyan/50 hover:border-web3-accent-cyan",
  },
};

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  children,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "confirm",
  loading = false,
  disabled = false,
}: ConfirmDialogProps) {
  const config = variantConfig[variant];
  const Icon = config.icon;

  const handleConfirm = () => {
    if (!loading && !disabled) {
      onConfirm();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm"
          />

          {/* Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed left-1/2 top-1/2 z-[101] w-full max-w-md -translate-x-1/2 -translate-y-1/2 p-4"
          >
            <div className="glass-card rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between p-6 pb-0">
                <div className="flex items-center gap-4">
                  <div className={`rounded-xl bg-gradient-to-br ${config.iconBg} p-3 border ${config.iconBorder}`}>
                    <Icon className={`h-6 w-6 ${config.iconColor}`} />
                  </div>
                  <h3 className="text-xl font-bold text-web3-text-primary">{title}</h3>
                </div>
                <button
                  onClick={onClose}
                  className="rounded-xl p-2 text-web3-text-secondary hover:bg-white/5 hover:text-web3-text-primary transition-all"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6">
                {message && <p className="text-web3-text-secondary leading-relaxed mb-4">{message}</p>}
                {children}
              </div>

              {/* Actions */}
              <div className="flex gap-3 p-6 pt-0">
                <button
                  onClick={onClose}
                  disabled={loading}
                  className="flex-1 rounded-xl border border-white/10 bg-white/5 py-3 font-semibold text-web3-text-primary transition-all hover:bg-white/10 hover:border-white/20 disabled:opacity-50"
                >
                  {cancelText}
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={loading || disabled}
                  className={`relative flex-1 rounded-xl bg-gradient-to-r ${config.buttonBg} py-3 font-bold text-white transition-all hover:scale-105 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed border-2 ${config.buttonBorder} overflow-hidden group`}
                >
                  <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></span>
                  <span className="relative">{loading ? "Processing..." : confirmText}</span>
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
