"use client";

import { useState } from "react";
import api from "@/lib/api";
import { formatDate } from "@/lib/date";
import { Search, Package, Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";

type Transaction = {
  _id: string;
  invoice_number: string;
  email: string;
  status: "Pending" | "Processing" | "Success" | "Failed" | "Cancelled";
  items: { name: string; quantity: number; image_url?: string }[];
  total_transfer: number;
  payment_deadline?: string;
  created_at: string;
};

function formatIDR(n: number) {
  return "Rp " + new Intl.NumberFormat("id-ID").format(n);
}

export default function CheckOrderPage() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError("");
    setTransactions([]);
    setHasSearched(true);

    try {
      const res = await api.post("/api/transactions/search", { query });
      setTransactions(res.data.transactions);
    } catch (err: any) {
      if (err.response && err.response.status === 404) {
        setError("No transactions found with that Invoice Number or Email.");
      } else {
        setError("Failed to search transactions. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen pt-32 pb-20 px-6">
      <div className="mx-auto max-w-4xl">
        
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold tracking-tight mb-4">
            Check Your <span className="gradient-text">Order</span>
          </h1>
          <p className="text-web3-text-secondary text-lg">
            Enter your Invoice Number or Email Address to track your order status.
          </p>
        </div>

        {/* Search Form */}
        <div className="mx-auto max-w-2xl mb-16">
          <form onSubmit={handleSearch} className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-web3-accent-cyan to-web3-accent-purple rounded-2xl blur opacity-20 group-hover:opacity-30 transition-opacity"></div>
            <div className="relative flex items-center glass-card rounded-2xl p-2 border border-white/10">
              <Search className="ml-4 h-6 w-6 text-web3-text-secondary" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="INV-2024... or email@example.com"
                className="w-full bg-transparent border-none px-4 py-3 text-lg text-white placeholder-web3-text-muted focus:outline-none focus:ring-0"
              />
              <button
                type="submit"
                disabled={loading}
                className="rounded-xl bg-gradient-to-r from-web3-accent-cyan to-web3-accent-purple px-8 py-3 font-bold text-white transition-all hover:scale-105 hover:shadow-glow-cyan disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Searching..." : "Check"}
              </button>
            </div>
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
              <h3 className="text-xl font-bold text-red-400 mb-2">Order Not Found</h3>
              <p className="text-web3-text-secondary">{error}</p>
            </motion.div>
          )}

          {transactions.map((tx) => (
            <motion.div
              key={tx._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card rounded-2xl p-6 sm:p-8 border border-white/10 hover:border-web3-accent-cyan/30 transition-all"
            >
              <div className="flex flex-col md:flex-row justify-between gap-6 mb-6 pb-6 border-b border-white/10">
                <div>
                  <div className="text-sm text-web3-text-secondary mb-1">Invoice Number</div>
                  <div className="text-xl font-mono font-bold text-web3-accent-cyan">{tx.invoice_number}</div>
                  <div className="text-sm text-web3-text-muted mt-1">
                    {formatDate(tx.created_at)}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-sm text-web3-text-secondary mb-1">Status</div>
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-sm font-bold border ${
                        tx.status === "Success"
                          ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                          : tx.status === "Processing"
                          ? "bg-blue-500/20 text-blue-300 border-blue-500/30"
                          : tx.status === "Failed" || tx.status === "Cancelled"
                          ? "bg-red-500/20 text-red-300 border-red-500/30"
                          : "bg-amber-500/20 text-amber-300 border-amber-500/30"
                      }`}
                    >
                      {tx.status === "Success" && <CheckCircle className="h-4 w-4" />}
                      {tx.status === "Failed" && <XCircle className="h-4 w-4" />}
                      {tx.status === "Cancelled" && <XCircle className="h-4 w-4" />}
                      {tx.status === "Processing" && <Clock className="h-4 w-4" />}
                      {tx.status === "Pending" && <Clock className="h-4 w-4" />}
                      {tx.status}
                    </span>
                    {tx.status === "Pending" && tx.payment_deadline && (
                      <div className="mt-2 text-xs text-amber-400 font-semibold bg-amber-500/10 px-2 py-1 rounded-lg border border-amber-500/20">
                        Pay before: <br/>
                        {formatDate(tx.payment_deadline)}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <Package className="h-5 w-5 text-web3-accent-purple" />
                  Order Items
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
                          <div className="text-sm text-web3-text-secondary">Qty: {item.quantity}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-white/10 flex justify-between items-center">
                <div className="text-web3-text-secondary">Total Amount</div>
                <div className="text-2xl font-bold gradient-text">{formatIDR(tx.total_transfer)}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
