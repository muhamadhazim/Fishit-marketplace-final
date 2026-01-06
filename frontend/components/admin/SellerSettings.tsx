"use client";
import { useState, useEffect } from "react";
import api from "@/lib/api";
import { Save, University, User, Mail, Lock, AlertTriangle, Check } from "lucide-react";
import { useAuth } from "@/store/auth";
import { useToast } from "@/components/ui/Toast";

export default function SellerSettings() {
  const user = useAuth((s) => s.user);
  const setUser = useAuth((s) => s.setUser);
  const toast = useToast();

  // Separate state for each form
  const [profileData, setProfileData] = useState({
    username: user?.username || "",
    email: user?.email || "",
    password: "",
    confirm_password: "",
    current_password: ""
  });

  const [bankData, setBankData] = useState({
    bank_name: user?.bank_details?.bank_name || "",
    account_number: user?.bank_details?.account_number || "",
    account_holder: user?.bank_details?.account_holder || ""
  });

  const [profileLoading, setProfileLoading] = useState(false);
  const [bankLoading, setBankLoading] = useState(false);

  // Email validation
  const isEmailValid = !profileData.email || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profileData.email);

  // Password strength validation
  const passwordValidation = {
    minLength: profileData.password.length >= 8,
    hasLetter: /[a-zA-Z]/.test(profileData.password),
    hasNumber: /[0-9]/.test(profileData.password),
    hasSymbol: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(profileData.password)
  };
  const isPasswordValid = !profileData.password || (passwordValidation.minLength && passwordValidation.hasLetter && passwordValidation.hasNumber && passwordValidation.hasSymbol);

  // Sync with user data if it loads late
  useEffect(() => {
    if (user) {
      setProfileData(prev => ({
        ...prev,
        username: user.username || "",
        email: user.email || ""
      }));
      setBankData({
        bank_name: user.bank_details?.bank_name || "",
        account_number: user.bank_details?.account_number || "",
        account_holder: user.bank_details?.account_holder || ""
      });
    }
  }, [user]);

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProfileData({ ...profileData, [e.target.name]: e.target.value });
  };

  const handleBankChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBankData({ ...bankData, [e.target.name]: e.target.value });
  };

  // Save Profile (username, email, password)
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!profileData.current_password) {
      toast.error("Password Required", "Masukkan password saat ini untuk konfirmasi.");
      return;
    }

    // Validate email
    if (profileData.email && !isEmailValid) {
      toast.error("Email Invalid", "Format email tidak valid.");
      return;
    }

    // Validate new password match
    if (profileData.password && profileData.password !== profileData.confirm_password) {
      toast.error("Password Mismatch", "Password baru dan konfirmasi tidak cocok.");
      return;
    }

    // Validate password length
    if (profileData.password && !isPasswordValid) {
      toast.error("Password Lemah", "Password harus minimal 8 karakter, mengandung huruf, angka, dan simbol.");
      return;
    }

    setProfileLoading(true);
    try {
      const payload: any = {
        current_password: profileData.current_password
      };

      // Only send changed fields
      if (profileData.username !== user?.username) {
        payload.username = profileData.username;
      }
      if (profileData.email !== user?.email) {
        payload.email = profileData.email;
      }
      if (profileData.password) {
        payload.password = profileData.password;
      }

      const res = await api.put("/api/users/profile", payload);

      // Update local store
      if (res.data.user) {
        setUser(res.data.user);
      }

      // Clear password fields
      setProfileData(prev => ({ ...prev, password: "", confirm_password: "", current_password: "" }));

      toast.success("Profile Updated", "Username, email, dan password berhasil diupdate.");
    } catch (e: any) {
      toast.error("Update Failed", e.response?.data?.error || "Gagal update profile.");
    } finally {
      setProfileLoading(false);
    }
  };

  // Save Bank Details
  const handleSaveBank = async (e: React.FormEvent) => {
    e.preventDefault();

    setBankLoading(true);
    try {
      const payload = {
        bank_details: {
          bank_name: bankData.bank_name,
          account_number: bankData.account_number,
          account_holder: bankData.account_holder
        }
      };

      const res = await api.put("/api/users/profile", payload);

      // Update local store
      if (res.data.user) {
        setUser(res.data.user);
      }

      toast.success("Bank Updated", "Informasi bank/e-wallet berhasil disimpan.");
    } catch (e: any) {
      toast.error("Update Failed", e.response?.data?.error || "Gagal update bank.");
    } finally {
      setBankLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">

      {/* Bank/Payout Section - No password required */}
      <form onSubmit={handleSaveBank} className="glass-card p-8 rounded-2xl border border-white/10">
        <div className="flex items-center gap-4 mb-8">
          <div className="p-4 rounded-xl bg-web3-accent-purple/20 text-web3-accent-purple">
            <University className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Pengaturan Pembayaran</h2>
            <p className="text-web3-text-secondary">Informasi rekening untuk pencairan dana</p>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <label className="text-sm font-semibold mb-2 block text-web3-text-primary">Nama Bank / E-Wallet</label>
            <input
              name="bank_name"
              value={bankData.bank_name}
              onChange={handleBankChange}
              placeholder="e.g. BCA, Mandiri, GoPay, OVO"
              className="w-full rounded-xl bg-white/5 border border-white/10 p-3 text-white focus:border-web3-accent-purple focus:ring-1 focus:ring-web3-accent-purple/20 transition-all placeholder:text-web3-text-muted"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-sm font-semibold mb-2 block text-web3-text-primary">Nomor Rekening</label>
              <input
                name="account_number"
                value={bankData.account_number}
                onChange={handleBankChange}
                placeholder="1234567890"
                className="w-full rounded-xl bg-white/5 border border-white/10 p-3 text-white focus:border-web3-accent-purple focus:ring-1 focus:ring-web3-accent-purple/20 transition-all placeholder:text-web3-text-muted"
              />
            </div>
            <div>
              <label className="text-sm font-semibold mb-2 block text-web3-text-primary">Nama Pemilik Rekening</label>
              <input
                name="account_holder"
                value={bankData.account_holder}
                onChange={handleBankChange}
                placeholder="Nama sesuai rekening"
                className="w-full rounded-xl bg-white/5 border border-white/10 p-3 text-white focus:border-web3-accent-purple focus:ring-1 focus:ring-web3-accent-purple/20 transition-all placeholder:text-web3-text-muted"
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={bankLoading}
          className="mt-6 w-full py-3 bg-gradient-to-r from-web3-accent-purple to-purple-600 hover:from-purple-600 hover:to-web3-accent-purple rounded-xl font-bold shadow-lg hover:shadow-web3-accent-purple/25 transition-all flex justify-center items-center gap-2 disabled:opacity-50"
        >
          {bankLoading ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Menyimpan...
            </>
          ) : (
            <>
              <Check className="w-5 h-5" />
              Simpan Informasi Bank
            </>
          )}
        </button>
      </form>

      {/* Profile Section - Password required */}
      <form onSubmit={handleSaveProfile} className="glass-card p-8 rounded-2xl border border-white/10">
        <div className="flex items-center gap-4 mb-8">
          <div className="p-4 rounded-xl bg-web3-accent-cyan/20 text-web3-accent-cyan">
            <User className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Pengaturan Akun</h2>
            <p className="text-web3-text-secondary">Update username, email, atau password</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="text-sm font-semibold mb-2 block flex items-center gap-2 text-web3-text-primary">
              <User className="w-4 h-4 text-web3-accent-cyan" /> Username
            </label>
            <input
              name="username"
              value={profileData.username}
              onChange={handleProfileChange}
              className="w-full rounded-xl bg-white/5 border border-white/10 p-3 text-white focus:border-web3-accent-cyan focus:ring-1 focus:ring-web3-accent-cyan/20 transition-all placeholder:text-web3-text-muted"
            />
          </div>
          <div>
            <label className="text-sm font-semibold mb-2 block flex items-center gap-2 text-web3-text-primary">
              <Mail className="w-4 h-4 text-web3-accent-cyan" /> Email
            </label>
            <input
              name="email"
              type="email"
              value={profileData.email}
              onChange={handleProfileChange}
              className={`w-full rounded-xl bg-white/5 border p-3 text-white transition-all placeholder:text-web3-text-muted ${
                profileData.email && !isEmailValid
                  ? 'border-red-500/50 focus:border-red-500'
                  : 'border-white/10 focus:border-web3-accent-cyan focus:ring-1 focus:ring-web3-accent-cyan/20'
              }`}
            />
            {profileData.email && !isEmailValid && (
              <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> Email harus mengandung @
              </p>
            )}
          </div>
          <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-sm font-semibold mb-2 block flex items-center gap-2 text-web3-text-primary">
                <Lock className="w-4 h-4 text-web3-accent-cyan" /> Password Baru
              </label>
              <input
                name="password"
                type="password"
                value={profileData.password}
                onChange={handleProfileChange}
                placeholder="Kosongkan jika tidak ganti"
                className={`w-full rounded-xl bg-white/5 border p-3 text-white transition-all placeholder:text-web3-text-muted ${
                  profileData.password && profileData.confirm_password && profileData.password !== profileData.confirm_password
                    ? 'border-red-500/50 focus:border-red-500'
                    : 'border-white/10 focus:border-web3-accent-cyan focus:ring-1 focus:ring-web3-accent-cyan/20'
                }`}
              />
            </div>
            <div>
              <label className="text-sm font-semibold mb-2 block flex items-center gap-2 text-web3-text-primary">
                <Lock className="w-4 h-4 text-web3-accent-cyan" /> Konfirmasi Password
              </label>
              <input
                name="confirm_password"
                type="password"
                value={profileData.confirm_password}
                onChange={handleProfileChange}
                placeholder="Ulangi password baru"
                className={`w-full rounded-xl bg-white/5 border p-3 text-white transition-all placeholder:text-web3-text-muted ${
                  profileData.password && profileData.confirm_password && profileData.password !== profileData.confirm_password
                    ? 'border-red-500/50 focus:border-red-500'
                    : 'border-white/10 focus:border-web3-accent-cyan focus:ring-1 focus:ring-web3-accent-cyan/20'
                }`}
              />
            </div>
          </div>
          {profileData.password && profileData.confirm_password && profileData.password !== profileData.confirm_password && (
            <div className="md:col-span-2 text-red-400 text-sm flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Password tidak cocok
            </div>
          )}

          {/* Password Requirements */}
          {profileData.password && (
            <div className="md:col-span-2 bg-white/5 border border-white/10 rounded-xl p-3 space-y-1">
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
        </div>

        {/* Security Confirmation */}
        <div className="mt-6 p-4 rounded-xl border border-amber-500/30 bg-amber-500/10">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-amber-200 font-medium mb-2">
                Masukkan password saat ini untuk konfirmasi perubahan
              </p>
              <input
                name="current_password"
                type="password"
                value={profileData.current_password}
                onChange={handleProfileChange}
                placeholder="Password saat ini"
                className="w-full rounded-xl bg-black/30 border border-amber-500/30 p-3 text-white focus:border-amber-500 transition-all placeholder:text-web3-text-muted"
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={profileLoading}
          className="mt-6 w-full py-3 bg-gradient-to-r from-web3-accent-cyan to-blue-600 hover:from-blue-600 hover:to-web3-accent-cyan rounded-xl font-bold shadow-lg hover:shadow-web3-accent-cyan/25 transition-all flex justify-center items-center gap-2 disabled:opacity-50"
        >
          {profileLoading ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Menyimpan...
            </>
          ) : (
            <>
              <Save className="w-5 h-5" />
              Update Akun
            </>
          )}
        </button>
      </form>

    </div>
  );
}
