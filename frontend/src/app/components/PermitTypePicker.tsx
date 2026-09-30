import { useEffect, useMemo, useState } from "react";
import {
  Search, ChevronRight, ChevronLeft, FileText, BookOpen, ListChecks, ClipboardList,
  Scale, ExternalLink, Clock, Wallet, Award, AlertTriangle, CheckCircle, Loader2,
} from "lucide-react";
import {
  PermitType, PermitLine, PermitLink, loadPermitTypes,
} from "../perizinan";

const heading = { fontFamily: "'Plus Jakarta Sans', sans-serif" };

function Links({ links }: { links?: PermitLink[] }) {
  if (!links?.length) return null;
  return (
    <span className="inline-flex flex-wrap gap-2 ml-1">
      {links.map(l => (
        <a key={l.href} href={l.href} target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-accent font-semibold hover:underline">
          {l.label} <ExternalLink className="h-3 w-3" />
        </a>
      ))}
    </span>
  );
}

function Lines({ lines, empty }: { lines: PermitLine[]; empty: string }) {
  if (!lines.length) return <p className="text-sm text-muted-foreground italic">{empty}</p>;
  return (
    <div className="space-y-2">
      {lines.map((l, i) => (
        <p key={i} className="text-sm text-foreground leading-relaxed break-words">
          {l.text} <Links links={l.links} />
        </p>
      ))}
    </div>
  );
}

type TabId = "deskripsi" | "dasarHukum" | "prosedur" | "syarat";
const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: "deskripsi",  label: "Deskripsi",   icon: BookOpen },
  { id: "dasarHukum", label: "Dasar Hukum", icon: Scale },
  { id: "prosedur",   label: "Prosedur",    icon: ClipboardList },
  { id: "syarat",     label: "Syarat",      icon: ListChecks },
];

