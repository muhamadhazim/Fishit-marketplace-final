"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useCart } from "@/store/cart";
import { X, Minus, Plus, Trash2, ArrowLeft, CheckCircle, ShoppingBag, AlertTriangle, Check, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/lib/api";
import { formatIDR } from "@/lib/currency";

type FreshProductData = {
  id: string;
  name: string;
  category: {
    name: string;
    slug: string;
  } | null;
  stock: number;
  price: number;
  is_active: boolean;
};

export default function CartDrawer() {
  const { items, isOpen, setIsOpen, removeItem, updateQuantity, clearCart } = useCart();
  const [step, setStep] = useState<'cart' | 'form' | 'success'>('cart');
  const [email, setEmail] = useState("");
  const [robloxUsername, setRobloxUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [invoiceData, setInvoiceData] = useState<any>(null);
  const [error, setError] = useState("");

  // Selected items for checkout
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Fresh product data from API (realtime stock & category)
  const [freshProducts, setFreshProducts] = useState<FreshProductData[]>([]);
  const [fetchingProducts, setFetchingProducts] = useState(false);
  const [lastFetchTime, setLastFetchTime] = useState<number>(0);
  const FETCH_COOLDOWN = 5000; // 5 seconds cooldown

  // Force close cart on mount to prevent auto-open bug
  useEffect(() => {
    setIsOpen(false);
  }, []);

  // Check if can fetch (cooldown)
  const canFetch = () => {
    return Date.now() - lastFetchTime >= FETCH_COOLDOWN;
  };

  // Remaining cooldown time
  const [cooldownRemaining, setCooldownRemaining] = useState(0);

  // Update cooldown timer
  useEffect(() => {
    if (lastFetchTime === 0) return;

    const interval = setInterval(() => {
      const remaining = Math.max(0, FETCH_COOLDOWN - (Date.now() - lastFetchTime));
      setCooldownRemaining(remaining);
      if (remaining === 0) clearInterval(interval);
    }, 100);

    return () => clearInterval(interval);
  }, [lastFetchTime]);

  // Fetch fresh product data when cart opens
  const fetchFreshProductData = useCallback(async (force = false) => {
    if (items.length === 0) return;
    if (!force && !canFetch()) return; // Respect cooldown unless forced

    setFetchingProducts(true);
    setLastFetchTime(Date.now());
    try {
      const productIds = items.map(item => item.id);
      const res = await api.post('/api/products/validate-cart', { productIds });
      setFreshProducts(res.data.products);

      // Auto-select items that have stock
      const newSelected = new Set<string>();
      for (const item of items) {
        const fresh = res.data.products.find((p: FreshProductData) => p.id === item.id);
        if (fresh && fresh.is_active && fresh.stock >= item.quantity) {
          newSelected.add(item.id);
        }
      }
      setSelectedIds(newSelected);
    } catch (err) {
      console.error('Failed to fetch fresh product data:', err);
    } finally {
      setFetchingProducts(false);
    }
  }, [items]);

  // Fetch when cart opens
  useEffect(() => {
    if (isOpen && items.length > 0) {
      fetchFreshProductData(true); // Force fetch on open
    }
  }, [isOpen, items.length]);

  // Get fresh data for an item
  const getFreshData = (itemId: string): FreshProductData | undefined => {
    return freshProducts.find(p => p.id === itemId);
  };

  // Check if item can be selected (has stock, is active)
  const canSelectItem = (itemId: string, quantity: number): boolean => {
    const fresh = getFreshData(itemId);
    if (!fresh) return true; // Allow if not yet fetched
    return fresh.is_active && fresh.stock >= quantity;
  };

  // Get stock status for item
  const getStockStatus = (itemId: string, quantity: number): { status: 'ok' | 'low' | 'out' | 'unavailable', stock: number } => {
    const fresh = getFreshData(itemId);
    if (!fresh) return { status: 'ok', stock: 0 };
    if (!fresh.is_active) return { status: 'unavailable', stock: 0 };
    if (fresh.stock === 0) return { status: 'out', stock: 0 };
    if (fresh.stock < quantity) return { status: 'low', stock: fresh.stock };
    return { status: 'ok', stock: fresh.stock };
  };

  // Toggle item selection
  const toggleSelect = (itemId: string) => {
    const item = items.find(i => i.id === itemId);
    if (!item) return;

    if (!canSelectItem(itemId, item.quantity)) return;

    const newSelected = new Set(selectedIds);
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId);
    } else {
      newSelected.add(itemId);
    }
    setSelectedIds(newSelected);
  };

  // Select all available items
  const selectAll = () => {
    const newSelected = new Set<string>();
    for (const item of items) {
      if (canSelectItem(item.id, item.quantity)) {
        newSelected.add(item.id);
      }
    }
    setSelectedIds(newSelected);
  };

  // Deselect all
  const deselectAll = () => {
    setSelectedIds(new Set());
  };

  // Get selected items
  const selectedItems = items.filter(item => selectedIds.has(item.id));

  // Calculate total for selected items only
  const selectedTotal = selectedItems.reduce((acc, item) => acc + item.price * item.quantity, 0);

  // Calculate requiresUsername based on fresh data for selected items
  const requiresUsername = (() => {
    return selectedItems.some(item => {
      const fresh = getFreshData(item.id);
      const categoryName = fresh?.category?.name?.toLowerCase() || item.category?.name?.toLowerCase() || '';
      const categorySlug = fresh?.category?.slug?.toLowerCase() || item.category?.slug?.toLowerCase() || '';
      const productName = item.name.toLowerCase();

      const isAccount =
        categoryName.includes('account') ||
        categorySlug.includes('account') ||
        productName.includes('account');
      return !isAccount;
    });
  })();

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedItems.length === 0) return;

    setLoading(true);
    setError("");

    try {
      const payload = {
        items: selectedItems.map(item => ({ id: item.id, quantity: item.quantity })),
        email,
        roblox_username: requiresUsername ? robloxUsername : undefined
      };

      const response = await api.post('/api/transactions', payload);

      // Remove only checked out items from cart
      for (const item of selectedItems) {
        removeItem(item.id);
      }

      // Check if we have a payment URL (iPaymu redirect)
      if (response.data.payment_url) {
        // Get invoice from first transaction
        const invoice = response.data.transactions?.[0]?.invoice_number || '';
        
        // Redirect to waiting page with payment URL and invoice
        const waitingUrl = `/payment/waiting?invoice=${encodeURIComponent(invoice)}&email=${encodeURIComponent(email)}&payment_url=${encodeURIComponent(response.data.payment_url)}`;
        window.location.href = waitingUrl;
      } else {
        setInvoiceData(response.data);
        setStep('success');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || "Something went wrong. Please try again.");
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

  // Count selectable items
  const selectableCount = items.filter(item => canSelectItem(item.id, item.quantity)).length;
  const allSelected = selectableCount > 0 && selectedIds.size === selectableCount;

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <React.Fragment key="cart-drawer">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={resetDrawer}
            className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm"
          />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 z-[61] h-[100dvh] w-full max-w-lg glass-navbar shadow-2xl"
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
                    {step === 'cart' ? 'Keranjang Anda' : step === 'form' ? 'Pembayaran' : 'Pesanan Sukses'}
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
                        <p className="text-xl font-bold text-web3-text-primary mb-2">Keranjang Anda kosong</p>
                        <p className="text-base text-web3-text-secondary">Tambahkan item keren untuk memulai!</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {/* Select All / Refresh Controls */}
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <button
                              onClick={allSelected ? deselectAll : selectAll}
                              className="flex items-center gap-2 text-sm font-medium text-web3-text-secondary hover:text-web3-accent-cyan transition-colors"
                            >
                              <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                                allSelected
                                  ? 'bg-web3-accent-cyan border-web3-accent-cyan'
                                  : 'border-white/30 hover:border-web3-accent-cyan/50'
                              }`}>
                                {allSelected && <Check className="h-3.5 w-3.5 text-white" />}
                              </div>
                              {allSelected ? 'Batal Pilih Semua' : 'Pilih Semua'}
                            </button>
                            <span className="text-xs text-web3-text-muted">
                              ({selectedIds.size} dari {items.length} dipilih)
                            </span>
                          </div>
                          <button
                            onClick={() => fetchFreshProductData()}
                            disabled={fetchingProducts || !canFetch()}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                              fetchingProducts || !canFetch()
                                ? 'bg-white/5 border border-white/10 text-web3-text-muted cursor-not-allowed'
                                : 'bg-web3-accent-cyan/10 border border-web3-accent-cyan/30 text-web3-accent-cyan hover:bg-web3-accent-cyan/20 hover:border-web3-accent-cyan/50'
                            }`}
                          >
                            <RefreshCw className={`h-3.5 w-3.5 ${fetchingProducts ? 'animate-spin' : ''}`} />
                            {fetchingProducts
                              ? 'Cek Stok...'
                              : cooldownRemaining > 0
                                ? `${Math.ceil(cooldownRemaining / 1000)}s`
                                : 'Cek Stok'}
                          </button>
                        </div>

                        {/* Cart Items */}
                        {items.map((item) => {
                          const stockStatus = getStockStatus(item.id, item.quantity);
                          const isSelected = selectedIds.has(item.id);
                          const canSelect = canSelectItem(item.id, item.quantity);

                          return (
                            <motion.div
                              key={item.id}
                              layout
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, x: 100 }}
                              className={`glass-card p-4 rounded-2xl border transition-all ${
                                !canSelect
                                  ? 'border-red-500/30 bg-red-500/5 opacity-60'
                                  : isSelected
                                  ? 'border-web3-accent-cyan/50 bg-web3-accent-cyan/5'
                                  : 'border-white/10 hover:border-white/20'
                              }`}
                            >
                              <div className="flex gap-4">
                                {/* Checkbox */}
                                <button
                                  onClick={() => toggleSelect(item.id)}
                                  disabled={!canSelect}
                                  className="flex-shrink-0 self-center"
                                >
                                  <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                                    !canSelect
                                      ? 'border-red-500/50 bg-red-500/10 cursor-not-allowed'
                                      : isSelected
                                      ? 'bg-web3-accent-cyan border-web3-accent-cyan'
                                      : 'border-white/30 hover:border-web3-accent-cyan/50'
                                  }`}>
                                    {isSelected && <Check className="h-4 w-4 text-white" />}
                                    {!canSelect && <X className="h-4 w-4 text-red-400" />}
                                  </div>
                                </button>

                                {/* Image */}
                                <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl border border-web3-accent-cyan/20">
                                  <img
                                    src={item.image_url}
                                    alt={item.name}
                                    className="h-full w-full object-cover"
                                  />
                                </div>

                                {/* Details */}
                                <div className="flex flex-1 flex-col justify-between min-w-0">
                                  <div>
                                    <h3 className="text-base font-bold text-web3-text-primary line-clamp-1">{item.name}</h3>
                                    <p className="gradient-text text-lg font-extrabold">{formatIDR(item.price)}</p>
                                  </div>

                                  {/* Stock Status */}
                                  {stockStatus.status !== 'ok' && (
                                    <div className={`flex items-center gap-1.5 text-xs font-medium mt-1 ${
                                      stockStatus.status === 'out' || stockStatus.status === 'unavailable'
                                        ? 'text-red-400'
                                        : 'text-amber-400'
                                    }`}>
                                      <AlertTriangle className="h-3 w-3" />
                                      {stockStatus.status === 'unavailable' && 'Produk tidak tersedia'}
                                      {stockStatus.status === 'out' && 'Stok habis'}
                                      {stockStatus.status === 'low' && `Stok tersisa ${stockStatus.stock}`}
                                    </div>
                                  )}

                                  <div className="flex items-center justify-between mt-2">
                                    <div className="flex items-center gap-2 rounded-xl bg-web3-accent-cyan/10 border border-web3-accent-cyan/30 p-1">
                                      <button
                                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                        className="rounded-lg p-1 hover:bg-web3-accent-cyan/20 text-web3-accent-cyan transition-all"
                                      >
                                        <Minus className="h-3.5 w-3.5" />
                                      </button>
                                      <span className="min-w-[1.5rem] text-center text-sm font-bold text-web3-text-primary">{item.quantity}</span>
                                      <button
                                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                        className="rounded-lg p-1 hover:bg-web3-accent-cyan/20 text-web3-accent-cyan transition-all"
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
                          );
                        })}
                      </div>
                    )}
                  </>
                )}

                {step === 'form' && (
                  <form id="checkout-form" onSubmit={handleCheckout} className="space-y-6">
                    {/* Selected Items Summary */}
                    <div className="rounded-xl bg-white/5 border border-white/10 p-4">
                      <h4 className="text-sm font-bold text-web3-text-secondary mb-3">Item yang Dibayar ({selectedItems.length})</h4>
                      <div className="space-y-2">
                        {selectedItems.map(item => (
                          <div key={item.id} className="flex justify-between text-sm">
                            <span className="text-white truncate flex-1 mr-4">{item.name} x{item.quantity}</span>
                            <span className="text-web3-accent-cyan font-bold">{formatIDR(item.price * item.quantity)}</span>
                          </div>
                        ))}
                      </div>
                      <div className="mt-3 pt-3 border-t border-white/10 flex justify-between">
                        <span className="font-bold text-white">Total</span>
                        <span className="font-bold gradient-text">{formatIDR(selectedTotal)}</span>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-lg font-bold text-white">Info Kontak</h3>
                      <div>
                        <label className="mb-2 block text-sm font-semibold text-web3-text-primary">Alamat Email</label>
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full rounded-xl border border-white/10 bg-white/5 p-3.5 text-white placeholder-web3-text-muted focus:border-web3-accent-cyan focus:outline-none focus:ring-2 focus:ring-web3-accent-cyan/20 transition-all"
                          placeholder="email@anda.com"
                        />
                      </div>

                      {requiresUsername ? (
                        <div>
                          <label className="mb-2 block text-sm font-semibold text-web3-text-primary">Username Roblox</label>
                          <input
                            type="text"
                            required
                            value={robloxUsername}
                            onChange={(e) => setRobloxUsername(e.target.value)}
                            className="w-full rounded-xl border border-white/10 bg-white/5 p-3.5 text-white placeholder-web3-text-muted focus:border-web3-accent-cyan focus:outline-none focus:ring-2 focus:ring-web3-accent-cyan/20 transition-all"
                            placeholder="UsernameRobloxAnda"
                          />
                        </div>
                      ) : (
                        <div className="rounded-xl bg-gradient-to-r from-web3-accent-cyan/10 to-web3-accent-purple/10 border border-web3-accent-cyan/20 p-4 text-sm text-web3-accent-cyan">
                          ✓ Username Roblox tidak diperlukan untuk pembelian Akun.
                        </div>
                      )}
                    </div>

                    {error && (
                      <div className="rounded-xl bg-red-500/10 border border-red-500/30 p-4 text-sm text-red-400">
                        {error}
                      </div>
                    )}
                  </form>
                )}

                {step === 'success' && invoiceData && (
                  <div className="flex h-full flex-col items-center justify-center text-center space-y-6">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", duration: 0.5 }}
                      className="rounded-2xl bg-gradient-to-br from-web3-accent-green/20 to-web3-accent-cyan/20 p-8 border border-web3-accent-green/30 shadow-glow-green"
                    >
                      <CheckCircle className="h-16 w-16 text-web3-accent-green mx-auto" />
                    </motion.div>

                    <div>
                      <h3 className="text-3xl font-bold gradient-text">Pesanan Dibuat!</h3>
                      <p className="text-web3-text-secondary">Pesanan Anda telah dicatat.</p>
                    </div>

                    <div className="w-full space-y-4 glass-card rounded-2xl p-6 text-left border border-white/10">
                      <div>
                        <p className="text-xs text-web3-text-secondary uppercase tracking-wide mb-1">Status</p>
                        <p className="font-mono text-xl font-bold text-web3-accent-cyan">Menunggu Diproses</p>
                      </div>

                      <div className="h-px bg-white/10"></div>

                      <div className="flex justify-between">
                        <span className="text-sm text-gray-400">Cek Email</span>
                        <span className="text-sm font-bold text-white">{email}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer Actions */}
              {((step === 'cart' && items.length > 0) || step === 'form') && (
                <div className="border-t border-white/10 bg-gradient-to-r from-web3-accent-cyan/5 to-web3-accent-purple/5 p-6 backdrop-blur-xl">
                  {step === 'cart' && (
                    <div className="mb-4 flex items-center justify-between text-xl">
                      <span className="font-semibold text-web3-text-primary">
                        Total ({selectedIds.size} item{selectedIds.size !== 1 ? 's' : ''})
                      </span>
                      <span className="font-bold gradient-text text-2xl">{formatIDR(selectedTotal)}</span>
                    </div>
                  )}
                  {step === 'cart' ? (
                    <button
                      onClick={() => setStep('form')}
                      disabled={selectedIds.size === 0}
                      className="relative w-full rounded-xl bg-gradient-to-r from-web3-accent-cyan to-web3-accent-purple py-4 font-bold text-white transition-all hover:scale-105 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 border-2 border-web3-accent-cyan/50 hover:border-web3-accent-cyan overflow-hidden group"
                    >
                      <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></span>
                      <span className="relative">
                        {selectedIds.size === 0 ? 'Pilih item untuk dibayar' : `Bayar (${selectedIds.size} item)`}
                      </span>
                    </button>
                  ) : (
                    <button
                      type="submit"
                      form="checkout-form"
                      disabled={loading}
                      className="relative w-full rounded-xl bg-gradient-to-r from-web3-accent-green to-web3-accent-cyan py-4 font-bold text-white transition-all hover:scale-105 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 border-2 border-web3-accent-green/50 hover:border-web3-accent-green overflow-hidden group"
                    >
                      <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></span>
                      <span className="relative">{loading ? 'Memproses...' : 'Konfirmasi Pesanan'}</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </React.Fragment>
      )}
    </AnimatePresence>
  );
}
