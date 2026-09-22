import { useState } from "react";
import { Shield, Check, ArrowRight, ArrowLeft, Zap } from "lucide-react";
import { UserProfile } from "../types";

function OptCard({ val, selected, label, sub, icon, onSelect }: {
  val: string; selected: boolean; label: string; sub?: string; icon: string; onSelect: () => void;
}) {
  void val;
  return (
    <button onClick={onSelect}
      className={`relative flex flex-col items-center text-center p-4 rounded-xl border-2 transition-all gap-1.5 ${
        selected
          ? "border-accent bg-accent/8 shadow-md shadow-accent/20"
          : "border-border bg-white hover:border-accent/40 hover:bg-secondary/30"
      }`}>
      <span className="text-2xl leading-none">{icon}</span>
      <span className={`text-sm font-bold leading-tight ${selected ? "text-accent" : "text-foreground"}`}>{label}</span>
      {sub && <span className="text-[10px] text-muted-foreground leading-snug">{sub}</span>}
      {selected && (
        <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-accent flex items-center justify-center">
          <Check className="h-3 w-3 text-white" />
        </div>
      )}
    </button>
  );
}

const STEPS = [
  {
    key: "age",
    num: 1,
    label: "Kelompok Usia",
    affects: "Mempengaruhi ukuran teks",
    options: [
      ["remaja",   "Remaja",    "12–25 tahun", "🧑"],
      ["dewasa",   "Dewasa",    "26–44 tahun", "👨"],
      ["pralansia","Pra-Lansia","45–59 tahun", "👴"],
      ["lansia",   "Lansia",    "60 tahun +",  "🧓"],
    ] as const,
    cols: "grid-cols-2 sm:grid-cols-4",
  },
  {
    key: "colorBlind",
    num: 2,
    label: "Buta Warna",
    affects: "Mempengaruhi palet warna",
    options: [
      ["tidak","Tidak","Penglihatan normal",   "👁️"],
      ["ya",   "Ya",   "Sebagian / penuh",     "🎨"],
    ] as const,
    cols: "grid-cols-2",
  },
  {
    key: "serviceModel",
    num: 3,
    label: "Model Layanan yang Diinginkan",
    options: [
      ["mandiri",      "Mandiri",       "Isi sendiri",          "🙋"],
      ["bantuan",      "Dengan Bantuan","Butuh panduan",        "🤝"],
      ["bantuan_penuh","Bantuan Penuh", "Pendampingan lengkap", "👨‍💼"],
    ] as const,
    cols: "grid-cols-3",
  },
  {
    key: "internet",
    num: 4,
    label: "Kondisi Koneksi Internet",
    options: [
      ["stabil",      "Stabil",      "Koneksi lancar",  "📶"],
      ["tidak_stabil","Tidak Stabil","Sering terputus", "📡"],
    ] as const,
    cols: "grid-cols-2",
  },
] as const;

export function ProfileGate({ onComplete }: { onComplete: (p: UserProfile) => void | Promise<void> }) {
  const [step, setStep] = useState(0);
  const [p, setP] = useState<Record<string, string>>({});

  const current = STEPS[step];
  const picked  = p[current.key];
  const isLast  = step === STEPS.length - 1;

  const pick = (val: string) => setP(prev => ({ ...prev, [current.key]: val }));

  const next = () => {
    if (!picked) return;
    if (isLast) {
      void onComplete(p as unknown as UserProfile);
    } else {
      setStep(s => s + 1);
    }
  };

  const back = () => { if (step > 0) setStep(s => s - 1); };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary via-blue-800 to-blue-900 flex items-center justify-center p-4"
      style={{ fontFamily: "'Inter', sans-serif" }}>
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl shadow-black/40 overflow-hidden">

        {/* Header */}
        <div className="relative bg-gradient-to-br from-primary to-blue-700 text-white px-8 py-7 text-center overflow-hidden">
          <div className="absolute inset-0 opacity-[0.06]"
            style={{ backgroundImage: "radial-gradient(circle,#fff 1px,transparent 1px)", backgroundSize: "20px 20px" }} />
          <div className="relative">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-white/15 mb-3">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-lg font-extrabold mb-1" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              Digital Service Journey
            </h1>
            <p className="text-xs text-white/65 max-w-xs mx-auto leading-relaxed">
              Bantu kami menyesuaikan tampilan dan layanan sesuai kebutuhan Anda.
            </p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="px-8 pt-5 pb-0">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-muted-foreground">
              Langkah {step + 1} dari {STEPS.length}
            </span>
            <span className="text-[11px] font-bold text-accent">
              {Math.round(((step + 1) / STEPS.length) * 100)}%
            </span>
          </div>
          <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full bg-accent rounded-full transition-all duration-500 ease-out"
              style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
            />
          </div>

          {/* Step dots */}
          <div className="flex items-center justify-center gap-1.5 mt-3">
            {STEPS.map((_, i) => (
              <div key={i} className={`rounded-full transition-all duration-300 ${
                i < step ? "w-4 h-1.5 bg-accent/50" :
                i === step ? "w-6 h-1.5 bg-accent" :
                "w-1.5 h-1.5 bg-border"
              }`} />
            ))}
          </div>
        </div>

        {/* Question */}
        <div className="px-8 py-6">
          <div className="flex items-center gap-2 mb-5">
            <span className="w-6 h-6 rounded-full bg-accent text-white text-[11px] font-bold flex items-center justify-center flex-shrink-0">
              {current.num}
            </span>
            <span className="text-base font-bold text-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              {current.label}
            </span>
            {"affects" in current && current.affects && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-accent/10 text-accent border border-accent/20 flex items-center gap-1 ml-1">
                <Zap className="h-2.5 w-2.5" />{current.affects}
              </span>
            )}
          </div>

          <div className={`grid ${current.cols} gap-3`}>
            {(current.options as readonly (readonly [string, string, string, string])[]).map(([v, l, s, i]) => (
              <OptCard
                key={v}
                val={v}
                selected={picked === v}
                label={l}
                sub={s}
                icon={i}
                onSelect={() => pick(v)}
              />
            ))}
          </div>

          {!picked && (
            <p className="text-[11px] text-muted-foreground text-center mt-4">
              Pilih salah satu untuk melanjutkan
            </p>
          )}
        </div>

        {/* Footer nav */}
        <div className="px-8 py-5 border-t border-border bg-secondary/20 flex items-center justify-between gap-3">
          <button
            onClick={back}
            disabled={step === 0}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-border bg-white text-sm font-semibold text-foreground hover:bg-secondary disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            <ArrowLeft className="h-4 w-4" /> Kembali
          </button>

          <p className="text-[10px] text-muted-foreground text-center flex-1 hidden sm:block">
            Preferensi disimpan ke akun setelah Anda masuk.
          </p>

          <button
            onClick={next}
            disabled={!picked}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${
              picked
                ? "bg-accent text-white hover:bg-accent/90 shadow-lg shadow-accent/25"
                : "bg-muted text-muted-foreground cursor-not-allowed"
            }`}
          >
            {isLast ? "Mulai Simulasi" : "Selanjutnya"}
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