/** Panel informasi lengkap suatu jenis perizinan (deskripsi, dasar hukum, prosedur, syarat). */
export function PermitInfo({ permit, compact = false }: { permit: PermitType; compact?: boolean }) {
  const [tab, setTab] = useState<TabId>("deskripsi");
  const [group, setGroup] = useState(0);

  useEffect(() => { setTab("deskripsi"); setGroup(0); }, [permit.value]);

  const g = permit.syarat[group];
  const wajib = g ? g.items.filter(i => /wajib/i.test(i.status)).length : 0;

  return (
    <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
      {!compact && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-px bg-border">
          {[
            { icon: Award,  label: "Output",       value: permit.output },
            { icon: Clock,  label: "Masa Berlaku", value: permit.masaBerlaku },
            { icon: Wallet, label: "Biaya",        value: permit.biaya },
          ].map(s => (
            <div key={s.label} className="bg-white px-4 py-3 flex items-center gap-3">
              <s.icon className="h-5 w-5 text-accent flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold">{s.label}</p>
                <p className="text-sm font-bold text-foreground break-words">{s.value || "-"}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex overflow-x-auto border-y border-border bg-secondary/40">
        {TABS.map(tb => (
          <button key={tb.id} type="button" onClick={() => setTab(tb.id)}
            className={`flex items-center gap-1.5 px-4 py-3 text-sm font-semibold whitespace-nowrap border-b-2 transition-colors ${
              tab === tb.id ? "border-accent text-accent bg-white" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}>
            <tb.icon className="h-4 w-4" />{tb.label}
          </button>
        ))}
      </div>

      <div className={`p-5 overflow-y-auto ${compact ? "max-h-[420px]" : "max-h-[520px]"}`}>
        {tab === "deskripsi"  && <Lines lines={permit.deskripsi}  empty="Deskripsi tidak tersedia." />}
        {tab === "dasarHukum" && <Lines lines={permit.dasarHukum} empty="Dasar hukum tidak tersedia." />}
        {tab === "prosedur"   && <Lines lines={permit.prosedur}   empty="Prosedur tidak tersedia." />}
        {tab === "syarat" && (
          permit.syarat.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">Persyaratan tidak tersedia.</p>
          ) : (
            <div>
              {permit.syarat.length > 1 && (
                <label className="block mb-4">
                  <span className="text-xs font-semibold text-muted-foreground">Peruntukan / Jenis Permohonan</span>
                  <select value={group} onChange={e => setGroup(Number(e.target.value))}
                    className="mt-1 w-full px-3 py-2.5 rounded-xl border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-accent/30">
                    {permit.syarat.map((s, i) => (
                      <option key={i} value={i}>
                        {s.peruntukan}{s.jenisPermohonan ? ` — ${s.jenisPermohonan}` : ""}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              {g && (
                <>
                  <p className="text-xs text-muted-foreground mb-3">
                    {g.items.length} dokumen · <span className="font-semibold text-red-600">{wajib} wajib</span>
                  </p>
                  <ol className="space-y-2.5">
                    {g.items.map((it, i) => {
                      const isWajib = /wajib/i.test(it.status);
                      return (
                        <li key={i} className="flex gap-3 p-3 rounded-xl border border-border bg-secondary/30">
                          <span className="w-6 h-6 rounded-full bg-accent/10 text-accent text-xs font-bold flex items-center justify-center flex-shrink-0">{i + 1}</span>
                          <p className="flex-1 text-sm leading-relaxed break-words">{it.text} <Links links={it.links} /></p>
                          <span className={`self-start text-[11px] font-semibold px-2 py-0.5 rounded-full border whitespace-nowrap ${
                            isWajib ? "bg-red-50 text-red-600 border-red-200" : "bg-slate-50 text-slate-600 border-slate-200"
                          }`}>{it.status}</span>
                        </li>
                      );
                    })}
                  </ol>
                </>
              )}
            </div>
          )
        )}
      </div>

      {permit.url && (
        <div className="px-5 py-3 border-t border-border bg-secondary/30 text-xs text-muted-foreground flex items-center justify-between gap-3 flex-wrap">
          <span>Sumber: SIMPONIE Kota Tangerang Selatan</span>
          <a href={permit.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-accent font-semibold hover:underline">
            Lihat halaman asli <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      )}
    </div>
  );
}

/** Hook sederhana untuk memuat daftar jenis perizinan. */
export function usePermitTypes() {
  const [items, setItems] = useState<PermitType[] | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    let alive = true;
    loadPermitTypes()
      .then(d => { if (alive) setItems(d); })
      .catch(() => { if (alive) setError("Gagal memuat data jenis perizinan."); });
    return () => { alive = false; };
  }, []);
  return { items, error };
}

/**
 * Layar pemilihan jenis perizinan: daftar (dengan pencarian) → detail informasi → konfirmasi.
 */
export function PermitTypePicker({ serviceLabel, onBack, onSelect }: {
  serviceLabel: string;
  onBack: () => void;
  onSelect: (permit: PermitType) => void;
}) {
  const { items, error } = usePermitTypes();
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<PermitType | null>(null);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!items) return [];
    return s ? items.filter(p => p.name.toLowerCase().includes(s)) : items;
  }, [items, q]);

  if (selected) {
    return (
      <div>
        <button type="button" onClick={() => setSelected(null)}
          className="flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground mb-5">
          <ChevronLeft className="h-4 w-4" /> Kembali ke daftar jenis perizinan
        </button>
        <div className="mb-5">
          <p className="text-xs font-semibold text-accent uppercase tracking-wide mb-1">{serviceLabel}</p>
          <h1 className="text-2xl font-extrabold text-foreground" style={heading}>{selected.name}</h1>
        </div>
        <PermitInfo permit={selected} />
        <div className="mt-5 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-start gap-2.5 text-xs text-amber-800">
          <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
          Pelajari persyaratan di atas dan siapkan dokumen yang dibutuhkan sebelum melanjutkan pengisian formulir.
        </div>
        <button type="button" onClick={() => onSelect(selected)}
          className="mt-5 w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-accent text-white text-base font-extrabold hover:bg-blue-700 active:scale-[0.98] transition-all shadow-xl shadow-accent/30">
          <CheckCircle className="h-5 w-5" /> Pilih & Lanjutkan Pengisian Formulir
        </button>
      </div>
    );
  }

  return (
    <div>
      <button type="button" onClick={onBack}
        className="flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground mb-5">
        <ChevronLeft className="h-4 w-4" /> Kembali ke jenis layanan
      </button>
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-accent/10 mb-5">
          <FileText className="h-7 w-7 text-accent" />
        </div>
        <h1 className="text-2xl font-extrabold text-foreground mb-2" style={heading}>Pilih Jenis Perizinan</h1>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          Layanan <strong>{serviceLabel}</strong>. Pilih jenis perizinan yang sesuai untuk melihat informasi dan persyaratannya.
        </p>
      </div>

      <div className="relative mb-4">
        <Search className="h-4 w-4 text-muted-foreground absolute left-4 top-1/2 -translate-y-1/2" />
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Cari jenis perizinan, mis. dokter, bidan, apoteker…"
          className="w-full pl-11 pr-4 py-3 rounded-xl border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-accent/30" />
      </div>

      {error && <p className="text-sm text-red-600 text-center py-6">{error}</p>}
      {!items && !error && (
        <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Memuat jenis perizinan…
        </div>
      )}
      {items && (
        <>
          <p className="text-xs text-muted-foreground mb-3">{filtered.length} dari {items.length} jenis perizinan</p>
          <div className="grid grid-cols-1 gap-3">
            {filtered.map(p => (
              <button key={p.value} type="button" onClick={() => setSelected(p)}
                className="group flex items-center gap-4 p-4 bg-white rounded-2xl border border-border hover:border-accent/40 hover:shadow-lg hover:-translate-y-0.5 transition-all text-left">
                <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                  <FileText className="h-5 w-5 text-blue-700" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-sm text-foreground group-hover:text-accent transition-colors" style={heading}>{p.name}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {[p.masaBerlaku && `Berlaku ${p.masaBerlaku}`, p.biaya, `${p.syarat.length} kategori syarat`].filter(Boolean).join(" · ")}
                  </p>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-accent flex-shrink-0" />
              </button>
            ))}
            {filtered.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">Tidak ada jenis perizinan yang cocok dengan "{q}".</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}