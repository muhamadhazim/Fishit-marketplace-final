"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Clock, ExternalLink, CheckCircle, AlertCircle, RefreshCw } from "lucide-react";
import { motion } from "framer-motion";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:4000';
const API_URL = `${API_BASE.replace(/\/$/, '')}/api`;

function WaitingContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<'pending' | 'paid' | 'expired' | 'failed'>('pending');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [email, setEmail] = useState('');
  const [paymentUrl, setPaymentUrl] = useState('');
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkCount, setCheckCount] = useState(0);
  const [pollingActive, setPollingActive] = useState(true);

  useEffect(() => {
    const invoice = searchParams.get('invoice');
    const emailParam = searchParams.get('email');
    const paymentUrlParam = searchParams.get('payment_url');

    if (!invoice || !emailParam) {
      router.push('/');
      return;
    }

    setInvoiceNumber(invoice);
    setEmail(emailParam);
    if (paymentUrlParam) setPaymentUrl(decodeURIComponent(paymentUrlParam));

    // Initial check
    checkPaymentStatus(invoice, emailParam);

    // Poll every 5 seconds (only if still pending)
    const interval = setInterval(() => {
      if (pollingActive) {
        checkPaymentStatus(invoice, emailParam);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [searchParams, router, pollingActive]);

  const checkPaymentStatus = async (invoice: string, email: string) => {
    try {
      setCheckCount(prev => prev + 1);
      const response = await fetch(`${API_URL}/transactions/check-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoice_number: invoice, email })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.transactions && data.transactions.length > 0) {
          setTransactions(data.transactions);
          const firstTx = data.transactions[0];
          
          if (firstTx.status === 'Paid') {
            setStatus('paid');
            setPollingActive(false); // Stop polling
            // No redirect - just stop polling and show success
          } else if (firstTx.status === 'Expired') {
            setStatus('expired');
            setPollingActive(false);
          } else if (firstTx.status === 'Failed') {
            setStatus('failed');
            setPollingActive(false);
          } else {
            setStatus('pending');
          }

          if (firstTx.payment_url && !paymentUrl) {
            setPaymentUrl(firstTx.payment_url);
          }
        }
      }
    } catch (error) {
      console.error('Error checking payment status:', error);
    } finally {
      setLoading(false);
    }
  };

  const openPaymentInNewTab = () => {
    if (paymentUrl) {
      window.open(paymentUrl, '_blank', 'noopener,noreferrer');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-web3-bg-dark flex items-center justify-center p-4">
        <div className="text-web3-text-secondary">Memuat...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-web3-bg-dark flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-lg w-full"
      >
        {/* Status Card */}
        <div className="glass-card rounded-3xl border border-white/10 p-8 text-center">
          {/* Status Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", duration: 0.6, delay: 0.2 }}
            className={`mx-auto mb-6 w-24 h-24 rounded-full flex items-center justify-center border ${
              status === 'paid'
                ? 'bg-gradient-to-br from-web3-accent-green/20 to-web3-accent-cyan/20 border-web3-accent-green/30 shadow-glow-green'
                : status === 'expired' || status === 'failed'
                ? 'bg-gradient-to-br from-red-500/20 to-red-600/20 border-red-500/30'
                : 'bg-gradient-to-br from-web3-accent-yellow/20 to-web3-accent-cyan/20 border-web3-accent-yellow/30'
            }`}
          >
            {status === 'paid' ? (
              <CheckCircle className="w-12 h-12 text-web3-accent-green" />
            ) : status === 'expired' || status === 'failed' ? (
              <AlertCircle className="w-12 h-12 text-red-500" />
            ) : (
              <Clock className="w-12 h-12 text-web3-accent-yellow animate-pulse" />
            )}
          </motion.div>

          {/* Title */}
          <h1 className="text-3xl font-bold gradient-text mb-2">
            {status === 'paid'
              ? 'Pembayaran Berhasil!'
              : status === 'expired'
              ? 'Pembayaran Kadaluarsa'
              : status === 'failed'
              ? 'Pembayaran Gagal'
              : 'Menunggu Pembayaran'}
          </h1>
          
          <p className="text-web3-text-secondary mb-6">
            {status === 'paid'
              ? 'Terima kasih! Pesanan Anda akan segera diproses.'
              : status === 'expired'
              ? 'Batas waktu pembayaran telah habis'
              : status === 'failed'
              ? 'Transaksi pembayaran gagal diproses'
              : 'Silakan selesaikan pembayaran Anda'}
          </p>

          {/* Invoice Info */}
          {invoiceNumber && (
            <div className="glass-card rounded-xl p-4 border border-white/10 mb-6">
              <p className="text-sm text-web3-text-secondary mb-1">Nomor Invoice</p>
              <p className="font-mono font-bold text-web3-accent-cyan">{invoiceNumber}</p>
            </div>
          )}

          {/* Payment Button - Only show when pending */}
          {status === 'pending' && paymentUrl && (
            <button
              onClick={openPaymentInNewTab}
              className="w-full mb-4 rounded-xl bg-gradient-to-r from-web3-accent-cyan to-web3-accent-purple py-4 font-bold text-white transition-all hover:scale-105 active:scale-[0.98] border-2 border-web3-accent-cyan/50 flex items-center justify-center gap-2"
            >
              <ExternalLink className="w-5 h-5" />
              Bayar Sekarang
            </button>
          )}

          {/* Auto-refresh indicator */}
          {status === 'pending' && (
            <div className="flex items-center justify-center gap-2 text-sm text-web3-text-muted mb-4">
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Memeriksa status pembayaran... ({checkCount}x)</span>
            </div>
          )}

          {/* Transaction Details */}
          {transactions.length > 0 && (
            <div className="text-left mt-6 space-y-3">
              {transactions.map((tx, idx) => (
                <div key={idx} className="glass-card rounded-xl p-4 border border-white/10">
                  <div className="space-y-2">
                    {tx.items?.map((item: any, itemIdx: number) => (
                      <div key={itemIdx} className="flex justify-between text-sm">
                        <span className="text-white">{item.name} x{item.quantity}</span>
                        <span className="text-web3-accent-cyan font-bold">
                          Rp {(item.price * item.quantity).toLocaleString('id-ID')}
                        </span>
                      </div>
                    ))}
                    <div className="pt-2 border-t border-white/10 flex justify-between font-bold">
                      <span className="text-white">Total</span>
                      <span className="text-web3-accent-cyan">
                        Rp {tx.total_transfer?.toLocaleString('id-ID')}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Instructions */}
          {status === 'pending' && (
            <div className="mt-6 p-4 bg-web3-accent-cyan/10 rounded-xl border border-web3-accent-cyan/30">
              <p className="text-sm text-web3-text-secondary">
                💡 <strong>Petunjuk:</strong>
              </p>
              <ol className="text-sm text-web3-text-secondary text-left mt-2 space-y-1 list-decimal list-inside">
                <li>Klik tombol "Bayar Sekarang" (akan dibuka di tab baru)</li>
                <li>Pilih metode pembayaran dan selesaikan transaksi</li>
                <li>Halaman ini akan otomatis refresh saat pembayaran berhasil</li>
              </ol>
            </div>
          )}

          {/* Back to home for failed/expired/paid */}
          {(status === 'expired' || status === 'failed' || status === 'paid') && (
            <button
              onClick={() => router.push('/')}
              className="w-full mt-6 rounded-xl bg-white/5 border border-white/10 py-3.5 font-semibold text-web3-text-secondary hover:text-white hover:bg-white/10 transition-all"
            >
              Kembali ke Beranda
            </button>
          )}
        </div>

        {/* Footer Note */}
        <p className="text-center text-sm text-web3-text-muted mt-6">
          Ada pertanyaan? Hubungi kami melalui{" "}
          <a href="mailto:support@fishit.store" className="text-web3-accent-cyan hover:underline">
            support@fishit.store
          </a>
        </p>
      </motion.div>
    </div>
  );
}

export default function PaymentWaitingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-web3-bg-dark flex items-center justify-center">
        <div className="text-web3-text-secondary">Memuat...</div>
      </div>
    }>
      <WaitingContent />
    </Suspense>
  );
}
