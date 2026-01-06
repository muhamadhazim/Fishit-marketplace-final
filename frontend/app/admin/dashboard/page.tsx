"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth, type AuthState } from "@/store/auth";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminDashboard from "@/components/admin/AdminDashboard";
import SellerDashboard from "@/components/admin/SellerDashboard";

export default function DashboardPage() {
  const router = useRouter();
  const token = useAuth((s: AuthState) => s.token);
  const user = useAuth((s: AuthState) => s.user);
  const fetchUser = useAuth((s: AuthState) => s.fetchUser);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function init() {
        const localToken = typeof window !== "undefined" ? localStorage.getItem("jwt") : null;
        
        if (!token && !localToken) {
            router.replace("/admin/login");
            return;
        }

        if (!token && localToken) {
           useAuth.getState().setToken(localToken);
        }
        
        if (!user) {
            await fetchUser();
        }
        setLoading(false);
    }
    init();
  }, [router, token, user, fetchUser]);

  if (loading) {
      return <div className="min-h-screen flex items-center justify-center text-white">Loading...</div>;
  }

  if (!user) {
     return (
        <div className="min-h-screen flex flex-col items-center justify-center text-white">
            <p className="mb-4">Session expired or user data missing.</p>
            <button onClick={() => router.push('/admin/login')} className="px-4 py-2 bg-web3-accent-cyan rounded-lg text-black font-bold">
                Relogin
            </button>
        </div>
     );
  }

  return (
    <div className="mx-auto max-w-7xl p-6">
       <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-8">
         <AdminSidebar />
         
         <main>
           <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
             <div>
               <h1 className="text-3xl font-bold mb-2">
                 <span className="gradient-text">
                   {user.role === 'admin' ? 'Admin Control Center' : 'Seller Dashboard'}
                 </span>
               </h1>
               <p className="text-web3-text-secondary">
                 Welcome back, <span className="text-white font-semibold">{user.username}</span>
               </p>
             </div>
             {/* Date Range Picker can be added here */}
           </header>

           {user.role === 'admin' ? <AdminDashboard /> : <SellerDashboard />}
         </main>
       </div>
    </div>
  );
}
