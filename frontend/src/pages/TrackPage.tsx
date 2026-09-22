import { useEffect, useState } from "react";
import { Search, ArrowLeft, Bell, Lock, ChevronRight, Check, Clock } from "lucide-react";
import { View, AuthUser } from "../app/types";
import { api, ApiApplication, ApiError } from "../app/api";

type TrackApp = ApiApplication;

const formatDate = (value: string | null) => value
  ? new Date(value).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
  : "-";

function TrackTimeline({ app, auth, setView }: { app: TrackApp; auth: AuthUser | null; setView: (v: View) => void }) {
  const done = app.stages.filter(s => s.status === "completed").length;
  const progress = Math.round((done / app.stages.length) * 100);
  const isSelesai = app.status === "approved" || app.status === "rejected";
  return (
    <div className="bg-white rounded-2xl border border-border overflow-hidden">
      <div className="px-6 pt-6 pb-4 border-b border-border">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-widest mb-0.5">Nomor Permohonan</p>
            <h3 className="font-extrabold text-foreground text-xl leading-tight" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{app.code}</h3>
            <p className="text-sm text-muted-foreground mt-0.5">{app.service_label}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Diajukan: {formatDate(app.submitted_at)}</p>
          </div>
          <span className={`text-xs font-bold px-3 py-1.5 rounded-full border flex-shrink-0 mt-1 ${isSelesai ? "text-emerald-700 bg-emerald-50 border-emerald-200" : "text-amber-700 bg-amber-50 border-amber-200"}`}>
            {isSelesai ? "✓ Selesai" : "⏳ Diproses"}
          </span>
        </div>
        <div>
          <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
            <span>Progress keseluruhan</span>
            <span className="font-bold text-foreground">{progress}%</span>
          </div>
          <div className="h-2.5 rounded-full bg-secondary overflow-hidden">
            <div className="h-full rounded-full bg-accent transition-all duration-700" style={{ width: `${progress}%` }} />
          </div>
          <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
            <span>Langkah {done} dari {app.stages.length}</span>
            <span>{isSelesai ? "Proses selesai" : "Sedang berjalan"}</span>
          </div>
        </div>
      </div>

      <div className="px-6 py-6">
        <h4 className="text-sm font-bold text-foreground mb-5">Riwayat Tahapan</h4>
        {app.stages.map((stage, i) => {
          const isLast = i === app.stages.length - 1;
          const stageDone = stage.status === "completed";
          const isCurrent = stage.status === "in_progress";
          return (
            <div key={i} className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 border-2 font-bold text-xs ${
                  stageDone || isCurrent
                    ? isCurrent ? "border-accent bg-accent text-white" : "border-emerald-500 bg-emerald-500 text-white"
                    : "border-border bg-secondary text-muted-foreground"
                }`}>
                  {stageDone || isCurrent ? (isCurrent ? <Clock className="h-4 w-4" /> : <Check className="h-4 w-4" />) : <span>{i + 1}</span>}
                </div>
                {!isLast && <div className={`w-0.5 h-10 mt-0.5 ${stageDone ? "bg-emerald-400" : "bg-border"}`} />}
              </div>
              <div className={`${isLast ? "pb-0" : "pb-8"} flex-1`}>
                <p className={`text-sm font-semibold leading-snug ${stageDone || isCurrent ? "text-foreground" : "text-muted-foreground"}`}>{stage.name}</p>
                {stage.completed_at || stage.started_at
                  ? <p className="text-xs text-muted-foreground mt-0.5">{formatDate(stage.completed_at ?? stage.started_at)}</p>
                  : <p className="text-xs text-muted-foreground/50 mt-0.5 italic">Menunggu diproses</p>
                }
                {isCurrent && (
                  <span className="inline-flex items-center gap-1.5 mt-1.5 text-[10px] font-bold text-accent bg-accent/10 px-2.5 py-1 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse inline-block" /> Tahap saat ini
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="px-6 py-4 border-t border-border bg-secondary/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        {auth ? (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Bell className="h-3.5 w-3.5" />
            <span>Notifikasi dikirim ke <strong className="text-foreground">{auth.email}</strong></span>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">
            <Lock className="inline h-3 w-3 mr-1" />
            <button onClick={() => setView("login")} className="text-accent font-semibold hover:underline">Masuk</button> atau <button onClick={() => setView("register")} className="text-accent font-semibold hover:underline">daftar</button> untuk notifikasi otomatis.
          </p>
        )}
        <button onClick={() => setView("apply")} className="flex items-center gap-1.5 text-sm font-semibold text-accent hover:text-accent/80 transition-colors flex-shrink-0">
          Ajukan Permohonan Baru <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export function TrackPage({ setView, auth }: { setView: (v: View) => void; auth: AuthUser | null }) {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<TrackApp | "not_found" | null>(null);
  const [applications, setApplications] = useState<TrackApp[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!auth) { setApplications([]); return; }
    api.applications().then(setApplications).catch(() => setApplications([]));
  }, [auth]);

  const doSearch = async (id?: string) => {
    const q = (id ?? query).trim().toUpperCase();
    if (!q) return;
    setLoading(true);
    setError("");
    if (!id) setQuery(q);
    try {
      setResult(await api.track(q));
    } catch (e) {
      if (e instanceof ApiError && e.status === 404) setResult("not_found");
      else setError(e instanceof ApiError ? e.firstValidationMessage() : "Status permohonan gagal dimuat.");
    } finally {
      setLoading(false);
    }
  };

  const displayApp = result && result !== "not_found" ? result : null;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-10 space-y-6">
        <div>
          <button onClick={() => setView("home")} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4">
            <ArrowLeft className="h-3.5 w-3.5" /> Kembali ke Beranda
          </button>
          <h1 className="text-2xl font-extrabold text-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Pantau Status Permohonan</h1>
          <p className="text-sm text-muted-foreground mt-1">Masukkan nomor permohonan untuk melihat status pengajuan — tanpa perlu login.</p>
        </div>

        <div className="bg-white rounded-2xl border border-border p-6">
          <label className="text-sm font-bold text-foreground block mb-1">Nomor Permohonan</label>
          <p className="text-xs text-muted-foreground mb-3">Format: DSJ-YYYY-XXXX &nbsp;·&nbsp; Tersedia di email konfirmasi Anda</p>
          <div className="flex gap-2">
            <input
              value={query}
              onChange={e => { setQuery(e.target.value.toUpperCase()); setResult(null); }}
              onKeyDown={e => e.key === "Enter" && void doSearch()}
              placeholder="DSJ-2026-XXXXXXXX"
              className="flex-1 h-11 px-4 rounded-xl border border-border bg-background text-sm font-mono placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/25 focus:border-accent transition-all"
            />
            <button
              onClick={() => void doSearch()}
              disabled={!query.trim() || loading}
              className="px-5 h-11 rounded-xl bg-accent text-white text-sm font-bold hover:bg-accent/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5"
            >
              <Search className="h-4 w-4" /> {loading ? "Mencari..." : "Cari"}
            </button>
          </div>
          {error && <p className="mt-3 text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
        </div>

        {result === "not_found" && (
          <div className="bg-white rounded-2xl border border-border p-10 text-center">
            <div className="w-14 h-14 rounded-2xl bg-secondary flex items-center justify-center mx-auto mb-4">
              <Search className="h-7 w-7 text-muted-foreground" />
            </div>
            <h3 className="font-bold text-foreground mb-2" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Permohonan Tidak Ditemukan</h3>
            <p className="text-sm text-muted-foreground">Nomor <strong className="font-mono text-foreground">{query}</strong> tidak ada dalam sistem.<br />Periksa kembali nomor yang Anda masukkan.</p>
          </div>
        )}

        {displayApp && <TrackTimeline app={displayApp} auth={auth} setView={setView} />}

        {auth && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-bold text-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Permohonan Anda</h2>
              <span className="text-xs text-muted-foreground">{applications.length} permohonan</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {applications.map(a => {
                const isSelesai = a.status === "approved" || a.status === "rejected";
                const isActive = displayApp?.id === a.id;
                return (
                  <button key={a.id} onClick={() => { setQuery(a.code); setResult(a); }}
                    className={`text-left p-4 rounded-2xl border transition-all ${isActive ? "border-accent bg-accent/5 shadow-sm" : "border-border bg-white hover:border-accent/40"}`}>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className="text-xs font-mono font-bold text-accent">{a.code}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${isSelesai ? "text-emerald-700 bg-emerald-50 border-emerald-200" : "text-amber-700 bg-amber-50 border-amber-200"}`}>
                        {isSelesai ? "Selesai" : "Diproses"}
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-foreground leading-snug">{a.service_label}</p>
                    <p className="text-xs text-muted-foreground mt-1">Diajukan {formatDate(a.submitted_at)}</p>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {!auth && (
          <div className="bg-primary/5 border border-primary/15 rounded-2xl p-5 flex flex-col sm:flex-row items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Bell className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 text-center sm:text-left">
              <p className="text-sm font-bold text-foreground">Ingin notifikasi otomatis?</p>
              <p className="text-xs text-muted-foreground mt-0.5">Daftar akun gratis untuk menerima update status via email dan melihat semua permohonan Anda.</p>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <button onClick={() => setView("register")} className="px-4 py-2 rounded-xl bg-accent text-white text-xs font-bold hover:bg-accent/90 transition-colors">Daftar Gratis</button>
              <button onClick={() => setView("login")} className="px-4 py-2 rounded-xl border border-border text-xs font-semibold hover:bg-secondary transition-colors">Masuk</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
