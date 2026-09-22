import { useState } from "react";
import { Shield, Eye, EyeOff, ChevronLeft, RefreshCw } from "lucide-react";
import { View } from "../app/types";
import { api, ApiError } from "../app/api";

export function RegisterPage({ setView, setOtpData }: { setView: (v: View) => void; setOtpData: (d: { email: string; name: string }) => void }) {
  const [showPw, setShowPw] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [pw, setPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [agree, setAgree] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const strength = () => {
    if (!pw) return 0;
    let s = 0;
    if (pw.length >= 8) s++;
    if (/[A-Z]/.test(pw)) s++;
    if (/[0-9]/.test(pw)) s++;
    if (/[^A-Za-z0-9]/.test(pw)) s++;
    return s;
  };
  const str = strength();
  const strColors = ["bg-red-400", "bg-orange-400", "bg-yellow-400", "bg-emerald-500"];
  const strLabels = ["Lemah", "Cukup", "Baik", "Kuat"];

  const handleSubmit = async () => {
    if (!email || !name || !phone || !agree || pw !== confirmPw) {
      if (pw !== confirmPw) setError("Konfirmasi password tidak sama.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const response = await api.register({ name, email, phone, password: pw, password_confirmation: confirmPw });
      setOtpData(response.data);
      setView("otp");
    } catch (e) {
      setError(e instanceof ApiError ? e.firstValidationMessage() : "Registrasi gagal diproses.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-10" style={{ fontFamily: "'Inter', sans-serif" }}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center mx-auto mb-5 shadow-xl shadow-primary/25">
            <Shield className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-extrabold text-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Buat Akun Baru</h1>
          <p className="text-sm text-muted-foreground mt-1">Daftar untuk mengakses layanan perizinan digital</p>
        </div>

        <div className="bg-white rounded-2xl border border-border p-6 space-y-4 shadow-sm">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-foreground">Nama Lengkap <span className="text-red-500">*</span></label>
            <input type="text" placeholder="Nama sesuai KTP" value={name} onChange={e => setName(e.target.value)} className="h-10 px-3 rounded-lg border border-border text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/25 focus:border-accent transition-all" />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-foreground">Email <span className="text-red-500">*</span></label>
            <input type="email" placeholder="nama@email.com" value={email} onChange={e => setEmail(e.target.value)} className="h-10 px-3 rounded-lg border border-border text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/25 focus:border-accent transition-all" />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-foreground">Nomor HP <span className="text-red-500">*</span></label>
            <input type="tel" placeholder="081234567890" value={phone} onChange={e => setPhone(e.target.value.replace(/[\s-]/g, ""))} className="h-10 px-3 rounded-lg border border-border text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/25 focus:border-accent transition-all" />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-foreground">Password <span className="text-red-500">*</span></label>
            <div className="relative">
              <input type={showPw ? "text" : "password"} placeholder="Min. 8 karakter" value={pw} onChange={e => setPw(e.target.value)} className="h-10 w-full px-3 pr-10 rounded-lg border border-border text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/25 focus:border-accent transition-all" />
              <button onClick={() => setShowPw(!showPw)} className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground transition-colors">
                {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {pw.length > 0 && (
              <div>
                <div className="flex gap-1 mt-1 mb-1">
                  {[0, 1, 2, 3].map(i => (
                    <div key={i} className={`flex-1 h-1.5 rounded-full transition-all ${i < str ? strColors[str - 1] : "bg-muted"}`} />
                  ))}
                </div>
                <div className="text-[11px] text-muted-foreground">Kekuatan: <span className={`font-semibold ${str >= 3 ? "text-emerald-600" : str >= 2 ? "text-amber-600" : "text-red-500"}`}>{strLabels[str - 1] ?? "Sangat Lemah"}</span></div>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-foreground">Konfirmasi Password <span className="text-red-500">*</span></label>
            <input type="password" placeholder="Ulangi password Anda" value={confirmPw} onChange={e => setConfirmPw(e.target.value)} className="h-10 px-3 rounded-lg border border-border text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/25 focus:border-accent transition-all" />
          </div>

          {error && <div className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2.5">{error}</div>}

          <label className="flex items-start gap-2.5 cursor-pointer">
            <input type="checkbox" checked={agree} onChange={e => setAgree(e.target.checked)} className="w-4 h-4 mt-0.5 rounded border-border flex-shrink-0 accent-accent" />
            <span className="text-xs text-muted-foreground leading-relaxed">
              Saya menyetujui{" "}
              <button className="text-accent underline hover:text-blue-700" onClick={e => e.preventDefault()}>Syarat & Ketentuan</button>
              {" "}dan{" "}
              <button className="text-accent underline hover:text-blue-700" onClick={e => e.preventDefault()}>Kebijakan Privasi</button>
              {" "}Digital Service Journey
            </span>
          </label>

          <button
            onClick={handleSubmit}
            disabled={loading || !agree || !email || !name || !phone || !pw || !confirmPw}
            className="w-full h-10 bg-primary text-primary-foreground rounded-lg font-bold text-sm hover:bg-primary/90 disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-md shadow-primary/20"
          >
            {loading && <RefreshCw className="h-4 w-4 animate-spin" />}
            {loading ? "Mendaftarkan..." : "Daftar & Verifikasi Email"}
          </button>

          <p className="text-center text-sm text-muted-foreground">
            Sudah punya akun?{" "}
            <button onClick={() => setView("login")} className="text-accent font-bold hover:text-blue-700 transition-colors">
              Masuk
            </button>
          </p>
        </div>

        <button onClick={() => setView("home")} className="w-full mt-5 text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center gap-1.5">
          <ChevronLeft className="h-4 w-4" /> Kembali ke Beranda
        </button>
      </div>
    </div>
  );
}
