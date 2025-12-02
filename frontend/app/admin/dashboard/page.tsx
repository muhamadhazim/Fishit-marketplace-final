"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { formatDate } from "@/lib/date";
import { useAuth, type AuthState } from "@/store/auth";
import { CheckCircle, X } from "lucide-react";
import Link from "next/link";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AnalyticsCharts from "@/components/admin/AnalyticsCharts";

type Tx = {
  id: string;
  invoice_number: string;
  user_roblox_username: string;
  email: string;
  items: { name: string; quantity: number }[];
  total_transfer: number;
  payment_deadline?: string;
  status: "Pending" | "Processing" | "Success" | "Failed" | "Cancelled";
};

function formatIDR(n: number) {
  return "Rp " + new Intl.NumberFormat("id-ID").format(n);
}

export default function DashboardPage() {
  const router = useRouter();
  const token = useAuth((s: AuthState) => s.token);
  const [txs, setTxs] = useState<Tx[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalAction, setModalAction] = useState<"approve" | "verify" | "cancel" | null>(null);
  const [targetTxId, setTargetTxId] = useState<string | null>(null);

  useEffect(() => {
    const localToken =
      typeof window !== "undefined" ? localStorage.getItem("jwt") : null;
    if (!token && !localToken) {
      router.replace("/admin/login");
      return;
    }
    async function load() {
      try {
        const res = await api.get("/api/admin/transactions");
        setTxs(res.data.transactions as Tx[]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [router, token]);

  function openModal(action: "approve" | "verify" | "cancel", id: string) {
    setModalAction(action);
    setTargetTxId(id);
    setIsModalOpen(true);
  }

  function closeModal() {
    setIsModalOpen(false);
    setModalAction(null);
    setTargetTxId(null);
  }

  async function confirmAction() {
    if (!targetTxId || !modalAction) return;

    const newStatus = modalAction === "approve" ? "Processing" : modalAction === "verify" ? "Success" : "Cancelled";

    try {
      await api.patch(`/api/admin/transactions/${targetTxId}`, { status: newStatus });
      setTxs((prev) =>
        prev.map((t) => (t.id === targetTxId ? { ...t, status: newStatus } : t))
      );
      closeModal();
    } catch (err) {
      alert("Failed to update status");
      console.error(err);
    }
  }



  return (
    <div className="mx-auto max-w-6xl p-6">
      <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-6">
        <AdminSidebar />

        <main>
          <h1 className="text-3xl font-bold mb-2">
            <span className="gradient-text">Transaction Manager</span>
          </h1>
          <p className="text-web3-text-secondary mb-6">Monitor and manage all transactions</p>
          
          <AnalyticsCharts />
          {loading ? (
            <div className="mt-6">Loading...</div>
          ) : (
            <div className="mt-6 overflow-x-auto glass-card rounded-2xl border border-white/10">
              <table className="min-w-full text-sm">
                <thead className="bg-gradient-to-r from-web3-accent-cyan/10 to-web3-accent-purple/10 border-b border-white/10">
                  <tr>
                    <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wide text-web3-accent-cyan">Invoice</th>
                    <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wide text-web3-accent-cyan">User Info</th>
                    <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wide text-web3-accent-cyan">Items</th>
                    <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wide text-web3-accent-cyan">Total Transfer</th>
                    <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wide text-web3-accent-cyan">Deadline</th>
                    <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wide text-web3-accent-cyan">Status</th>
                    <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wide text-web3-accent-cyan">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {txs.map((t) => (
                    <tr key={t.id} className="border-t border-white/5 hover:bg-white/5 transition-colors">
                      <td className="px-4 py-4 font-mono text-xs text-web3-accent-cyan">{t.invoice_number}</td>
                      <td className="px-4 py-4">
                        <div className="text-xs text-web3-text-muted">{t.email || "-"}</div>
                        <div className="font-bold gradient-text">{t.user_roblox_username || "-"}</div>
                      </td>
                      <td className="px-4 py-4">
                        <ul className="list-disc pl-4 text-xs text-web3-text-secondary">
                          {(t.items || []).map((item, i) => (
                            <li key={i}>
                              <span className="text-web3-accent-cyan font-semibold">{item.quantity}x</span> {item.name}
                            </li>
                          ))}
                        </ul>
                      </td>
                      <td className="px-4 py-4 font-bold gradient-text">
                        {formatIDR(t.total_transfer)}
                      </td>
                      <td className="px-4 py-4 text-xs text-web3-text-muted">
                        {t.payment_deadline ? formatDate(t.payment_deadline) : "-"}
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={`rounded-xl px-3 py-1.5 text-xs font-bold border-2 ${
                            t.status === "Success"
                              ? "bg-emerald-500/30 text-emerald-300 border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.4)]"
                              : t.status === "Processing"
                              ? "bg-blue-500/30 text-blue-300 border-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.4)]"
                              : t.status === "Failed"
                              ? "bg-red-500/30 text-red-300 border-red-400 shadow-[0_0_15px_rgba(239,68,68,0.4)]"
                              : t.status === "Cancelled"
                              ? "bg-gray-500/30 text-gray-300 border-gray-400 shadow-[0_0_15px_rgba(107,114,128,0.4)]"
                              : "bg-amber-500/30 text-amber-300 border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.4)]"
                          }`}
                        >
                          {t.status}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        {t.status === "Pending" && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => openModal("approve", t.id)}
                              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-web3-accent-cyan to-web3-accent-purple px-4 py-2 text-xs font-bold text-white hover:scale-105 transition-all border border-web3-accent-cyan/50"
                            >
                              <CheckCircle className="h-4 w-4" /> Approve
                            </button>
                            <button
                              onClick={() => openModal("cancel", t.id)}
                              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-gray-600 to-gray-700 px-4 py-2 text-xs font-bold text-white hover:scale-105 transition-all border border-gray-500/50"
                            >
                              <X className="h-4 w-4" /> Cancel
                            </button>
                          </div>
                        )}
                        {t.status === "Processing" && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => openModal("verify", t.id)}
                              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-web3-accent-green to-web3-accent-cyan px-4 py-2 text-xs font-bold text-white hover:scale-105 transition-all border border-web3-accent-green/50"
                            >
                              <CheckCircle className="h-4 w-4" /> Verify
                            </button>
                            <button
                              onClick={() => openModal("cancel", t.id)}
                              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-gray-600 to-gray-700 px-4 py-2 text-xs font-bold text-white hover:scale-105 transition-all border border-gray-500/50"
                            >
                              <X className="h-4 w-4" /> Cancel
                            </button>
                          </div>
                        )}
                        {t.status === "Success" && <span className="text-web3-text-muted">—</span>}
                        {t.status === "Failed" && <span className="text-web3-text-muted">—</span>}
                        {t.status === "Cancelled" && <span className="text-web3-text-muted">—</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </main>
      </div>

      {/* Confirmation Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md glass-card rounded-2xl p-8 shadow-2xl border-2 border-white/10">
            <h2 className="mb-4 text-2xl font-bold gradient-text">Confirm Action</h2>
            <p className="mb-8 text-web3-text-secondary">
              Are you sure you want to <strong className="text-white">{modalAction}</strong> this transaction?
              <br />
              {modalAction === "cancel" ? (
                <span className="text-red-400 font-semibold">
                  This will cancel the order and restore product stock.
                </span>
              ) : (
                <>
                  This will change the status to{" "}
                  <span className="gradient-text font-bold">
                    {modalAction === "approve" ? "Processing" : "Success"}
                  </span>
                  .
                </>
              )}
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={closeModal}
                className="rounded-xl px-6 py-3 text-web3-text-secondary hover:bg-white/5 hover:text-white transition-all border border-white/10 font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={confirmAction}
                className={`rounded-xl px-6 py-3 font-bold text-white transition-all hover:scale-105 border-2 ${
                  modalAction === "approve"
                    ? "bg-gradient-to-r from-web3-accent-cyan to-web3-accent-purple border-web3-accent-cyan/50 hover:shadow-glow-cyan"
                    : modalAction === "verify"
                    ? "bg-gradient-to-r from-web3-accent-green to-web3-accent-cyan border-web3-accent-green/50 hover:shadow-glow-green"
                    : "bg-gradient-to-r from-gray-600 to-gray-700 border-gray-500/50 hover:shadow-[0_0_15px_rgba(107,114,128,0.4)]"
                }`}
              >
                Confirm {modalAction === "approve" ? "Approve" : modalAction === "verify" ? "Verify" : "Cancel"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
