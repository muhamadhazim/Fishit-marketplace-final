"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useAuth, type AuthState } from "@/store/auth";
import { LockKeyhole, ShieldCheck } from "lucide-react";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const setToken = useAuth((s: AuthState) => s.setToken);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await api.post("/api/auth/login", { username, password });
      const token = res.data.token as string;
      localStorage.setItem("jwt", token);
      setToken(token);
      router.push("/admin/dashboard");
    } catch {
      setError("Invalid credentials");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden py-12 px-6">
      {/* Animated Gradient Orbs */}
      <div className="orb-cyan top-20 left-20 opacity-60" style={{ animationDelay: '0s' }} />
      <div className="orb-purple bottom-20 right-20 opacity-60" style={{ animationDelay: '2s' }} />

      {/* Login Card */}
      <div className="relative z-10 w-full max-w-md">
        <div className="glass-card rounded-3xl p-10 border-2 border-white/10 animate-slide-up">
          {/* Logo/Icon */}
          <div className="flex justify-center mb-8">
            <div className="rounded-2xl bg-gradient-to-br from-web3-accent-cyan to-web3-accent-purple p-5 shadow-glow-cyan">
              <ShieldCheck className="h-12 w-12 text-white" />
            </div>
          </div>

          <h1 className="text-3xl font-bold text-center mb-2">
            <span className="gradient-text">Admin Portal</span>
          </h1>
          <p className="text-center text-web3-text-secondary mb-8">
            Secure access to dashboard
          </p>

          <form className="space-y-5" onSubmit={onSubmit}>
            <label className="block">
              <span className="text-sm font-semibold text-web3-text-primary mb-2 block">Username</span>
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3.5 text-white placeholder-web3-text-muted focus:border-web3-accent-cyan focus:outline-none focus:ring-2 focus:ring-web3-accent-cyan/20 transition-all"
                placeholder="Enter your username"
                required
              />
            </label>

            <label className="block">
              <span className="text-sm font-semibold text-web3-text-primary mb-2 block">Password</span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3.5 text-white placeholder-web3-text-muted focus:border-web3-accent-cyan focus:outline-none focus:ring-2 focus:ring-web3-accent-cyan/20 transition-all"
                placeholder="Enter your password"
                required
              />
            </label>

            {error && (
              <div className="rounded-xl bg-red-500/10 border border-red-500/30 p-4 text-sm text-red-400">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="relative w-full rounded-xl bg-gradient-to-r from-web3-accent-cyan to-web3-accent-purple py-4 font-bold text-white transition-all hover:scale-105 active:scale-[0.98] hover:shadow-glow-cyan border-2 border-web3-accent-cyan/50 hover:border-web3-accent-cyan overflow-hidden group disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></span>
              <span className="relative inline-flex items-center gap-2">
                <LockKeyhole className="h-5 w-5" />
                {loading ? "Signing in..." : "Sign In"}
              </span>
            </button>
          </form>

          <p className="text-center text-xs text-web3-text-muted mt-6">
            Protected by enterprise-grade security
          </p>
        </div>
      </div>
    </div>
  );
}
