"use client";

import { useState, useMemo } from "react";
import { useCart } from "@/store/cart";
import { X, Minus, Plus, Trash2, ArrowLeft, CheckCircle, ShoppingBag } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/date";
import { formatIDR } from "@/lib/currency";

export default function CartDrawer() {
  const { items, isOpen, setIsOpen, removeItem, updateQuantity, total, clearCart } = useCart();
  const [step, setStep] = useState<'cart' | 'form' | 'success'>('cart');
  const [email, setEmail] = useState("");
  const [robloxUsername, setRobloxUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [invoiceData, setInvoiceData] = useState<any>(null);
  const [error, setError] = useState("");

  // Check if username is required (if any item is NOT an Account)
  const requiresUsername = useMemo(() => {
    return items.some(item => {
      const isAccount = 
        item.category?.name?.toLowerCase().includes('account') ||
        item.category?.slug?.toLowerCase().includes('account') ||
        item.name.toLowerCase().includes('account');
      return !isAccount;
    });
  }, [items]);

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const payload = {
        items: items.map(item => ({ id: item.id, quantity: item.quantity })),
        email,
        roblox_username: requiresUsername ? robloxUsername : undefined
      };

      const response = await api.post('/api/transactions', payload);
      setInvoiceData(response.data.transaction);
      clearCart();
      setStep('success');
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const resetDrawer = () => {
    setIsOpen(false);
    setTimeout(() => {
      setStep('cart');
      setEmail("");
      setRobloxUsername("");
      setInvoiceData(null);
      setError("");
    }, 300);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={resetDrawer}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
          />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 z-50 h-[100dvh] w-full max-w-lg glass-navbar shadow-2xl animate-slide-left"
          >
            <div className="flex h-full flex-col">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-white/10 p-6 bg-gradient-to-r from-web3-accent-cyan/5 to-web3-accent-purple/5">
                <div className="flex items-center gap-3">
                  {step === 'form' && (
                    <button onClick={() => setStep('cart')} className="text-web3-text-secondary hover:text-web3-accent-cyan transition-colors p-2 rounded-xl hover:bg-white/5">
                      <ArrowLeft className="h-5 w-5" />
                    </button>
                  )}
                  <h2 className="text-2xl font-bold gradient-text">
                    {step === 'cart' ? 'Your Cart' : step === 'form' ? 'Checkout' : 'Order Success'}
                  </h2>
                </div>
                <button
                  onClick={resetDrawer}
                  className="rounded-xl p-2.5 text-web3-text-secondary hover:bg-red-500/20 hover:text-red-400 transition-all"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6 pb-20">
                {step === 'cart' && (
                  <>
                    {items.length === 0 ? (
                      <div className="flex h-full flex-col items-center justify-center text-center">
                        <div className="mb-6 rounded-2xl bg-gradient-to-br from-web3-accent-cyan/10 to-web3-accent-purple/10 p-8 border border-white/10">
                          <ShoppingBag className="h-16 w-16 text-web3-accent-cyan mx-auto" />
                        </div>
                        <p className="text-xl font-bold text-web3-text-primary mb-2">Your cart is empty</p>
                        <p className="text-base text-web3-text-secondary">Add some awesome items to get started!</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {items.map((item) => (
                          <motion.div 
                            key={item.id} 
                            layout
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, x: 100 }}
                            className="glass-card p-4 rounded-2xl border border-white/10 hover:border-web3-accent-cyan/30 transition-all"
                          >
                            <div className="flex gap-4">
                              <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-xl border border-web3-accent-cyan/20">
                                <img
                                  src={item.image_url}
                                  alt={item.name}
                                  className="h-full w-full object-cover"
                                />
                              </div>
                              <div className="flex flex-1 flex-col justify-between">
                                <div>
                                  <h3 className="text-base font-bold text-web3-text-primary line-clamp-1">{item.name}</h3>
                                  <p className="gradient-text text-lg font-extrabold">{formatIDR(item.price)}</p>
                                  {item.specifications && (
                                    <div className="mt-2 flex flex-wrap gap-1">
                                      {Object.entries(item.specifications).slice(0, 2).map(([k, v]) => (
                                        <span key={k} className="inline-flex items-center rounded-lg bg-web3-accent-cyan/10 px-2 py-0.5 text-[10px] border border-web3-accent-cyan/20">
                                          <span className="text-web3-text-secondary capitalize">{k}:</span>
                                          <span className="ml-1 text-web3-accent-cyan font-semibold">{String(v)}</span>
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                </div>
                                <div className="flex items-center justify-between mt-3">
                                  <div className="flex items-center gap-2 rounded-xl bg-web3-accent-cyan/10 border border-web3-accent-cyan/30 p-1.5">
                                    <button
                                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                      className="rounded-lg p-1.5 hover:bg-web3-accent-cyan/20 text-web3-accent-cyan transition-all hover:scale-110"
                                    >
                                      <Minus className="h-3.5 w-3.5" />
                                    </button>
                                    <span className="min-w-[2rem] text-center text-sm font-bold text-web3-text-primary">
                                      {item.quantity}
                                    </span>
                                    <button
                                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                      className="rounded-lg p-1.5 hover:bg-web3-accent-cyan/20 text-web3-accent-cyan transition-all hover:scale-110"
                                    >
                                      <Plus className="h-3.5 w-3.5" />
                                    </button>
                                  </div>
                                  <button
                                    onClick={() => removeItem(item.id)}
                                    className="text-web3-text-secondary hover:text-red-400 hover:bg-red-500/10 p-2 rounded-xl transition-all"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </>
                )}

                {step === 'form' && (
                  <form id="checkout-form" onSubmit={handleCheckout} className="space-y-5">
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-web3-text-primary">Email Address</label>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full rounded-xl border border-white/10 bg-white/5 p-3.5 text-white placeholder-web3-text-muted focus:border-web3-accent-cyan focus:outline-none focus:ring-2 focus:ring-web3-accent-cyan/20 transition-all"
                        placeholder="your@email.com"
                      />
                    </div>

                    {requiresUsername && (
                      <div>
                        <label className="mb-2 block text-sm font-semibold text-web3-text-primary">Roblox Username</label>
                        <input
                          type="text"
                          required
                          value={robloxUsername}
                          onChange={(e) => setRobloxUsername(e.target.value)}
                          className="w-full rounded-xl border border-white/10 bg-white/5 p-3.5 text-white placeholder-web3-text-muted focus:border-web3-accent-cyan focus:outline-none focus:ring-2 focus:ring-web3-accent-cyan/20 transition-all"
                          placeholder="YourRobloxUsername"
                        />
                        <p className="mt-2 text-xs text-web3-text-secondary">Required for item delivery</p>
                      </div>
                    )}

                    {!requiresUsername && (
                      <div className="rounded-xl bg-gradient-to-r from-web3-accent-cyan/10 to-web3-accent-purple/10 border border-web3-accent-cyan/20 p-4 text-sm text-web3-accent-cyan">
                        ✓ No Roblox username required for Account purchases. Details will be sent to your email.
                      </div>
                    )}

                    {error && (
                      <div className="rounded-xl bg-red-500/10 border border-red-500/30 p-4 text-sm text-red-400">
                        {error}
                      </div>
                    )}
                  </form>
                )}

                {step === 'success' && invoiceData && (
                  <div className="flex h-full flex-col items-center justify-center text-center">
                    <motion.div 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", duration: 0.5 }}
                      className="mb-6 rounded-2xl bg-gradient-to-br from-web3-accent-green/20 to-web3-accent-cyan/20 p-8 border border-web3-accent-green/30 shadow-glow-green"
                    >
                      <CheckCircle className="h-16 w-16 text-web3-accent-green mx-auto" />
                    </motion.div>
                    <h3 className="mb-2 text-3xl font-bold gradient-text">Order Placed!</h3>
                    <p className="mb-6 text-web3-text-secondary">Please complete your payment within 2 hours.</p>

                    <div className="w-full space-y-4 glass-card rounded-2xl p-6 text-left border border-white/10">
                      <div>
                        <p className="text-xs text-web3-text-secondary uppercase tracking-wide mb-1">Invoice Number</p>
                        <p className="font-mono text-lg font-bold text-web3-accent-cyan">{invoiceData.invoice_number}</p>
                      </div>
                      <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
                      <div>
                        <p className="text-xs text-web3-text-secondary uppercase tracking-wide mb-1">Total Transfer (Exact Amount)</p>
                        <p className="text-2xl font-bold gradient-text">{formatIDR(invoiceData.total_transfer)}</p>
                        <p className="text-xs text-web3-text-muted mt-1">Includes unique code: {invoiceData.unique_code}</p>
                      </div>
                      <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
                      <div>
                        <p className="text-xs text-web3-text-secondary uppercase tracking-wide mb-1">Payment Deadline</p>
                        <p className="text-white font-semibold">{formatDate(invoiceData.payment_deadline)}</p>
                      </div>
                    </div>

                    <p className="mt-6 text-sm text-web3-text-secondary">
                      An email with these details has been sent to <span className="text-web3-accent-cyan font-semibold">{email}</span>
                    </p>
                  </div>
                )}
              </div>

              {/* Footer Actions */}
              {((step === 'cart' && items.length > 0) || step === 'form') && (
                <div className="border-t border-white/10 bg-gradient-to-r from-web3-accent-cyan/5 to-web3-accent-purple/5 p-6 backdrop-blur-xl">
                  <div className="mb-4 flex items-center justify-between text-xl">
                    <span className="font-semibold text-web3-text-primary">Total</span>
                    <span className="font-bold gradient-text text-2xl">{formatIDR(total())}</span>
                  </div>
                  {step === 'cart' ? (
                    <button
                      onClick={() => setStep('form')}
                      className="relative w-full rounded-xl bg-gradient-to-r from-web3-accent-cyan to-web3-accent-purple py-4 font-bold text-white transition-all hover:scale-105 active:scale-[0.98] hover:shadow-glow-cyan border-2 border-web3-accent-cyan/50 hover:border-web3-accent-cyan overflow-hidden group"
                    >
                      <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></span>
                      <span className="relative">Proceed to Checkout</span>
                    </button>
                  ) : (
                    <button
                      type="submit"
                      form="checkout-form"
                      disabled={loading}
                      data-testid="confirm-order-btn"
                      className="relative w-full rounded-xl bg-gradient-to-r from-web3-accent-green to-web3-accent-cyan py-4 font-bold text-white transition-all hover:scale-105 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-glow-green border-2 border-web3-accent-green/50 hover:border-web3-accent-green overflow-hidden group"
                    >
                      <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></span>
                      <span className="relative">{loading ? 'Processing...' : 'Confirm Order'}</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
