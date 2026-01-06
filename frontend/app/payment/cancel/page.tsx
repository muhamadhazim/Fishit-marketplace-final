"use client";

import { useEffect, useState } from "react";
import { XCircle, ArrowLeft, RefreshCw, Home } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

export default function PaymentCancelPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <div className="min-h-screen bg-web3-bg-dark flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-lg w-full"
      >
        {/* Cancel Card */}
        <div className="glass-card rounded-3xl border border-white/10 p-8 text-center">
          {/* Cancel Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", duration: 0.6, delay: 0.2 }}
            className="mx-auto mb-6 w-24 h-24 rounded-full bg-gradient-to-br from-red-500/20 to-orange-500/20 flex items-center justify-center border border-red-500/30"
          >
            <XCircle className="w-12 h-12 text-red-400" />
          </motion.div>

          {/* Title */}
          <h1 className="text-3xl font-bold text-red-400 mb-2">
            Pembayaran Dibatalkan
          </h1>
          <p className="text-web3-text-secondary mb-8">
            Pembayaran Anda telah dibatalkan atau belum selesai. 
            Anda dapat mencoba lagi kapan saja.
          </p>

          {/* Info Box */}
          <div className="glass-card rounded-xl p-4 border border-yellow-500/20 bg-yellow-500/5 mb-8">
            <p className="text-sm text-yellow-400">
              💡 <strong>Catatan:</strong> Jika Anda mengalami masalah saat pembayaran, 
              pastikan koneksi internet stabil dan coba metode pembayaran lain.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Link
              href="/"
              className="flex items-center justify-center gap-2 w-full rounded-xl bg-gradient-to-r from-web3-accent-cyan to-web3-accent-purple py-3.5 font-bold text-white transition-all hover:scale-105 active:scale-[0.98] border-2 border-web3-accent-cyan/50"
            >
              <RefreshCw className="w-4 h-4" />
              Coba Lagi
            </Link>

            <Link
              href="/"
              className="flex items-center justify-center gap-2 w-full rounded-xl bg-white/5 border border-white/10 py-3.5 font-semibold text-web3-text-secondary hover:text-white hover:bg-white/10 transition-all"
            >
              <Home className="w-4 h-4" />
              Kembali ke Beranda
            </Link>
          </div>
        </div>

        {/* Footer Note */}
        <p className="text-center text-sm text-web3-text-muted mt-6">
          Butuh bantuan? Hubungi kami melalui{" "}
          <a href="mailto:support@example.com" className="text-web3-accent-cyan hover:underline">
            support@fishit.store
          </a>
        </p>
      </motion.div>
    </div>
  );
}
