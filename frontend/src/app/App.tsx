import { useState, useEffect, useRef } from "react";
import { Globe, Shield, ArrowRight, Settings, Activity, TrendingUp, MessageCircle, X, Send, Bot } from "lucide-react";
import { View, AuthUser, UserProfile, AgeGroup } from "./types";
import { ProfileGate } from "./components/ProfileGate";
import { Navbar } from "./components/Navbar";
import { HomePage } from "../pages/HomePage";
import { ApplyPage } from "../pages/ApplyPage";
import { TrackPage } from "../pages/TrackPage";
import { LoginPage } from "../pages/LoginPage";
import { RegisterPage } from "../pages/RegisterPage";
import { OTPPage } from "../pages/OTPPage";
import { AdminDashboard } from "../admin/AdminDashboard";
import { api, getAuthToken, profileFromApi } from "./api";

function SplashScreen({ onStart }: { onStart: () => void }) {
  const steps = [
    { num: "01", icon: Settings,    title: "Konfigurasi Skenario", desc: "Pilih jenis layanan, karakteristik pengguna, dan kondisi layanan yang akan disimulasikan." },
    { num: "02", icon: Activity,    title: "Jalankan Simulasi",    desc: "Sistem akan mensimulasikan perjalanan layanan berdasarkan skenario yang dipilih." },
    { num: "03", icon: TrendingUp,  title: "Analisis Hasil",       desc: "Simulator menampilkan indikator kinerja layanan, bottleneck, dan tingkat keberhasilan." },
  ];

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "linear-gradient(160deg,#0e2044 0%,#1a3566 55%,#162d5a 100%)", fontFamily: "'Inter',sans-serif" }}>

      {/* Dot-grid texture */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.05]"
        style={{ backgroundImage: "radial-gradient(circle,#fff 1px,transparent 1px)", backgroundSize: "28px 28px" }} />

      <div className="relative flex-1 flex flex-col items-center justify-center px-6 py-12 max-w-3xl mx-auto w-full gap-10">

        {/* Logo + title */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-5"
            style={{ background: "rgba(255,255,255,0.12)", backdropFilter: "blur(8px)" }}>
            <Shield className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight mb-4"
            style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", letterSpacing: "-0.01em" }}>
            Digital Service Journey<br />
            <span className="text-blue-300">Simulator</span>
          </h1>
          <p className="text-sm sm:text-base text-white/70 leading-relaxed max-w-xl mx-auto mb-3">
            Aplikasi simulasi berbasis skenario yang dikembangkan untuk mendukung proses <strong className="text-white/90">evaluasi dan redesign layanan publik digital</strong>.
          </p>
          <p className="text-xs sm:text-sm text-white/50 leading-relaxed max-w-xl mx-auto">
            Simulator ini memodelkan interaksi antara karakteristik pengguna, alur layanan, serta kondisi operasional layanan guna menghasilkan informasi mengenai kinerja layanan, potensi bottleneck, dan rekomendasi perbaikan yang dapat digunakan sebagai dasar pengambilan keputusan oleh pengelola layanan publik.
          </p>
        </div>

        {/* Divider */}
        <div className="w-full h-px" style={{ background: "rgba(255,255,255,0.1)" }} />

        {/* How it works */}
        <div className="w-full">
          <p className="text-[11px] font-bold text-white/40 uppercase tracking-[0.18em] text-center mb-5"
            style={{ fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
            Cara Kerja Simulator
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {steps.map(({ num, icon: Icon, title, desc }, i) => (
              <div key={num} className="relative rounded-2xl p-5 flex flex-col gap-3"
                style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }}>
                {/* Connector */}
                {i < 2 && (
                  <div className="hidden sm:block absolute top-8 -right-2 z-10">
                    <ArrowRight className="h-4 w-4 text-white/20" />
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: "rgba(37,99,235,0.35)" }}>
                    <Icon className="h-4.5 w-4.5 text-blue-300" style={{ width: 18, height: 18 }} />
                  </div>
                  <span className="text-2xl font-extrabold text-white/15 tabular-nums leading-none"
                    style={{ fontFamily: "'Plus Jakarta Sans',sans-serif" }}>{num}</span>
                </div>
                <div>
                  <p className="text-sm font-bold text-white mb-1"
                    style={{ fontFamily: "'Plus Jakarta Sans',sans-serif" }}>{title}</p>
                  <p className="text-xs text-white/50 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <button onClick={onStart}
          className="flex items-center gap-2.5 px-8 py-3.5 rounded-2xl font-bold text-sm text-white transition-all hover:scale-105 active:scale-100"
          style={{ background: "linear-gradient(135deg,#2563EB,#1d4ed8)", boxShadow: "0 8px 32px rgba(37,99,235,0.45)" }}>
          Mulai Menggunakan Simulator
          <ArrowRight className="h-4.5 w-4.5" style={{ width: 18, height: 18 }} />
        </button>

        <p className="text-[11px] text-white/25 text-center -mt-6">
          Anda akan diminta mengisi profil pengguna untuk menyesuaikan tampilan simulasi.
        </p>
      </div>
    </div>
  );
}

type ChatMsg = { from: "user" | "bot"; text: string };

const BOT_KB: [RegExp, string][] = [
  [/nik|ktp/i,               "NIK adalah 16 digit angka pada KTP Anda. Contoh: 3271012345678901."],
  [/npwp/i,                  "NPWP adalah Nomor Pokok Wajib Pajak. Jika belum memiliki, kolom NPWP boleh dikosongkan."],
  [/upload|file|pdf|berkas/i,"Semua berkas harus format PDF, maksimal 5 MB per file. Unggah satu per satu."],
  [/lokasi|alamat usaha/i,   "Alamat lokasi izin adalah tempat usaha Anda, boleh berbeda dari alamat KTP."],
  [/draft|simpan|lanjut/i,   "Formulir tersimpan otomatis setiap beberapa detik. Anda bisa kembali kapan saja."],
  [/perusahaan|badan usaha/i,"Jika mendaftar sebagai perorangan, centang opsi 'Lewati (Perorangan)' di Langkah 3."],
  [/hubungi|telepon|petugas/i,"Hubungi petugas kami di (021) 500-1234 atau layanan@dsj.go.id untuk bantuan langsung."],
  [/langkah|tahap|step/i,    "Isi semua kolom bertanda (*) sebelum klik Selanjutnya. Kolom opsional boleh dikosongkan."],
  [/error|salah|merah/i,     "Periksa kolom yang ditandai merah. Semua kolom wajib (*) harus diisi dengan benar."],
  [/akta|pendirian/i,        "Akta pendirian adalah dokumen resmi dari notaris yang mengesahkan berdirinya perusahaan."],
  [/nib|oss/i,               "NIB (Nomor Induk Berusaha) diperoleh melalui sistem OSS di oss.go.id. Proses pendaftaran gratis."],
  [/bpjs/i,                  "Scan kartu BPJS Ketenagakerjaan diperlukan sebagai bukti kepesertaan program jaminan sosial."],
];

function botReply(msg: string): string {
  for (const [re, ans] of BOT_KB) if (re.test(msg)) return ans;
  return "Maaf, saya belum memahami pertanyaan tersebut. Coba tanyakan tentang: NIK/KTP, NPWP, upload berkas, draft, atau perusahaan. Atau hubungi petugas di (021) 500-1234.";
}

function ChatBox({ large }: { large?: boolean }) {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<ChatMsg[]>([
    { from: "bot", text: "Halo! Saya Asisten DSJ. Silakan tanyakan apa saja tentang pengisian formulir ini — saya siap membantu! 😊" },
  ]);
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const send = () => {
    const txt = input.trim();
    if (!txt) return;
    setMsgs(prev => [...prev, { from: "user", text: txt }, { from: "bot", text: botReply(txt) }]);
    setInput("");
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 80);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {open && (
        <div className="w-80 bg-white rounded-3xl shadow-2xl border border-border overflow-hidden flex flex-col"
          style={{ maxHeight: "420px" }}>
          {/* Header */}
          <div className="bg-gradient-to-r from-primary to-blue-600 px-4 py-3 flex items-center gap-3 flex-shrink-0">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
              <Bot className="h-4 w-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-bold leading-none">Asisten DSJ</p>
              <p className="text-white/60 text-[10px] mt-0.5">Bantuan pengisian formulir</p>
            </div>
            <button onClick={() => setOpen(false)} className="p-1 rounded-lg hover:bg-white/20 transition-colors">
              <X className="h-4 w-4 text-white" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3 bg-slate-50" style={{ minHeight: 0 }}>
            {msgs.map((m, i) => (
              <div key={i} className={`flex gap-2 ${m.from === "user" ? "justify-end" : "justify-start"}`}>
                {m.from === "bot" && (
                  <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Bot className="h-3 w-3 text-white" />
                  </div>
                )}
                <div className={`max-w-[85%] px-3 py-2 rounded-2xl text-xs leading-relaxed ${
                  m.from === "user"
                    ? "bg-accent text-white rounded-br-sm"
                    : "bg-white text-slate-700 border border-border rounded-bl-sm shadow-sm"
                }`}>{m.text}</div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="px-3 py-3 border-t border-border bg-white flex items-center gap-2 flex-shrink-0">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && send()}
              placeholder="Ketik pertanyaan Anda..."
              className="flex-1 h-9 px-3 rounded-xl border border-border text-xs bg-slate-50 focus:outline-none focus:ring-2 focus:ring-accent/25 focus:border-accent"
            />
            <button onClick={send}
              className="w-9 h-9 rounded-xl bg-accent text-white flex items-center justify-center hover:bg-blue-700 transition-colors flex-shrink-0">
              <Send className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Toggle button */}
      <button
        onClick={() => setOpen(v => !v)}
        className={`flex items-center gap-2.5 rounded-2xl text-white font-bold shadow-xl hover:scale-105 active:scale-100 transition-all ${large ? "px-5 py-4 text-base" : "px-4 py-3 text-sm"}`}
        style={{ background: "linear-gradient(135deg,#1B3A6B,#2563EB)", boxShadow: "0 8px 24px rgba(37,99,235,0.4)" }}
      >
        {open
          ? <X style={{ width: 18, height: 18 }} />
          : <MessageCircle style={{ width: 18, height: 18 }} />}
        {open ? "Tutup Chat" : "Tanya Asisten"}
      </button>
    </div>
  );
}

export default function App() {
  const [splash, setSplash] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [view, setView] = useState<View>("home");
  const [auth, setAuth] = useState<AuthUser | null>(null);
  const [otpData, setOtpData] = useState({ email: "", name: "" });

  useEffect(() => {
    if (!getAuthToken()) return;
    let active = true;
    api.me().then(user => {
      if (!active) return;
      setAuth(user);
      if (user.profile) setProfile(profileFromApi(user.profile));
    }).catch(() => {}).finally(() => {});
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!profile) return;
    const sizes: Record<AgeGroup, string> = {
      remaja: "15px", dewasa: "16px", pralansia: "18px", lansia: "20px",
    };
    document.documentElement.style.setProperty("font-size", sizes[profile.age], "important");
    if (profile.colorBlind === "ya") document.documentElement.classList.add("cb-mode");
    else document.documentElement.classList.remove("cb-mode");
    return () => {
      document.documentElement.style.removeProperty("font-size");
      document.documentElement.classList.remove("cb-mode");
    };
  }, [profile]);

  if (splash) return <SplashScreen onStart={() => setSplash(false)} />;
  const completeProfile = async (selected: UserProfile) => {
    setProfile(selected);
    if (auth) {
      try { await api.updateProfile(selected); } catch { /* tampilan tetap memakai preferensi sesi */ }
    }
  };

  if (!profile) return <ProfileGate onComplete={completeProfile} />;

  const login = async (user: AuthUser & { profile?: any }) => {
    setAuth(user);
    if (user.profile) setProfile(profileFromApi(user.profile));
    else {
      try { await api.updateProfile(profile); } catch { /* profil dapat disimpan ulang nanti */ }
    }
    setView(user.role === "admin" ? "admin" : "home");
  };
  const logout = async () => {
    try { await api.logout(); } finally { setAuth(null); setView("home"); }
  };

  const isLansia = profile.age === "lansia" || profile.age === "pralansia";
  const slowNet = profile.internet === "tidak_stabil";
  const colorBlind = profile.colorBlind === "ya";

  return (
    <div className={`min-h-screen bg-background${slowNet ? " lite-mode" : ""}`} style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* Colorblind palette overrides (deuteranopia/protanopia safe)
          green/emerald → sky-blue | red/rose → orange | amber/yellow → violet | purple → teal */}
      {colorBlind && (
        <style>{`
          /* ── GREEN / EMERALD → SKY BLUE ─────────────────────── */
          .cb-mode [class*="text-emerald-3"]{color:#38bdf8!important}
          .cb-mode [class*="text-emerald-4"]{color:#0ea5e9!important}
          .cb-mode [class*="text-emerald-5"]{color:#0ea5e9!important}
          .cb-mode [class*="text-emerald-6"],.cb-mode [class*="text-green-6"]{color:#0284c7!important}
          .cb-mode [class*="text-emerald-7"]{color:#0369a1!important}
          .cb-mode [class*="text-green-4"],[class*="text-green-5"]{color:#0ea5e9!important}
          .cb-mode [class*="text-lime"]{color:#0284c7!important}

          .cb-mode [class*="bg-emerald-5"]:not(svg *),
          .cb-mode [class*="bg-green-5"]:not(svg *){background-color:#0284c7!important}
          .cb-mode [class*="bg-emerald-6"]:not(svg *){background-color:#0369a1!important}
          .cb-mode [class*="bg-emerald-4"]:not(svg *){background-color:#38bdf8!important}
          .cb-mode [class*="bg-emerald-3"]:not(svg *){background-color:#7dd3fc!important}
          .cb-mode [class*="bg-emerald-2"]:not(svg *),
          .cb-mode [class*="bg-green-2"]:not(svg *){background-color:#e0f2fe!important}
          .cb-mode [class*="bg-emerald-1"]:not(svg *),
          .cb-mode [class*="bg-green-1"]:not(svg *){background-color:#e0f2fe!important}
          .cb-mode [class*="bg-emerald-50"]:not(svg *),
          .cb-mode [class*="bg-green-50"]:not(svg *){background-color:#f0f9ff!important}
          .cb-mode [class*="bg-lime"]:not(svg *){background-color:#e0f2fe!important}

          .cb-mode [class*="border-emerald"],.cb-mode [class*="border-green"]{border-color:#7dd3fc!important}
          .cb-mode [class*="ring-emerald"]{--tw-ring-color:#38bdf8!important}
          .cb-mode [class*="shadow-emerald"]{--tw-shadow-color:#bae6fd!important}
          .cb-mode [class*="fill-emerald"],.cb-mode [class*="fill-green"]{fill:#0284c7!important}
          .cb-mode [class*="stroke-emerald"],.cb-mode [class*="stroke-green"]{stroke:#0284c7!important}

          /* SVG / recharts cells that use inline fill with green hex */
          .cb-mode svg [fill="#22c55e"],.cb-mode svg [fill="#16a34a"],.cb-mode svg [fill="#10b981"],.cb-mode svg [fill="#059669"]{fill:#0284c7!important}
          .cb-mode svg [stroke="#22c55e"],.cb-mode svg [stroke="#16a34a"],.cb-mode svg [stroke="#10b981"]{stroke:#0284c7!important}

          /* ── RED / ROSE → ORANGE ─────────────────────────────── */
          .cb-mode [class*="text-red-4"]{color:#fb923c!important}
          .cb-mode [class*="text-red-5"],.cb-mode [class*="text-rose-5"]{color:#ea580c!important}
          .cb-mode [class*="text-red-6"],.cb-mode [class*="text-rose-6"]{color:#ea580c!important}
          .cb-mode [class*="text-red-7"]{color:#c2410c!important}

          .cb-mode [class*="bg-red-5"]:not(svg *),.cb-mode [class*="bg-rose-5"]:not(svg *){background-color:#f97316!important}
          .cb-mode [class*="bg-red-4"]:not(svg *){background-color:#fb923c!important}
          .cb-mode [class*="bg-red-1"]:not(svg *),.cb-mode [class*="bg-rose-1"]:not(svg *){background-color:#ffedd5!important}
          .cb-mode [class*="bg-red-50"]:not(svg *),.cb-mode [class*="bg-rose-50"]:not(svg *){background-color:#fff7ed!important}

          .cb-mode [class*="border-red"],.cb-mode [class*="border-rose"]{border-color:#fdba74!important}
          .cb-mode [class*="ring-red"],.cb-mode [class*="ring-rose"]{--tw-ring-color:#fed7aa!important}
          .cb-mode [class*="fill-red"],.cb-mode [class*="fill-rose"]{fill:#f97316!important}
          .cb-mode [class*="stroke-red"],.cb-mode [class*="stroke-rose"]{stroke:#f97316!important}

          .cb-mode svg [fill="#ef4444"],.cb-mode svg [fill="#dc2626"],.cb-mode svg [fill="#f87171"]{fill:#f97316!important}
          .cb-mode svg [stroke="#ef4444"],.cb-mode svg [stroke="#dc2626"]{stroke:#f97316!important}

          /* ── AMBER / YELLOW → VIOLET ─────────────────────────── */
          /* amber is already distinguishable for most CVD, but yellow-green overlap is an issue;
             shift to violet so it's unambiguously different from both sky-blue and orange */
          .cb-mode [class*="text-amber-5"],.cb-mode [class*="text-amber-6"]{color:#7c3aed!important}
          .cb-mode [class*="text-amber-7"],.cb-mode [class*="text-amber-8"]{color:#6d28d9!important}
          .cb-mode [class*="text-yellow"]{color:#7c3aed!important}

          .cb-mode [class*="bg-amber-5"]:not(svg *),.cb-mode [class*="bg-amber-6"]:not(svg *){background-color:#7c3aed!important}
          .cb-mode [class*="bg-amber-1"]:not(svg *){background-color:#ede9fe!important}
          .cb-mode [class*="bg-amber-50"]:not(svg *){background-color:#f5f3ff!important}
          .cb-mode [class*="bg-yellow-3"]:not(svg *){background-color:#ddd6fe!important}

          .cb-mode [class*="border-amber"]{border-color:#c4b5fd!important}
          .cb-mode [class*="ring-amber"]{--tw-ring-color:#c4b5fd!important}
          .cb-mode [class*="fill-amber"],.cb-mode [class*="fill-yellow"]{fill:#7c3aed!important}

          .cb-mode svg [fill="#f59e0b"],.cb-mode svg [fill="#d97706"],.cb-mode svg [fill="#fbbf24"]{fill:#7c3aed!important}

          /* ── PURPLE / INDIGO — shift slightly to teal for contrast with violet ─ */
          .cb-mode [class*="text-purple-6"],.cb-mode [class*="text-purple-7"]{color:#0f766e!important}
          .cb-mode [class*="text-indigo-6"]{color:#0f766e!important}
          .cb-mode [class*="bg-purple-5"]:not(svg *),.cb-mode [class*="bg-indigo-1"]:not(svg *){background-color:#ccfbf1!important}
          .cb-mode [class*="bg-purple-50"]:not(svg *),.cb-mode [class*="bg-purple-1"]:not(svg *){background-color:#f0fdfa!important}
          .cb-mode [class*="border-purple"]{border-color:#99f6e4!important}

          /* ── STATUS BADGE text overrides (explicit class names) ─ */
          .cb-mode .text-emerald-700{color:#0369a1!important}
          .cb-mode .text-red-700{color:#c2410c!important}
          .cb-mode .text-amber-700{color:#6d28d9!important}
          .cb-mode .bg-emerald-50{background-color:#f0f9ff!important}
          .cb-mode .bg-red-50{background-color:#fff7ed!important}
          .cb-mode .bg-amber-50{background-color:#f5f3ff!important}
          .cb-mode .border-emerald-200{border-color:#bae6fd!important}
          .cb-mode .border-red-200{border-color:#fed7aa!important}
          .cb-mode .border-amber-200{border-color:#c4b5fd!important}
        `}</style>
      )}

      {/* Lite mode: disable animations & heavy effects for slow internet */}
      {slowNet && (
        <style>{`
          .lite-mode *{
            animation-duration:0.01ms!important;
            animation-iteration-count:1!important;
            transition-duration:0.01ms!important;
          }
          .lite-mode .blur-3xl,.lite-mode .blur-xl,.lite-mode .blur-2xl{display:none!important}
          .lite-mode .shadow-xl,.lite-mode .shadow-2xl{box-shadow:0 1px 4px rgba(0,0,0,0.08)!important}
          .lite-mode .shadow-lg{box-shadow:0 1px 3px rgba(0,0,0,0.07)!important}
          .lite-mode .backdrop-blur-sm{backdrop-filter:none!important}
          .lite-mode .bg-gradient-to-br,.lite-mode .bg-gradient-to-r,.lite-mode .bg-gradient-to-bl{background-image:none!important}
          .lite-mode .animate-pulse{animation:none!important;opacity:1!important}
        `}</style>
      )}

      {/* Slow internet banner */}
      {slowNet && (
        <div className="bg-amber-50 border-b-2 border-amber-300 px-4 py-2.5 flex items-center justify-center gap-2 text-xs text-amber-800 font-semibold">
          <Globe className="h-3.5 w-3.5 flex-shrink-0" />
          Mode Hemat Data aktif — animasi dinonaktifkan, hindari upload file besar dan simpan formulir secara berkala.
        </div>
      )}

      {/* Navbar — hidden on admin view (admin has its own sidebar) */}
      {view !== "admin" && <Navbar view={view} setView={setView} auth={auth} onLogout={logout} />}

      {/* Page router */}
      {view === "home"     && <HomePage     setView={setView} auth={auth} />}
      {view === "apply"    && <ApplyPage    setView={setView} auth={auth} profile={profile} />}
      {view === "track"    && <TrackPage    setView={setView} auth={auth} />}
      {view === "login"    && <LoginPage    setView={setView} onLogin={login} />}
      {view === "register" && <RegisterPage setView={setView} setOtpData={setOtpData} />}
      {view === "otp"      && <OTPPage      setView={setView} email={otpData.email} registeredName={otpData.name} onLogin={login} />}
      {view === "admin"    && <AdminDashboard setView={setView} auth={auth} onLogout={logout} colorBlind={colorBlind} />}

      {/* Chat assistant — only for bantuan_penuh */}
      {profile.serviceModel === "bantuan_penuh" && <ChatBox large={isLansia} />}
    </div>
  );
}
