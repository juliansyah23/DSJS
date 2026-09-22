import { useState, useRef, useEffect } from "react";
import { Mail, CheckCircle, ChevronLeft, RefreshCw, Info } from "lucide-react";
import { View, AuthUser } from "../app/types";
import { api, ApiError } from "../app/api";

export function OTPPage({ setView, email, registeredName, onLogin }: { setView: (v: View) => void; email: string; registeredName: string; onLogin: (u: AuthUser) => void }) {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [timer, setTimer] = useState(60);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const r0 = useRef<HTMLInputElement>(null);
  const r1 = useRef<HTMLInputElement>(null);
  const r2 = useRef<HTMLInputElement>(null);
  const r3 = useRef<HTMLInputElement>(null);
  const r4 = useRef<HTMLInputElement>(null);
  const r5 = useRef<HTMLInputElement>(null);
  const refs = [r0, r1, r2, r3, r4, r5];

  useEffect(() => {
    if (timer <= 0) return;
    const t = setTimeout(() => setTimer(v => v - 1), 1000);
    return () => clearTimeout(t);
  }, [timer]);

  const handleInput = (i: number, v: string) => {
    if (!/^\d*$/.test(v)) return;
    const next = [...otp];
    next[i] = v.slice(-1);
    setOtp(next);
    if (v && i < 5) refs[i + 1].current?.focus();
  };

  const handleKey = (i: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[i] && i > 0) refs[i - 1].current?.focus();
  };

  const filled = otp.filter(Boolean).length;

  const verify = async () => {
    setLoading(true);
    setError("");
    try {
      const user = await api.verifyOtp(email, otp.join(""));
      onLogin(user);
    } catch (e) {
      setError(e instanceof ApiError ? e.firstValidationMessage() : "Verifikasi OTP gagal.");
    } finally {
      setLoading(false);
    }
  };

  const resend = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await api.resendOtp(email);
      setMessage(response.message ?? "Kode OTP baru telah diminta.");
      setTimer(60);
    } catch (e) {
      setError(e instanceof ApiError ? e.firstValidationMessage() : "Kode OTP gagal dikirim ulang.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4" style={{ fontFamily: "'Inter', sans-serif" }}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center mx-auto mb-5 shadow-xl shadow-primary/25">
            <Mail className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-extrabold text-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Verifikasi Email</h1>
          <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
            Kode OTP 6 digit telah dikirim ke<br />
            <span className="font-semibold text-foreground">{email || "email@contoh.com"}</span>
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-border p-6 space-y-5 shadow-sm">
          <div className="flex gap-2 justify-center">
            {otp.map((digit, i) => (
              <input
                key={i}
                ref={refs[i]}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={e => handleInput(i, e.target.value)}
                onKeyDown={e => handleKey(i, e)}
                className={`w-11 h-12 text-center text-xl font-extrabold rounded-xl border-2 transition-all focus:outline-none cursor-text ${
                  digit
                    ? "border-accent bg-accent/5 text-accent"
                    : "border-border bg-secondary/50 text-foreground focus:border-accent focus:ring-2 focus:ring-accent/20"
                }`}
              />
            ))}
          </div>

          <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-accent rounded-full transition-all duration-300" style={{ width: `${(filled / 6) * 100}%` }} />
            </div>
            <span className="text-xs text-muted-foreground tabular-nums w-6 text-right">{filled}/6</span>
          </div>

          <button
            onClick={verify}
            disabled={filled < 6 || loading}
            className="w-full h-10 bg-primary text-primary-foreground rounded-lg font-bold text-sm hover:bg-primary/90 disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-md shadow-primary/20"
          >
            {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
            {loading ? "Memverifikasi..." : "Verifikasi & Masuk"}
          </button>

          {error && <div className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2.5">{error}</div>}
          {message && <div className="text-xs text-emerald-700 bg-emerald-50 rounded-lg px-3 py-2.5">{message}</div>}

          <div className="text-center text-sm">
            {timer > 0 ? (
              <p className="text-muted-foreground">
                Kirim ulang kode dalam{" "}
                <span className="font-bold text-foreground tabular-nums">{timer}d</span>
              </p>
            ) : (
              <button onClick={resend} disabled={loading} className="text-accent font-bold hover:text-blue-700 transition-colors disabled:opacity-50">
                Kirim Ulang Kode OTP
              </button>
            )}
          </div>

          <div className="bg-secondary/60 rounded-xl p-3.5 flex items-start gap-2.5">
            <Info className="h-4 w-4 text-accent flex-shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground leading-relaxed">
              Periksa folder <strong className="text-foreground">spam</strong> atau <strong className="text-foreground">junk</strong> jika email tidak ditemukan. Kode OTP berlaku selama <strong className="text-foreground">10 menit</strong>.
            </p>
          </div>
        </div>

        <button onClick={() => setView("register")} className="w-full mt-5 text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center gap-1.5">
          <ChevronLeft className="h-4 w-4" /> Kembali ke Pendaftaran
        </button>
      </div>
    </div>
  );
}
