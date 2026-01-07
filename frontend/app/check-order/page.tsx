"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import api from "@/lib/api";
import { formatDate } from "@/lib/date";
import { Search, Package, Clock, CheckCircle, XCircle, AlertCircle, CreditCard } from "lucide-react";
import { motion } from "framer-motion";

type Transaction = {
  invoice_number: string;
  status: "Pending" | "Paid" | "Processing" | "Success" | "Failed" | "Cancelled" | "Expired";
  items: { name: string; quantity: number; price: number; image_url?: string }[];
  total_transfer: number;
  payment_url?: string | null;
  payment_deadline?: string;
  payment_method?: string;
  payment_channel?: string;
  paid_at?: string;
  created_at: string;
  user_roblox_username?: string;
};

function formatIDR(n: number) {
  return "Rp " + new Intl.NumberFormat("id-ID").format(n);
}

function CheckOrderContent() {
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  // Auto-fill from URL params
  useEffect(() => {
    const invoiceParam = searchParams.get("invoice");
    if (invoiceParam) {
      setSearchQuery(invoiceParam);
      // Auto search if invoice is provided
      handleSearchWithQuery(invoiceParam);
    }
  }, [searchParams]);

  // Detect if input is email or invoice number
  const isEmail = (input: string) => {
    return input.includes("@") && input.includes(".");
  };

  async function handleSearchWithQuery(query: string) {
    if (!query.trim()) return;

    setLoading(true);
    setError("");
    setTransactions([]);
    setHasSearched(true);

    try {
      const payload = isEmail(query)
        ? { email: query.trim() }
        : { invoice_number: query.trim() };

      const res = await api.post("/api/transactions/check-order", payload);
      setTransactions(res.data.transactions);
    } catch (err: any) {
      if (err.response && err.response.status === 404) {
        setError("Pesanan tidak ditemukan. Pastikan email atau nomor invoice sudah benar.");
      } else {
        setError(err.response?.data?.message || "Gagal mencari pesanan. Silakan coba lagi.");
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    handleSearchWithQuery(searchQuery);
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Success":
        return "bg-emerald-500/20 text-emerald-300 border-emerald-500/30";
      case "Paid":
      case "Processing":
        return "bg-blue-500/20 text-blue-300 border-blue-500/30";
      case "Failed":
      case "Cancelled":
      case "Expired":
        return "bg-red-500/20 text-red-300 border-red-500/30";
      default:
        return "bg-amber-500/20 text-amber-300 border-amber-500/30";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Success":
        return <CheckCircle className="h-4 w-4" />;
      case "Paid":
      case "Processing":
        return <Clock className="h-4 w-4" />;
      case "Failed":
      case "Cancelled":
      case "Expired":
        return <XCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      Pending: "Menunggu Pembayaran",
      Paid: "Sudah Dibayar",
      Processing: "Sedang Diproses",
      Success: "Berhasil",
      Failed: "Gagal",
      Cancelled: "Dibatalkan",
      Expired: "Kedaluwarsa"
    };
    return statusMap[status] || status;
  };

  return (
    <div className="min-h-screen pt-32 pb-20 px-6">
      <div className="mx-auto max-w-4xl">

        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold tracking-tight mb-4">
            Cek <span className="gradient-text">Pesanan</span>
          </h1>
          <p className="text-web3-text-secondary text-lg">
            Lacak status pesanan Anda dengan nomor invoice atau email.
          </p>
        </div>

        {/* Search Form */}
        <div className="mx-auto max-w-2xl mb-16">
          <form onSubmit={handleSearch} className="space-y-4">
            {/* Single Unified Input */}
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-web3-accent-cyan to-web3-accent-purple rounded-xl blur opacity-10 group-hover:opacity-20 transition-opacity"></div>
              <div className="relative flex items-center glass-card rounded-xl border border-white/10">
                <Search className="ml-4 h-5 w-5 text-web3-text-secondary" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Masukkan Nomor Invoice atau Email"
                  className="w-full bg-transparent border-none px-4 py-3.5 text-white placeholder-web3-text-muted focus:outline-none focus:ring-0"
                />
              </div>
            </div>

            {/* Search Button */}
            <button
              type="submit"
              disabled={loading || !searchQuery.trim()}
              className="w-full rounded-xl bg-gradient-to-r from-web3-accent-cyan to-web3-accent-purple px-8 py-4 font-bold text-white transition-all hover:scale-[1.02] hover:shadow-glow-cyan disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
            >
              <Search className="h-5 w-5" />
              {loading ? "Mencari..." : "Cek Pesanan"}
            </button>
          </form>
        </div>

        {/* Results */}
        <div className="space-y-6">
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card rounded-2xl p-6 border border-red-500/30 bg-red-500/10 text-center"
            >
              <AlertCircle className="h-10 w-10 text-red-400 mx-auto mb-3" />
              <h3 className="text-xl font-bold text-red-400 mb-2">Pesanan Tidak Ditemukan</h3>
              <p className="text-web3-text-secondary">{error}</p>
            </motion.div>
          )}

          {transactions.map((tx, index) => (
            <motion.div
              key={tx.invoice_number + index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="glass-card rounded-2xl p-6 sm:p-8 border border-white/10 hover:border-web3-accent-cyan/30 transition-all"
            >
              {/* Header */}
              <div className="flex flex-col md:flex-row justify-between gap-6 mb-6 pb-6 border-b border-white/10">
                <div>
                  <div className="text-sm text-web3-text-secondary mb-1">Nomor Invoice</div>
                  <div className="text-xl font-mono font-bold text-web3-accent-cyan">{tx.invoice_number}</div>
                  <div className="text-sm text-web3-text-muted mt-1">
                    {formatDate(tx.created_at)}
                  </div>
                  {tx.user_roblox_username && (
                    <div className="text-sm text-web3-accent-purple mt-2">
                      Roblox: {tx.user_roblox_username}
                    </div>
                  )}
                </div>
                <div className="flex items-start gap-4">
                  <div className="text-right">
                    <div className="text-sm text-web3-text-secondary mb-1">Status</div>
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-sm font-bold border ${getStatusColor(tx.status)}`}
                    >
                      {getStatusIcon(tx.status)}
                      {getStatusText(tx.status)}
                    </span>

                    {/* Payment Info */}
                    {tx.paid_at && (
                      <div className="mt-2 text-xs text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-1 rounded-lg border border-emerald-500/20">
                        Dibayar: {formatDate(tx.paid_at)}
                        {tx.payment_channel && ` via ${tx.payment_channel.toUpperCase()}`}
                      </div>
                    )}

                    {/* Deadline Warning */}
                    {tx.status === "Pending" && tx.payment_deadline && (
                      <div className="mt-2 text-xs text-amber-400 font-semibold bg-amber-500/10 px-2 py-1 rounded-lg border border-amber-500/20">
                        Bayar sebelum: <br/>
                        {formatDate(tx.payment_deadline)}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Items */}
              <div className="space-y-4">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <Package className="h-5 w-5 text-web3-accent-purple" />
                  Detail Pesanan
                </h3>
                <div className="grid gap-3">
                  {tx.items.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-white/5 rounded-xl p-4">
                      <div className="flex items-center gap-4">
                        {item.image_url ? (
                            <img src={item.image_url} alt={item.name} className="w-12 h-12 rounded-lg object-cover bg-black/20" />
                        ) : (
                            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-web3-accent-cyan/20 to-web3-accent-purple/20 flex items-center justify-center">
                                <Package className="h-6 w-6 text-white/50" />
                            </div>
                        )}
                        <div>
                          <div className="font-bold text-white">{item.name}</div>
                          <div className="text-sm text-web3-text-secondary">
                            {item.quantity}x @ {formatIDR(item.price)}
                          </div>
                        </div>
                      </div>
                      <div className="font-bold text-white">
                        {formatIDR(item.price * item.quantity)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Footer */}
              <div className="mt-6 pt-6 border-t border-white/10">
                <div className="flex justify-between items-center mb-4">
                  <div className="text-web3-text-secondary">Total Pembayaran</div>
                  <div className="text-2xl font-bold gradient-text">{formatIDR(tx.total_transfer)}</div>
                </div>

                {/* Pay Now Button */}
                {tx.status === "Pending" && tx.payment_url && (
                  <a
                    href={tx.payment_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full rounded-xl bg-gradient-to-r from-web3-accent-green to-web3-accent-cyan px-8 py-4 font-bold text-white transition-all hover:scale-[1.02] hover:shadow-glow-green flex items-center justify-center gap-2 mt-4"
                  >
                    <CreditCard className="h-5 w-5" />
                    Bayar Sekarang
                  </a>
                )}

                {/* Status Messages */}
                {tx.status === "Paid" && (
                  <div className="text-center p-4 bg-blue-500/10 rounded-xl border border-blue-500/20">
                    <p className="text-blue-300 font-semibold">Pembayaran berhasil! Pesanan sedang diproses oleh seller.</p>
                  </div>
                )}

                {tx.status === "Processing" && (
                  <div className="text-center p-4 bg-blue-500/10 rounded-xl border border-blue-500/20">
                    <p className="text-blue-300 font-semibold">Pesanan Anda sedang diproses. Mohon tunggu konfirmasi dari seller.</p>
                  </div>
                )}

                {tx.status === "Success" && (
                  <div className="text-center p-4 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                    <p className="text-emerald-300 font-semibold">Pesanan telah selesai! Terima kasih telah berbelanja.</p>
                  </div>
                )}

                {(tx.status === "Failed" || tx.status === "Cancelled" || tx.status === "Expired") && (
                  <div className="text-center p-4 bg-red-500/10 rounded-xl border border-red-500/20">
                    <p className="text-red-300 font-semibold">
                      {tx.status === "Expired" ? "Pembayaran kedaluwarsa. Silakan buat pesanan baru." : "Pesanan dibatalkan."}
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          ))}

          {/* Empty State after search */}
          {hasSearched && !loading && transactions.length === 0 && !error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12"
            >
              <Package className="h-16 w-16 text-web3-text-muted mx-auto mb-4" />
              <p className="text-web3-text-secondary">Tidak ada pesanan yang ditemukan.</p>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function CheckOrderPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen pt-32 pb-20 px-6 flex items-center justify-center">
        <div className="text-web3-text-secondary">Memuat...</div>
      </div>
    }>
      <CheckOrderContent />
    </Suspense>
  );
}
