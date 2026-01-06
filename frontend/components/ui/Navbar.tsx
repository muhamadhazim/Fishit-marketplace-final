
"use client";
import Link from "next/link";
import { useAuth, AuthState } from "@/store/auth";
import { useState, useEffect } from "react";
import { ShoppingCart, Menu, X, Fish, Search, LogOut } from "lucide-react";
import CartDrawer from "./CartDrawer";
import { useCart } from "@/store/cart";

export default function Navbar() {
  const { token, setToken } = useAuth((s: AuthState) => ({
    token: s.token,
    setToken: s.setToken,
  }));
  const { items, toggleCart } = useCart();
  const [isClient, setIsClient] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  function logout() {
    localStorage.removeItem("jwt");
    setToken(null);
    window.location.href = "/admin/login";
  }

  const cartCount = items.reduce((acc, item) => acc + item.quantity, 0);

  const navLinks = [
    { name: "Produk", href: "/products" },
    { name: "Cek Pesanan", href: "/check-order" },
    { name: "Tentang", href: "/about" },
  ];

  // Check for token in localStorage on mount to ensure hydration matches
  useEffect(() => {
    const localToken = localStorage.getItem("jwt");
    if (localToken && !token) {
      setToken(localToken);
    }
  }, [token, setToken]);

  const isLoggedIn = !!token;

  return (
    <nav className="fixed top-4 left-1/2 -translate-x-1/2 w-[95%] max-w-7xl z-50 glass-navbar rounded-2xl px-6 py-3 animate-slide-down">
      <div className="flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-web3-accent-cyan to-web3-accent-purple shadow-glow-cyan transition-all group-hover:scale-110 group-hover:rotate-6">
            <Fish className="h-6 w-6 text-white" />
          </div>
          <span className="text-2xl font-extrabold tracking-tight">
            Fish<span className="gradient-text">It</span>
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className="text-sm font-medium text-web3-text-secondary transition-all hover:text-web3-accent-cyan hover:glow-cyan px-3 py-2 rounded-lg"
            >
              {link.name}
            </Link>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">

          <button 
            onClick={toggleCart}
            className="relative rounded-xl p-2.5 text-web3-text-primary transition-all hover:bg-web3-accent-cyan/20 hover:text-web3-accent-cyan hover:scale-110"
          >
            <ShoppingCart className="h-5 w-5" />
            {cartCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-r from-web3-accent-purple to-web3-accent-pink text-xs font-bold text-white shadow-glow-purple animate-glow-pulse">
                {cartCount}
              </span>
            )}
          </button>

          {isLoggedIn ? (
             <div className="flex items-center gap-3">
                <Link
                  href="/admin/dashboard"
                   className="hidden md:block rounded-xl bg-gradient-to-r from-web3-accent-cyan to-web3-accent-purple px-6 py-2.5 text-sm font-bold text-white transition-all hover:scale-105 hover:shadow-glow-cyan"
                >
                  Dashboard
                </Link>
                <button
                  onClick={logout}
                  className="rounded-xl bg-white/5 p-2.5 text-web3-text-secondary hover:bg-red-500/20 hover:text-red-400 transition-all hover:scale-110"
                >
                  <LogOut className="h-5 w-5" />
                </button>
             </div>
          ) : (
            <Link
              href="/admin/login"
              className="hidden md:block rounded-xl bg-gradient-to-r from-web3-accent-green to-web3-accent-cyan px-6 py-2.5 text-sm font-bold text-white transition-all hover:scale-105 hover:shadow-glow-green"
            >
              Masuk
            </Link>
          )}

          {/* Mobile Menu Button */}
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden rounded-xl p-2.5 text-web3-text-primary hover:bg-white/10 transition-all"
          >
            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="absolute top-full left-0 mt-4 w-full glass-card rounded-2xl p-4 flex flex-col gap-2 animate-slide-up md:hidden border border-white/10 shadow-2xl">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              onClick={() => setIsMobileMenuOpen(false)}
              className="block w-full rounded-xl px-4 py-3 text-sm font-bold text-web3-text-secondary hover:bg-white/5 hover:text-web3-accent-cyan transition-all"
            >
              {link.name}
            </Link>
          ))}
          <div className="h-px bg-white/10 my-2" />
          {isLoggedIn ? (
            <>
              <Link
                href="/admin/dashboard"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block w-full rounded-xl px-4 py-3 text-sm font-bold text-web3-text-secondary hover:bg-white/5 hover:text-web3-accent-cyan transition-all"
              >
                Dashboard
              </Link>
              <button
                onClick={() => {
                  logout();
                  setIsMobileMenuOpen(false);
                }}
                className="w-full text-left rounded-xl px-4 py-3 text-sm font-bold text-red-400 hover:bg-red-500/10 transition-all"
              >
                Keluar
              </button>
            </>
          ) : (
            <Link
              href="/admin/login"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block w-full text-center rounded-xl bg-gradient-to-r from-web3-accent-green to-web3-accent-cyan px-4 py-3 text-sm font-bold text-white shadow-glow-green"
            >
              Masuk
            </Link>
          )}
        </div>
      )}

      
      {/* Cart Drawer Component */}
      <CartDrawer />
    </nav>
  );
}
