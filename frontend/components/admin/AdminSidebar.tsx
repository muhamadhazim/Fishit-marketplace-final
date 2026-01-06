"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Package, LogOut } from "lucide-react";
import { useAuth } from "@/store/auth";

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const setToken = useAuth((s) => s.setToken);
  const user = useAuth((s) => s.user);

  function logout() {
    localStorage.removeItem("jwt");
    setToken(null);
    router.replace("/admin/login");
  }

  const isActive = (path: string) => pathname === path || pathname.startsWith(path + "/");

  return (
    <aside className="glass-card rounded-2xl p-6 border border-white/10 h-fit lg:sticky lg:top-24 backdrop-blur-xl self-start">
      <h2 className="text-xl font-bold gradient-text mb-6">{user?.role === 'admin' ? 'Admin Panel' : 'Seller Panel'}</h2>
      
      <nav className="space-y-2">
        <Link
          href="/admin/dashboard"
          className={`
            flex w-full items-center gap-3 px-4 py-3.5 rounded-xl font-semibold
            transition-all duration-300
            ${isActive("/admin/dashboard")
              ? 'bg-gradient-to-r from-web3-accent-cyan/20 to-web3-accent-purple/20 text-white shadow-glow-cyan border-2 border-web3-accent-cyan/50'
              : 'text-web3-text-secondary hover:bg-white/5 hover:text-white border-2 border-transparent hover:border-white/10'
            }
          `}
        >
          <LayoutDashboard className={`h-5 w-5 ${isActive("/admin/dashboard") ? 'text-web3-accent-cyan' : ''}`} />
          <span>{user?.role === 'admin' ? 'Dashboard' : 'Transactions'}</span>
        </Link>

        {['admin', 'seller'].includes(user?.role || '') && (
          <Link
            href="/admin/products"
            className={`
              flex w-full items-center gap-3 px-4 py-3.5 rounded-xl font-semibold
              transition-all duration-300
              ${isActive("/admin/products")
                ? 'bg-gradient-to-r from-web3-accent-cyan/20 to-web3-accent-purple/20 text-white shadow-glow-cyan border-2 border-web3-accent-cyan/50'
                : 'text-web3-text-secondary hover:bg-white/5 hover:text-white border-2 border-transparent hover:border-white/10'
              }
            `}
          >
            <Package className={`h-5 w-5 ${isActive("/admin/products") ? 'text-web3-accent-cyan' : ''}`} />
            <span>Product Manager</span>
          </Link>
        )}

        <div className="pt-4 mt-4 border-t border-white/10">
          <button
            onClick={logout}
            className="flex w-full items-center gap-3 px-4 py-3.5 rounded-xl font-semibold text-web3-text-secondary hover:bg-red-500/10 hover:text-red-400 transition-all border-2 border-transparent hover:border-red-500/30"
          >
            <LogOut className="h-5 w-5" />
            <span>Logout</span>
          </button>
        </div>
      </nav>
    </aside>
  );
}
