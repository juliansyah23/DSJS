import { useState } from "react";
import { Shield, Eye, EyeOff, AlertTriangle, ChevronLeft, RefreshCw } from "lucide-react";
import { View, AuthUser } from "../app/types";
import { api, ApiError } from "../app/api";

export function LoginPage({ setView, onLogin }: { setView: (v: View) => void; onLogin: (u: AuthUser) => void }) {
  const [showPw, setShowPw] = useState(false);
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"login" | "forgot" | "reset">("login");
  const [resetCode, setResetCode] = useState("");
  const [confirmPw, setConfirmPw] = useState("");

  const handleLogin = async () => {
    setError("");
    setNotice("");
    setLoading(true);
    try {
      const user = await api.login(email, pw);
      onLogin(user);
    } catch (e) {
      if (e instanceof ApiError && e.data?.requires_verification) {
        setError(`${e.message} Silakan ulangi pendaftaran jika halaman OTP tidak tersedia.`);
      } else {
        setError(e instanceof ApiError ? e.firstValidationMessage() : "Login gagal diproses.");
      }
    } finally {
      setLoading(false);
    }
  };

  const requestReset = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await api.forgotPassword(email);
      setNotice(response.message ?? "Jika email terdaftar, kode OTP telah dikirim.");
      setMode("reset");
    } catch (e) {
      setError(e instanceof ApiError ? e.firstValidationMessage() : "Permintaan reset gagal diproses.");
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async () => {
    if (pw !== confirmPw) { setError("Konfirmasi password tidak sama."); return; }
    setLoading(true);
    setError("");
    try {
      const response = await api.resetPassword(email, resetCode, pw, confirmPw);
      setNotice(response.message ?? "Password berhasil diubah. Silakan masuk.");
      setPw("");
      setConfirmPw("");
      setResetCode("");
      setMode("login");
    } catch (e) {
      setError(e instanceof ApiError ? e.firstValidationMessage() : "Password gagal diubah.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4" style={{ fontFamily: "'Inter', sans-serif" }}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center mx-auto mb-5 shadow-xl shadow-primary/25">
            <Shield className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-extrabold text-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            {mode === "login" ? "Masuk ke DSJ" : mode === "forgot" ? "Lupa Password" : "Atur Password Baru"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">{mode === "login" ? "Digital Service Journey" : "Gunakan email akun Anda"}</p>
        </div>

        <div className="bg-white rounded-2xl border border-border p-6 space-y-4 shadow-sm">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-foreground">Alamat Email</label>
            <input
              type="email"
              placeholder="nama@email.com"
              value={email}
              onChange={e => { setEmail(e.target.value); setError(""); }}
              onKeyDown={e => e.key === "Enter" && handleLogin()}
              className="h-10 px-3 rounded-lg border border-border text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/25 focus:border-accent transition-all"
            />
          </div>

          {mode === "reset" && (
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-foreground">Kode OTP</label>
              <input type="text" inputMode="numeric" maxLength={6} placeholder="6 digit kode OTP" value={resetCode} onChange={e => setResetCode(e.target.value.replace(/\D/g, ""))} className="h-10 px-3 rounded-lg border border-border text-sm font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-accent/25 focus:border-accent" />
            </div>
          )}

          {mode !== "forgot" && <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-foreground">{mode === "reset" ? "Password Baru" : "Password"}</label>
              {mode === "login" && <button onClick={() => { setMode("forgot"); setError(""); }} className="text-xs text-accent hover:text-blue-700 font-medium transition-colors">Lupa password?</button>}
            </div>
            <div className="relative">
              <input
                type={showPw ? "text" : "password"}
                placeholder="••••••••"
                value={pw}
                onChange={e => { setPw(e.target.value); setError(""); }}
                onKeyDown={e => e.key === "Enter" && handleLogin()}
                className={`h-10 w-full px-3 pr-10 rounded-lg border text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 transition-all ${
                  error ? "border-red-400 focus:ring-red-200 focus:border-red-400" : "border-border focus:ring-accent/25 focus:border-accent"
                }`}
              />
              <button onClick={() => setShowPw(!showPw)} className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground transition-colors">
                {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>}

          {mode === "reset" && (
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-foreground">Konfirmasi Password Baru</label>
              <input type="password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)} className="h-10 px-3 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-accent/25 focus:border-accent" />
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2.5">
              <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
              {error}
            </div>
          )}
          {notice && <div className="text-xs text-emerald-700 bg-emerald-50 rounded-lg px-3 py-2.5">{notice}</div>}

          <button
            onClick={mode === "login" ? handleLogin : mode === "forgot" ? requestReset : resetPassword}
            disabled={loading || !email || (mode !== "forgot" && !pw) || (mode === "reset" && (!confirmPw || resetCode.length !== 6))}
            className="w-full h-10 bg-primary text-primary-foreground rounded-lg font-bold text-sm hover:bg-primary/90 disabled:opacity-60 transition-all flex items-center justify-center gap-2 shadow-md shadow-primary/20"
          >
            {loading && <RefreshCw className="h-4 w-4 animate-spin" />}
            {loading ? "Memproses..." : mode === "login" ? "Masuk" : mode === "forgot" ? "Kirim Kode OTP" : "Ubah Password"}
          </button>

          {mode === "login" && <div className="relative flex items-center gap-3">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted-foreground">atau</span>
            <div className="flex-1 h-px bg-border" />
          </div>}

          {mode === "login" ? <p className="text-center text-sm text-muted-foreground">
            Belum punya akun?{" "}
            <button onClick={() => setView("register")} className="text-accent font-bold hover:text-blue-700 transition-colors">
              Daftar sekarang
            </button>
          </p> : <button onClick={() => { setMode("login"); setError(""); }} className="w-full text-center text-sm text-accent font-semibold">Kembali ke halaman masuk</button>}
        </div>

        <button onClick={() => setView("home")} className="w-full mt-5 text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center gap-1.5">
          <ChevronLeft className="h-4 w-4" /> Kembali ke Beranda
        </button>
      </div>
    </div>
  );
}
