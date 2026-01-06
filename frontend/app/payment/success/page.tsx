"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle, ArrowLeft, Package, Mail, Clock } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

function SuccessContent() {
  const searchParams = useSearchParams();
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
        {/* Success Card */}
        <div className="glass-card rounded-3xl border border-white/10 p-8 text-center">
          {/* Success Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", duration: 0.6, delay: 0.2 }}
            className="mx-auto mb-6 w-24 h-24 rounded-full bg-gradient-to-br from-web3-accent-green/20 to-web3-accent-cyan/20 flex items-center justify-center border border-web3-accent-green/30 shadow-glow-green"
          >
            <CheckCircle className="w-12 h-12 text-web3-accent-green" />
          </motion.div>

          {/* Title */}
          <h1 className="text-3xl font-bold gradient-text mb-2">
            Pembayaran Berhasil!
          </h1>
          <p className="text-web3-text-secondary mb-8">
            Terima kasih! Pembayaran Anda telah kami terima.
          </p>

          {/* Info Cards */}
          <div className="space-y-4 mb-8">
            <div className="glass-card rounded-xl p-4 border border-white/10 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-web3-accent-cyan/10 flex items-center justify-center">
                <Package className="w-5 h-5 text-web3-accent-cyan" />
              </div>
              <div className="text-left">
                <p className="text-sm text-web3-text-secondary">Status Pesanan</p>
                <p className="font-semibold text-web3-accent-green">Sedang Diproses</p>
              </div>
            </div>

            <div className="glass-card rounded-xl p-4 border border-white/10 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-web3-accent-purple/10 flex items-center justify-center">
                <Mail className="w-5 h-5 text-web3-accent-purple" />
              </div>
              <div className="text-left">
                <p className="text-sm text-web3-text-secondary">Konfirmasi</p>
                <p className="font-semibold text-white">Detail dikirim ke email Anda</p>
              </div>
            </div>

            <div className="glass-card rounded-xl p-4 border border-white/10 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-web3-accent-yellow/10 flex items-center justify-center">
                <Clock className="w-5 h-5 text-web3-accent-yellow" />
              </div>
              <div className="text-left">
                <p className="text-sm text-web3-text-secondary">Estimasi Pengiriman</p>
                <p className="font-semibold text-white">1 x 24 Jam</p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Link
              href="/check-order"
              className="block w-full rounded-xl bg-gradient-to-r from-web3-accent-cyan to-web3-accent-purple py-3.5 font-bold text-white transition-all hover:scale-105 active:scale-[0.98] border-2 border-web3-accent-cyan/50"
            >
              Cek Status Pesanan
            </Link>

            <Link
              href="/"
              className="flex items-center justify-center gap-2 w-full rounded-xl bg-white/5 border border-white/10 py-3.5 font-semibold text-web3-text-secondary hover:text-white hover:bg-white/10 transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              Kembali ke Beranda
            </Link>
          </div>
        </div>

        {/* Footer Note */}
        <p className="text-center text-sm text-web3-text-muted mt-6">
          Ada pertanyaan? Hubungi kami melalui{" "}
          <a href="mailto:support@example.com" className="text-web3-accent-cyan hover:underline">
            support@fishit.store
          </a>
        </p>
      </motion.div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-web3-bg-dark flex items-center justify-center">
        <div className="text-web3-text-secondary">Memuat...</div>
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}
