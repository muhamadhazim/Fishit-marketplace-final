"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useAuth, type AuthState } from "@/store/auth";
import { LockKeyhole, ShieldCheck, RefreshCw, Mail, Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [requiresVerification, setRequiresVerification] = useState(false);
  const [unverifiedEmail, setUnverifiedEmail] = useState("");
  const [resendLoading, setResendLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  // Select both actions
  const token = useAuth((s: AuthState) => s.token);
  const setToken = useAuth((s: AuthState) => s.setToken);
  const setUser = useAuth((s: AuthState) => s.setUser);

  useEffect(() => {
    const localToken = typeof window !== "undefined" ? localStorage.getItem("jwt") : null;
    if (token || localToken) {
      router.replace("/admin/dashboard");
    }
  }, [token, router]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setRequiresVerification(false);
    setLoading(true);
    try {
      const res = await api.post("/api/auth/login", { username, password });
      const { token, user } = res.data;

      localStorage.setItem("jwt", token);
      setToken(token);
      setUser(user);

      router.push("/admin/dashboard");
    } catch (err: any) {
      const errorData = err.response?.data;
      if (errorData?.requiresVerification) {
        setRequiresVerification(true);
        setUnverifiedEmail(errorData.email || "");
        setError(errorData.error);
      } else {
        setError(errorData?.error || "Username atau password salah");
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleResendVerification() {
    if (resendCooldown > 0 || !unverifiedEmail) return;

    setResendLoading(true);
    try {
      await api.post("/api/auth/resend-verification", { email: unverifiedEmail });
      setError("Link verifikasi telah dikirim ke email Anda.");
      setRequiresVerification(false);

      // Start cooldown (60 seconds)
      setResendCooldown(60);
      const interval = setInterval(() => {
        setResendCooldown(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err: any) {
      setError(err.response?.data?.error || "Gagal mengirim ulang email");
    } finally {
      setResendLoading(false);
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
            <span className="gradient-text">Portal Partner</span>
          </h1>
          <p className="text-center text-web3-text-secondary mb-8">
            Akses aman ke dashboard
          </p>

          <form className="space-y-5" onSubmit={onSubmit}>
            <label className="block">
              <span className="text-sm font-semibold text-web3-text-primary mb-2 block">Username atau Email</span>
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3.5 text-white placeholder-web3-text-muted focus:border-web3-accent-cyan focus:outline-none focus:ring-2 focus:ring-web3-accent-cyan/20 transition-all"
                placeholder="Masukkan username atau email"
                required
              />
            </label>

            <label className="block">
              <span className="text-sm font-semibold text-web3-text-primary mb-2 block">Password</span>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3.5 text-white placeholder-web3-text-muted focus:border-web3-accent-cyan focus:outline-none focus:ring-2 focus:ring-web3-accent-cyan/20 transition-all pr-12"
                  placeholder="Masukkan password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-web3-text-secondary hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </label>

            {error && (
              <div className={`rounded-xl p-4 text-sm ${requiresVerification ? 'bg-amber-500/10 border border-amber-500/30 text-amber-400' : 'bg-red-500/10 border border-red-500/30 text-red-400'}`}>
                <div className="flex items-start gap-2">
                  {requiresVerification && <Mail className="w-5 h-5 mt-0.5 flex-shrink-0" />}
                  <div className="flex-1">
                    <p>{error}</p>
                    {requiresVerification && (
                      <button
                        onClick={handleResendVerification}
                        disabled={resendLoading || resendCooldown > 0}
                        className="mt-3 flex items-center gap-2 text-amber-300 hover:text-amber-200 font-medium transition-colors disabled:opacity-50"
                      >
                        <RefreshCw className={`w-4 h-4 ${resendLoading ? 'animate-spin' : ''}`} />
                        {resendCooldown > 0
                          ? `Kirim Ulang (${resendCooldown}s)`
                          : resendLoading
                            ? "Mengirim..."
                            : "Kirim Ulang Link Verifikasi"
                        }
                      </button>
                    )}
                  </div>
                </div>
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
                {loading ? "Sedang Masuk..." : "Masuk"}
              </span>
            </button>
          </form>

          <div className="mt-8 text-center border-t border-white/10 pt-6">
            <p className="text-sm text-web3-text-secondary">
              Belum punya akun?{" "}
              <a href="/admin/register" className="text-web3-accent-cyan font-bold hover:underline">
                Daftar sebagai Penjual
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
