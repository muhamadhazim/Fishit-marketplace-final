"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { ShieldCheck, UserPlus, ArrowLeft, Eye, EyeOff, AlertCircle, Mail, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/components/ui/Toast";

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const router = useRouter();
  const toast = useToast();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
        setError("Password tidak cocok");
        return;
    }
    if (!isEmailValid) {
        setError("Format email tidak valid");
        return;
    }
    if (!isPasswordValid) {
        setError("Password harus minimal 8 karakter, mengandung huruf, angka, dan simbol");
        return;
    }
    setError(null);
    setLoading(true);

    try {
      const response = await api.post("/api/auth/register", {
          username: formData.username,
          email: formData.email,
          password: formData.password
      });

      // Check if requires verification
      if (response.data.requiresVerification) {
        setRegistrationSuccess(true);
      } else {
        toast.success("Registrasi Berhasil", "Silakan login dengan akun baru Anda.");
        router.push("/admin/login");
      }
    } catch (err: any) {
      setError(err.response?.data?.error || "Registrasi gagal");
    } finally {
      setLoading(false);
    }
  }

  async function handleResendVerification() {
    if (resendCooldown > 0) return;

    setResendLoading(true);
    try {
      await api.post("/api/auth/resend-verification", { email: formData.email });
      toast.success("Email Terkirim", "Link verifikasi telah dikirim ulang.");

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
      toast.error("Gagal", err.response?.data?.error || "Gagal mengirim ulang email");
    } finally {
      setResendLoading(false);
    }
  }

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const passwordsMatch = !formData.confirmPassword || formData.password === formData.confirmPassword;

  // Email validation
  const isEmailValid = !formData.email || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email);

  // Password strength validation
  const passwordValidation = {
    minLength: formData.password.length >= 8,
    hasLetter: /[a-zA-Z]/.test(formData.password),
    hasNumber: /[0-9]/.test(formData.password),
    hasSymbol: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(formData.password)
  };
  const isPasswordValid = passwordValidation.minLength && passwordValidation.hasLetter && passwordValidation.hasNumber && passwordValidation.hasSymbol;

  // Show success screen after registration
  if (registrationSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden py-12 px-6">
        <div className="orb-cyan top-20 left-20 opacity-60" style={{ animationDelay: '0s' }} />
        <div className="orb-purple bottom-20 right-20 opacity-60" style={{ animationDelay: '2s' }} />

        <div className="relative z-10 w-full max-w-md">
          <div className="glass-card rounded-3xl p-10 border-2 border-white/10 animate-slide-up text-center">
            <div className="flex justify-center mb-6">
              <div className="rounded-2xl bg-gradient-to-br from-emerald-500 to-cyan-500 p-5 shadow-glow-cyan">
                <Mail className="h-10 w-10 text-white" />
              </div>
            </div>

            <h1 className="text-3xl font-bold mb-2">
              <span className="gradient-text">Cek Email Anda!</span>
            </h1>
            <p className="text-web3-text-secondary mb-6">
              Kami telah mengirim link verifikasi ke:
            </p>
            <p className="text-cyan-400 font-semibold text-lg mb-6 break-all">
              {formData.email}
            </p>

            <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-6">
              <p className="text-sm text-web3-text-secondary">
                Klik link di email untuk mengaktifkan akun Anda. Link akan kadaluarsa dalam 24 jam.
              </p>
            </div>

            <div className="space-y-3">
              <button
                onClick={handleResendVerification}
                disabled={resendLoading || resendCooldown > 0}
                className="w-full flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/5 py-3 text-white hover:bg-white/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw className={`w-4 h-4 ${resendLoading ? 'animate-spin' : ''}`} />
                {resendCooldown > 0
                  ? `Kirim Ulang (${resendCooldown}s)`
                  : resendLoading
                    ? "Mengirim..."
                    : "Kirim Ulang Email"
                }
              </button>

              <Link
                href="/admin/login"
                className="block w-full rounded-xl bg-gradient-to-r from-web3-accent-cyan to-web3-accent-purple py-3 font-bold text-white hover:scale-105 transition-all text-center"
              >
                Kembali ke Login
              </Link>
            </div>

            <p className="text-xs text-web3-text-secondary mt-6">
              Tidak menerima email? Cek folder spam atau kirim ulang.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden py-12 px-6">
      <div className="orb-cyan top-20 left-20 opacity-60" style={{ animationDelay: '0s' }} />
      <div className="orb-purple bottom-20 right-20 opacity-60" style={{ animationDelay: '2s' }} />

      <div className="relative z-10 w-full max-w-md">
        <div className="glass-card rounded-3xl p-10 border-2 border-white/10 animate-slide-up">
          <Link href="/admin/login" className="flex items-center gap-2 text-web3-text-secondary hover:text-white mb-6 text-sm">
            <ArrowLeft className="w-4 h-4" /> Kembali ke Login
          </Link>

          <div className="flex justify-center mb-6">
            <div className="rounded-2xl bg-gradient-to-br from-web3-accent-cyan to-web3-accent-purple p-5 shadow-glow-cyan">
              <UserPlus className="h-10 w-10 text-white" />
            </div>
          </div>

          <h1 className="text-3xl font-bold text-center mb-2">
            <span className="gradient-text">Pendaftaran Partner</span>
          </h1>
          <p className="text-center text-web3-text-secondary mb-8">
            Mulai berjualan di FishIt
          </p>

          <form className="space-y-4" onSubmit={onSubmit}>
            <div>
              <input
                name="username"
                value={formData.username}
                onChange={handleChange}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white focus:border-web3-accent-cyan focus:outline-none transition-all"
                placeholder="Username"
                required
              />
            </div>
            <div>
              <input
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                className={`w-full rounded-xl border bg-white/5 px-4 py-3 text-white focus:outline-none transition-all ${
                  formData.email && !isEmailValid
                    ? 'border-red-500/50 focus:border-red-500'
                    : 'border-white/10 focus:border-web3-accent-cyan'
                }`}
                placeholder="Alamat Email"
                required
              />
              {formData.email && !isEmailValid && (
                <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> Email harus mengandung @
                </p>
              )}
            </div>
            <div className="relative">
              <input
                name="password"
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={handleChange}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white focus:border-web3-accent-cyan focus:outline-none transition-all pr-12"
                placeholder="Password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-web3-text-secondary hover:text-white transition-colors"
              >
                  {showPassword ? <EyeOff className="w-5 h-5"/> : <Eye className="w-5 h-5"/>}
              </button>
            </div>

            {/* Password Requirements */}
            {formData.password && (
              <div className="bg-white/5 border border-white/10 rounded-xl p-3 space-y-1">
                <p className="text-xs text-web3-text-secondary mb-2">Password harus memenuhi:</p>
                <div className={`text-xs flex items-center gap-2 ${passwordValidation.minLength ? 'text-web3-accent-green' : 'text-red-400'}`}>
                  {passwordValidation.minLength ? '✓' : '✗'} Minimal 8 karakter
                </div>
                <div className={`text-xs flex items-center gap-2 ${passwordValidation.hasLetter ? 'text-web3-accent-green' : 'text-red-400'}`}>
                  {passwordValidation.hasLetter ? '✓' : '✗'} Mengandung huruf (a-z, A-Z)
                </div>
                <div className={`text-xs flex items-center gap-2 ${passwordValidation.hasNumber ? 'text-web3-accent-green' : 'text-red-400'}`}>
                  {passwordValidation.hasNumber ? '✓' : '✗'} Mengandung angka (0-9)
                </div>
                <div className={`text-xs flex items-center gap-2 ${passwordValidation.hasSymbol ? 'text-web3-accent-green' : 'text-red-400'}`}>
                  {passwordValidation.hasSymbol ? '✓' : '✗'} Mengandung simbol (!@#$%^&* dll)
                </div>
              </div>
            )}
            <div className="relative">
              <input
                name="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                value={formData.confirmPassword}
                onChange={handleChange}
                className={`w-full rounded-xl border bg-white/5 px-4 py-3 text-white focus:outline-none transition-all pr-12 ${
                    !passwordsMatch ? 'border-red-500/50 focus:border-red-500' : 'border-white/10 focus:border-web3-accent-cyan'
                }`}
                placeholder="Konfirmasi Password"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-web3-text-secondary hover:text-white transition-colors"
              >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5"/> : <Eye className="w-5 h-5"/>}
              </button>
            </div>

            {!passwordsMatch && (
                 <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 p-3 rounded-xl border border-red-500/20 animate-pulse">
                     <AlertCircle className="w-4 h-4" />
                     Password tidak cocok
                 </div>
            )}

            {error && (
              <div className="rounded-xl bg-red-500/10 border border-red-500/30 p-3 text-sm text-red-400">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="w-full rounded-xl bg-gradient-to-r from-web3-accent-cyan to-web3-accent-purple py-3.5 font-bold text-white hover:scale-105 transition-all border-2 border-web3-accent-cyan/50 mt-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              disabled={loading || !passwordsMatch || !isPasswordValid || !isEmailValid}
            >
              {loading ? "Membuat Akun..." : "Daftar Sekarang"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
