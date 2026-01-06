"use client";
import { useState, useEffect } from "react";
import api from "@/lib/api";
import { formatDate } from "@/lib/date";
import { CheckCircle, X, CreditCard, ChevronRight, Users, Building2, AlertCircle } from "lucide-react";
import SellerDashboard from "./SellerDashboard";
import SellerSelector from "./SellerSelector";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/Toast";

interface Seller {
  id: string;
  username: string;
  email: string;
  bank_details?: {
    bank_name?: string;
    account_number?: string;
    account_holder?: string;
  } | null;
  created_at?: string;
  unpaid_balance?: number;
  unpaid_count?: number;
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<"sellers" | "payouts">("sellers");
  const [payoutHistory, setPayoutHistory] = useState<any[]>([]);
  const [loadingPayouts, setLoadingPayouts] = useState(false);
  const [selectedSellerId, setSelectedSellerId] = useState<string | null>(null);

  // Seller list state
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [loadingSellers, setLoadingSellers] = useState(false);

  // Dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    sellerId: string;
    sellerName: string;
  }>({ isOpen: false, sellerId: "", sellerName: "" });
  const [markingPaid, setMarkingPaid] = useState(false);
  const toast = useToast();

  // Load Payouts when tab changes to payouts
  useEffect(() => {
    if (activeTab === "payouts") {
      setLoadingPayouts(true);
      api.get("/api/payouts/history")
        .then((res) => setPayoutHistory(res.data.history))
        .catch((err) => console.error(err))
        .finally(() => setLoadingPayouts(false));
    }
  }, [activeTab]);

  // Load sellers list when tab is sellers and no seller is selected
  useEffect(() => {
    if (activeTab === "sellers" && !selectedSellerId) {
      setLoadingSellers(true);
      api.get("/api/admin/users?role=seller")
        .then((res) => setSellers(res.data.users))
        .catch((err) => console.error("Failed to load sellers", err))
        .finally(() => setLoadingSellers(false));
    }
  }, [activeTab, selectedSellerId]);

  const openConfirmDialog = (sellerId: string, sellerName: string) => {
    setConfirmDialog({ isOpen: true, sellerId, sellerName });
  };

  const handleMarkPaid = async () => {
    setMarkingPaid(true);
    try {
      await api.post("/api/payouts/mark-paid", { sellerId: confirmDialog.sellerId });
      // Refresh payouts if on payouts tab
      if (activeTab === "payouts") {
        const res = await api.get("/api/payouts/summary");
        setPayoutHistory(res.data.payoutList);
      }
      // Refresh sellers list if on sellers tab
      if (activeTab === "sellers") {
        const res = await api.get("/api/admin/users?role=seller");
        setSellers(res.data.users);
      }
      toast.success("Pembayaran Ditandai", `Berhasil menandai pembayaran untuk ${confirmDialog.sellerName} sebagai lunas.`);
    } catch (err) {
      toast.error("Gagal", "Gagal menandai pembayaran. Silakan coba lagi.");
    } finally {
      setMarkingPaid(false);
      setConfirmDialog({ isOpen: false, sellerId: "", sellerName: "" });
    }
  };

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-4 border-b border-white/10 pb-4 overflow-x-auto">
        <button
          onClick={() => setActiveTab("sellers")}
          className={`px-4 py-2 font-bold rounded-xl transition-all ${
            activeTab === "sellers"
              ? "bg-web3-accent-cyan/20 text-web3-accent-cyan border border-web3-accent-cyan/50"
              : "text-web3-text-secondary hover:text-white"
          }`}
        >
          Sellers View
        </button>
        <button
          onClick={() => setActiveTab("payouts")}
          className={`px-4 py-2 font-bold rounded-xl transition-all ${
            activeTab === "payouts"
              ? "bg-web3-accent-cyan/20 text-web3-accent-cyan border border-web3-accent-cyan/50"
              : "text-web3-text-secondary hover:text-white"
          }`}
        >
          Payout History
        </button>
      </div>

      {activeTab === "sellers" && (
          <div className="animate-fade-in space-y-6">
              <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold gradient-text">Seller Inspector</h2>
                  <SellerSelector selectedSellerId={selectedSellerId} onSelect={setSelectedSellerId} />
              </div>

              {selectedSellerId ? (
                  <>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSelectedSellerId(null)}
                        className="text-sm text-web3-accent-cyan hover:underline"
                      >
                        ← Back to All Sellers
                      </button>
                    </div>
                    <SellerDashboard sellerId={selectedSellerId} viewOnly={true} />
                  </>
              ) : (
                  <div className="space-y-4">
                    {loadingSellers ? (
                      <div className="text-center py-10 animate-pulse text-web3-text-secondary">Loading sellers...</div>
                    ) : sellers.length === 0 ? (
                      <div className="p-12 text-center glass-card rounded-2xl border border-white/10 border-dashed">
                        <Users className="w-12 h-12 text-web3-text-muted mx-auto mb-4" />
                        <p className="text-web3-text-secondary mb-2">No sellers found.</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto glass-card rounded-2xl border border-white/10">
                        <table className="min-w-full text-sm">
                          <thead>
                            <tr className="bg-white/5 border-b border-white/10 text-left">
                              <th className="p-4 text-web3-accent-cyan">Seller</th>
                              <th className="p-4 text-web3-accent-cyan">Email</th>
                              <th className="p-4 text-web3-accent-cyan">Bank Details</th>
                              <th className="p-4 text-web3-accent-cyan">Unpaid Balance</th>
                              <th className="p-4 text-web3-accent-cyan">Status</th>
                              <th className="p-4 text-web3-accent-cyan text-right">Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {sellers.map((seller) => (
                              <tr key={seller.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                <td className="p-4">
                                  <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center text-sm font-bold border border-white/10">
                                      {seller.username.substring(0, 2).toUpperCase()}
                                    </div>
                                    <span className="font-bold text-white">{seller.username}</span>
                                  </div>
                                </td>
                                <td className="p-4 text-web3-text-secondary">{seller.email}</td>
                                <td className="p-4">
                                  {seller.bank_details?.bank_name ? (
                                    <div className="space-y-1">
                                      <div className="flex items-center gap-2 text-white">
                                        <Building2 className="w-4 h-4 text-web3-accent-cyan" />
                                        <span className="font-medium">{seller.bank_details.bank_name}</span>
                                      </div>
                                      <div className="text-xs text-web3-text-secondary">
                                        {seller.bank_details.account_number} • {seller.bank_details.account_holder}
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-2 text-yellow-400">
                                      <AlertCircle className="w-4 h-4" />
                                      <span className="text-xs">Belum diatur</span>
                                    </div>
                                  )}
                                </td>
                                <td className="p-4">
                                  {seller.unpaid_balance && seller.unpaid_balance > 0 ? (
                                    <div className="space-y-1">
                                      <div className="font-mono text-lg font-bold text-emerald-400">
                                        Rp {new Intl.NumberFormat("id-ID").format(seller.unpaid_balance)}
                                      </div>
                                      <div className="text-xs text-web3-text-secondary">
                                        {seller.unpaid_count} transaksi
                                      </div>
                                    </div>
                                  ) : (
                                    <span className="text-web3-text-muted text-sm">Rp 0</span>
                                  )}
                                </td>
                                <td className="p-4">
                                  {seller.bank_details?.bank_name ? (
                                    <span className="px-2 py-1 rounded-lg text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                      Siap
                                    </span>
                                  ) : (
                                    <span className="px-2 py-1 rounded-lg text-xs font-bold bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
                                      Belum Siap
                                    </span>
                                  )}
                                </td>
                                <td className="p-4 text-right">
                                  <div className="flex items-center gap-2 justify-end">
                                    {seller.unpaid_balance && seller.unpaid_balance > 0 && seller.bank_details?.bank_name && (
                                      <button
                                        onClick={() => openConfirmDialog(seller.id, seller.username)}
                                        className="flex items-center gap-2 px-3 py-2 bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 rounded-lg hover:bg-emerald-500/30 transition-all font-bold text-xs"
                                      >
                                        <CreditCard className="w-4 h-4" /> Tandai Lunas
                                      </button>
                                    )}
                                    <button
                                      onClick={() => setSelectedSellerId(seller.id)}
                                      className="flex items-center gap-2 px-4 py-2 bg-web3-accent-cyan/10 text-web3-accent-cyan border border-web3-accent-cyan/30 rounded-lg hover:bg-web3-accent-cyan/20 transition-all font-bold text-xs"
                                    >
                                      Lihat Detail <ChevronRight className="w-4 h-4" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
              )}
          </div>
      )}

      {activeTab === "payouts" && (
        <div className="animate-fade-in">
          <h2 className="text-2xl font-bold mb-4 gradient-text">Riwayat Pencairan</h2>
          {loadingPayouts ? <p>Memuat...</p> : (
            <div className="overflow-x-auto glass-card rounded-2xl border border-white/10">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-white/5 border-b border-white/10 text-left">
                    <th className="p-4 text-web3-accent-cyan">No Pencairan</th>
                    <th className="p-4 text-web3-accent-cyan">Tanggal</th>
                    <th className="p-4 text-web3-accent-cyan">Penjual</th>
                    <th className="p-4 text-web3-accent-cyan">Detail Bank</th>
                    <th className="p-4 text-web3-accent-cyan">Jumlah Ditransfer</th>
                    <th className="p-4 text-web3-accent-cyan">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {payoutHistory.map((p) => (
                    <tr key={p._id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="p-4 font-mono text-xs">{p.payout_no}</td>
                      <td className="p-4">{formatDate(p.paid_at)}</td>
                      <td className="p-4 font-bold">{p.seller_id?.username || "Unknown"}</td>
                      <td className="p-4">
                        <div className="text-xs text-web3-text-secondary">
                          {p.seller_id?.bank_details?.bank_name} - {p.seller_id?.bank_details?.account_number}
                          <br />
                          {p.seller_id?.bank_details?.account_holder}
                        </div>
                      </td>
                      <td className="p-4 font-mono text-lg font-bold text-emerald-400">
                        Rp {new Intl.NumberFormat("id-ID").format(p.amount)}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1 text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-lg w-fit border border-emerald-500/20">
                           <CheckCircle className="w-3.5 h-3.5" /> Lunas
                        </div>
                      </td>
                    </tr>
                  ))}
                  {payoutHistory.length === 0 && (
                     <tr><td colSpan={6} className="p-8 text-center text-web3-text-muted">Tidak ada riwayat pencairan ditemukan</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ isOpen: false, sellerId: "", sellerName: "" })}
        onConfirm={handleMarkPaid}
        title="Konfirmasi Pembayaran"
        message={`Apakah Anda yakin sudah mentransfer dana ke ${confirmDialog.sellerName}? Tindakan ini akan menandai semua transaksi tertunda sebagai lunas.`}
        confirmText="Ya, Tandai Lunas"
        cancelText="Batal"
        variant="confirm"
        loading={markingPaid}
      />
    </div>
  );
}
