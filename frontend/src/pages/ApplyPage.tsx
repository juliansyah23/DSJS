import { useState, useRef, useEffect, useCallback } from "react";
import {
  Check, Lock, MapPin, ArrowLeft, ChevronLeft, ChevronRight,
  FileText, User, Building, BookOpen, Upload, Download,
  CheckCircle, Info, AlertTriangle, Save, Clock, Trash2,
  Plus, Folder,
} from "lucide-react";
import { View, AuthUser, ServiceType, UserProfile } from "../app/types";
import { SERVICE_META, provinces, cities, districts, villages } from "../app/data";
import { PermitType, needsPermitType, PERMIT_FIELDS } from "../app/perizinan";
import { PermitTypePicker, PermitInfo, usePermitTypes } from "../app/components/PermitTypePicker";
import { Inp, Sel, Tex } from "../app/components/shared";
import { api, ApiDraft, ApiError } from "../app/api";
import { SIP_FORM_CONFIG, PermitField, PermitFieldUnit } from "../app/sipFormConfig";



function validateFormat(value: string, format: "npwp" | "postal" | "tel" | "email"): string | null {
  if (!value.trim()) return null;
  const patterns: Record<typeof format, RegExp> = {
    npwp: /^(\d{15}|\d{16})$/,
    postal: /^\d{5}$/,
    tel: /^(?:\+62|62|0)\d{8,13}$/,
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  };
  const messages: Record<typeof format, string> = {
    npwp: "NPWP harus 15 atau 16 digit angka",
    postal: "Kode pos harus 5 digit angka",
    tel: "Nomor telepon tidak valid",
    email: "Format email tidak valid",
  };
  return patterns[format].test(value) ? null : messages[format];
}

// ─── Step indicator ─────────────────────────────────────────────────────────

function StepIndicator({ current, labels }: { current: number; labels?: string[] }) {
  const steps = labels ?? ["Data Pemohon", "Lokasi Izin", "Data Perusahaan", "Data Permohonan", "Upload Berkas"];
  return (
    <div className="flex items-center" style={{ fontFamily: "'Inter', sans-serif" }}>
      {steps.map((label, i) => (
        <div key={i} className="flex items-center flex-1 last:flex-none">
          <div className="flex flex-col items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all flex-shrink-0 ${
              i + 1 < current ? "bg-emerald-500 text-white shadow-md shadow-emerald-200" :
              i + 1 === current ? "bg-accent text-white shadow-md shadow-accent/30 ring-4 ring-accent/15" :
              "bg-muted text-muted-foreground"
            }`}>
              {i + 1 < current ? <Check className="h-3.5 w-3.5" /> : i + 1}
            </div>
            <span className={`mt-1.5 text-[10px] font-medium hidden sm:block whitespace-nowrap ${
              i + 1 === current ? "text-accent" : i + 1 < current ? "text-emerald-500" : "text-muted-foreground"
            }`}>{label}</span>
          </div>
          {i < steps.length - 1 && (
            <div className={`flex-1 h-px mx-1.5 mb-4 sm:mb-0 ${i + 1 < current ? "bg-emerald-300" : "bg-border"}`} />
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Map mock ────────────────────────────────────────────────────────────────

function MapView() {
  const [locked, setLocked] = useState(false);
  return (
    <div className="space-y-3">
      <div className="relative h-64 rounded-xl overflow-hidden border border-border bg-slate-100">
        <div className="absolute inset-0" style={{
          backgroundImage: "linear-gradient(rgba(148,163,184,0.25) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.25) 1px, transparent 1px)",
          backgroundSize: "36px 36px",
        }} />
        <div className="absolute bg-white/75 h-3" style={{ width: "130%", top: "42%", left: "-15%", transform: "rotate(-4deg)" }} />
        <div className="absolute bg-white/75 w-3" style={{ height: "130%", left: "56%", top: "-15%", transform: "rotate(3deg)" }} />
        <div className="absolute bg-white/55 h-2" style={{ width: "55%", top: "68%", left: "25%" }} />
        <div className="absolute bg-white/55 w-2" style={{ height: "48%", left: "28%", top: "22%" }} />
        <div className="absolute rounded-full bg-emerald-200/50" style={{ width: "72px", height: "56px", top: "16%", left: "12%" }} />
        <div className="absolute rounded-full bg-emerald-200/40" style={{ width: "48px", height: "36px", bottom: "18%", right: "18%" }} />
        {[{ x: "44%", y: "28%", w: "32px", h: "24px" }, { x: "62%", y: "52%", w: "22px", h: "20px" }, { x: "23%", y: "54%", w: "28px", h: "22px" }, { x: "70%", y: "22%", w: "18px", h: "16px" }].map((b, i) => (
          <div key={i} className="absolute bg-slate-300/70 rounded-sm" style={{ left: b.x, top: b.y, width: b.w, height: b.h }} />
        ))}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-full">
          <MapPin className={`h-9 w-9 drop-shadow-lg ${locked ? "text-emerald-600" : "text-accent"}`} fill="currentColor" fillOpacity={0.25} />
        </div>
        <div className="absolute top-3 right-3 flex flex-col gap-1">
          {["+", "−"].map(c => (
            <div key={c} className="w-7 h-7 bg-white rounded shadow-sm flex items-center justify-center cursor-pointer hover:bg-gray-50 text-sm font-bold text-gray-600 select-none">{c}</div>
          ))}
        </div>
        <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm rounded-lg px-2.5 py-1.5 text-xs font-medium text-gray-700 shadow-sm">Peta Lokasi Izin</div>
        {locked && (
          <div className="absolute bottom-3 left-3 bg-emerald-500 text-white rounded-lg px-2.5 py-1.5 text-xs font-semibold flex items-center gap-1.5 shadow-sm">
            <Lock className="h-3 w-3" /> Koordinat Terkunci
          </div>
        )}
      </div>
      <div className="flex items-center gap-3">
        <div className="flex-1 grid grid-cols-2 gap-2">
          {[{ label: "Latitude", val: "-6.914744" }, { label: "Longitude", val: "107.609810" }].map(({ label, val }) => (
            <div key={label} className="bg-secondary/70 rounded-lg px-3 py-2">
              <div className="text-[9px] text-muted-foreground uppercase tracking-widest font-semibold mb-0.5">{label}</div>
              <div className="text-sm font-mono font-semibold text-foreground">{val}</div>
            </div>
          ))}
        </div>
        <button
          onClick={() => setLocked(!locked)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all flex-shrink-0 ${
            locked ? "bg-emerald-500 text-white hover:bg-emerald-600 shadow-md shadow-emerald-200" : "bg-accent text-white hover:bg-blue-700 shadow-md shadow-accent/20"
          }`}
        >
          <Lock className="h-4 w-4" />
          {locked ? "Terkunci" : "Kunci Koordinat"}
        </button>
      </div>
    </div>
  );
}

// ─── File upload ─────────────────────────────────────────────────────────────

function FileItem({ label, note, downloadable = false, required = true, showError = false, onFileChange, accept, acceptError, status, link, items }: {
  label: string; note?: string; downloadable?: boolean; required?: boolean; showError?: boolean; onFileChange?: (f: File | null) => void;
  accept?: string; acceptError?: string; status?: string; link?: string; items?: string[];
}) {
  const [file, setFile] = useState<File | null>(null);
  const [typeError, setTypeError] = useState(false);
  const ref = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = e.target.files?.[0] ?? null;
    if (picked && accept && !picked.type.includes(accept.replace(/,/g, "|"))) {
      setTypeError(true); setFile(null); onFileChange?.(null); e.target.value = ""; return;
    }
    setTypeError(false); setFile(picked); onFileChange?.(picked);
  };

  const hasError = showError && !file;
  return (
    <div className={`p-4 rounded-xl border-2 transition-all ${
      file ? "border-emerald-300 bg-emerald-50/60" :
      hasError ? "border-red-300 bg-red-50/40" :
      "border-dashed border-border hover:border-accent/40 bg-white"
    }`}>
      <div className="flex items-start gap-3">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${file ? "bg-emerald-100" : hasError ? "bg-red-100" : "bg-secondary"}`}>
          {file ? <Check className="h-4 w-4 text-emerald-600" /> : hasError ? <AlertTriangle className="h-4 w-4 text-red-500" /> : <Upload className="h-4 w-4 text-muted-foreground" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-foreground leading-snug flex items-center flex-wrap gap-x-1.5 gap-y-1">
            {label} {required && <span className="text-red-500 text-xs">*</span>}
            {status && (
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                status === "Tentatif" ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-blue-50 text-blue-700 border-blue-200"
              }`}>{status}</span>
            )}
          </div>
          {items && items.length > 0 && (
            <ul className="mt-1 space-y-0.5 list-disc pl-4 text-xs text-muted-foreground leading-relaxed">
              {items.map((it, idx) => <li key={idx}>{it}</li>)}
            </ul>
          )}
          {note && <div className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{note}</div>}
          {file && <div className="text-xs text-emerald-600 mt-1 font-semibold truncate">{file.name}</div>}
          {typeError && <div className="text-xs text-red-500 mt-1 font-semibold flex items-center gap-1"><AlertTriangle className="h-3 w-3" />{acceptError ?? "Hanya file PDF yang diperbolehkan"}</div>}
          {hasError && !typeError && <div className="text-xs text-red-500 mt-1 font-semibold flex items-center gap-1"><AlertTriangle className="h-3 w-3" />Berkas wajib diunggah</div>}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0 mt-0.5">
          {downloadable && (
            <button className="p-1.5 rounded-lg bg-secondary hover:bg-muted transition-colors" title="Unduh Contoh">
              <Download className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          )}
          {link && (
            <a href={link} target="_blank" rel="noopener noreferrer"
              className="p-1.5 rounded-lg bg-secondary hover:bg-muted transition-colors" title="Unduh / buka tautan">
              <Download className="h-3.5 w-3.5 text-muted-foreground" />
            </a>
          )}
          <button onClick={() => ref.current?.click()}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              file ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200" : "bg-accent text-white hover:bg-blue-700"
            }`}>
            {file ? "Ganti" : "Unggah"}
          </button>
        </div>
      </div>
      <input ref={ref} type="file" accept={accept ?? "application/pdf"} className="hidden" onChange={handleChange} />
    </div>
  );
}

const FILE_LABELS = [
  { label: "Surat Pernyataan Bermaterai Rp 10.000", note: "Menyatakan data dan dokumen yang disampaikan benar dan valid", downloadable: true },
  { label: "Nomor Induk Berusaha (NIB) dari OSS RI", note: "Bagi yang belum memiliki NIB, daftar melalui oss.go.id terlebih dahulu" },
  { label: "Scan BPJS Ketenagakerjaan" },
  { label: "Scan KTP / Paspor Pemohon, Direktur, atau Penanggung Jawab" },
  { label: "Scan Akta Pendirian Badan Hukum & SK Kemenkumham", note: "Termasuk akta perubahan jika ada" },
  { label: "Laporan PBB atau STTS Tahun Terakhir" },
  { label: "Bukti Kepemilikan Lahan, IMB/PBG, atau Dokumen Sewa", note: "Pilih salah satu yang sesuai kondisi" },
  { label: "Struktur Organisasi dan Uraian Tugas" },
  { label: "Denah Lokasi, Foto Gedung, Foto Kelas & Inventaris", note: "Dapat dikompilasi dalam satu file PDF" },
];

/** Blok info biru (dipakai SIMBG). */
function InfoBlock({ items }: { items: string[] }) {
  if (!items.length) return null;
  return (
    <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-4 flex gap-3">
      <Info className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
      <ul className="space-y-1.5 text-xs text-blue-800 leading-relaxed list-disc pl-3">
        {items.map((t, i) => <li key={i}>{t}</li>)}
      </ul>
    </div>
  );
}

/** Label field standar (dengan penanda wajib + tip). */
function FieldLabel({ label, required, tip }: { label: string; required?: boolean; tip?: string }) {
  return (
    <div className="text-sm font-medium text-foreground flex items-center flex-wrap gap-x-0.5">
      {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      {tip && <span className="text-xs text-muted-foreground font-normal">({tip})</span>}
    </div>
  );
}

const inputCls = (error?: string) =>
  `h-10 px-3 rounded-lg border text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 transition-all w-full ${
    error ? "border-red-400 bg-red-50/30 focus:ring-red-200 focus:border-red-400" : "border-border bg-white focus:ring-accent/25 focus:border-accent"
  }`;

/** Input angka dengan satuan di kanan (string atau dropdown). */
function NumberField({ field, value, error, onChange }: {
  field: PermitField; value: string; error?: string; onChange: (v: string) => void;
}) {
  const unit: PermitFieldUnit | undefined = field.unit;
  const unitIsSelect = typeof unit === "object" && unit !== null;
  const unitOptions = unitIsSelect ? (unit.options ?? [unit.placeholder ?? "Rasio"]) : [];
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-foreground flex items-center flex-wrap gap-x-0.5">
        {field.label}{field.required && <span className="text-red-500 ml-0.5">*</span>}
        {field.note && <span className="text-xs text-muted-foreground font-normal">({field.note})</span>}
      </label>
      <div className="flex gap-2">
        <input type="number" min={field.min} placeholder={field.placeholder ?? field.label} value={value}
          onChange={e => onChange(e.target.value)} className={inputCls(error)} />
        {unit && !unitIsSelect && (
          <span className="h-10 px-3 rounded-lg border border-border bg-secondary text-sm flex items-center text-muted-foreground whitespace-nowrap">{unit}</span>
        )}
        {unit && unitIsSelect && (
          <select className="h-10 px-2 rounded-lg border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-accent/25 focus:border-accent">
            {unitOptions.map(o => <option key={o}>{o}</option>)}
          </select>
        )}
      </div>
      {error && <p className="text-xs text-red-500 flex items-center gap-1"><AlertTriangle className="h-3 w-3 flex-shrink-0" />{error}</p>}
    </div>
  );
}

/** Grup radio (satu pilihan). */
function RadioField({ field, value, error, onChange }: {
  field: PermitField; value: string; error?: string; onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <FieldLabel label={field.label} required={field.required} tip={field.note} />
      <div className="flex flex-wrap gap-2">
        {(field.options ?? []).map(opt => (
          <label key={opt} className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm cursor-pointer transition-all ${
            value === opt ? "border-accent bg-accent/5 font-semibold text-accent" : "border-border bg-white hover:border-accent/40"
          }`}>
            <input type="radio" name={field.id} checked={value === opt} onChange={() => onChange(opt)} className="accent-[#1a56db]" />
            {opt}
          </label>
        ))}
      </div>
      {error && <p className="text-xs text-red-500 flex items-center gap-1"><AlertTriangle className="h-3 w-3 flex-shrink-0" />{error}</p>}
    </div>
  );
}

/** Grup checkbox (multi-pilihan, disimpan dipisah koma). */
function CheckboxField({ field, value, error, onChange }: {
  field: PermitField; value: string; error?: string; onChange: (v: string) => void;
}) {
  const selected = value ? value.split(",").map(s => s.trim()).filter(Boolean) : [];
  const toggle = (opt: string) => {
    const next = selected.includes(opt) ? selected.filter(s => s !== opt) : [...selected, opt];
    onChange(next.join(", "));
  };
  return (
    <div className="flex flex-col gap-2">
      <FieldLabel label={field.label} required={field.required} tip={field.note} />
      <div className="flex flex-wrap gap-2">
        {(field.options ?? []).map(opt => (
          <label key={opt} className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm cursor-pointer transition-all ${
            selected.includes(opt) ? "border-accent bg-accent/5 font-semibold text-accent" : "border-border bg-white hover:border-accent/40"
          }`}>
            <input type="checkbox" checked={selected.includes(opt)} onChange={() => toggle(opt)} className="accent-[#1a56db]" />
            {opt}
          </label>
        ))}
      </div>
      {error && <p className="text-xs text-red-500 flex items-center gap-1"><AlertTriangle className="h-3 w-3 flex-shrink-0" />{error}</p>}
    </div>
  );
}

function PermitFieldItem({ field, value, error, onChange, onFileChange }: {
  field: PermitField; value: string; error?: string; onChange: (v: string) => void; onFileChange?: (file: File | null) => void;
}) {
  if (field.type === "select") {
    return <Sel label={field.label} options={field.options ?? []} required={field.required} value={value} onChange={onChange} error={error} tip={field.note} />;
  }
  if (field.type === "textarea") {
    return <Tex label={field.label} placeholder={field.placeholder ?? field.label} required={field.required} value={value} onChange={onChange} error={error} tip={field.note} />;
  }
  if (field.type === "file") {
    return (
      <div className="flex flex-col gap-1.5">
        <FileItem label={field.label} note={field.note} required={field.required} accept={field.accept ?? "image/jpeg"} acceptError="Tipe file tidak diperbolehkan"
          showError={field.required && !!error} onFileChange={file => { onChange(file ? file.name : ""); onFileChange?.(file); }} />
      </div>
    );
  }
  if (field.type === "radio") {
    return <RadioField field={field} value={value} error={error} onChange={onChange} />;
  }
  if (field.type === "checkbox") {
    return <CheckboxField field={field} value={value} error={error} onChange={onChange} />;
  }
  if (field.type === "number") {
    return <NumberField field={field} value={value} error={error} onChange={onChange} />;
  }
  return <Inp label={field.label} placeholder={field.placeholder ?? field.label} type={field.type} required={field.required} value={value} onChange={onChange} error={error} tip={field.note} />;
}

function ConfigStep4({ config, f, err, set, onFileChange }: {
  config: import("../app/sipFormConfig").PermitFormConfig;
  f: Record<string, string>;
  err: Record<string, string>;
  set: (key: string, val: string) => void;
  onFileChange: (key: string, file: File | null) => void;
}) {
  // Isi nilai default (mis. select dengan defaultValue) sekali saat mount.
  useEffect(() => {
    config.sections.forEach(section => section.fields.forEach(field => {
      if (field.defaultValue && (f[field.id] ?? "") === "") set(field.id, field.defaultValue);
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <div className="space-y-5">
      {config.sections.filter(section => !section.visibleIf || (f[section.visibleIf.field] ?? "") === section.visibleIf.equals).map(section => (
        <div key={section.title} className="bg-white rounded-2xl border border-border p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center"><FileText className="h-4 w-4 text-amber-600" /></div>
            <div>
              <h2 className="font-extrabold text-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{section.title}</h2>
              <p className="text-xs text-muted-foreground">Lengkapi data sesuai dokumen resmi yang dimiliki</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {section.fields.map(field => (
              <div key={field.id} className={field.type === "textarea" || field.type === "file" ? "sm:col-span-2" : ""}>
                <PermitFieldItem field={field} value={f[field.id] ?? ""} error={err[field.id]} onFileChange={file => onFileChange(field.id, file)} onChange={v => set(field.id, v)} />
              </div>
            ))}
          </div>
          {section.info && section.info.length > 0 && <div className="mt-4"><InfoBlock items={section.info} /></div>}
        </div>
      ))}
      {config.info && config.info.length > 0 && <InfoBlock items={config.info} />}
    </div>
  );
}

interface Step5FileLabel {
  label: string;
  note?: string;
  status?: string;
  link?: string;
  items?: string[];
  downloadable?: boolean;
}

function Step5Files({ onValidChange, onFilesChange, labels }: {
  onValidChange: (valid: boolean) => void;
  onFilesChange: (files: (File | null)[]) => void;
  labels: Step5FileLabel[];
}) {
  const [files, setFiles] = useState<(File | null)[]>(Array(labels.length).fill(null));
  const [showErrors, setShowErrors] = useState(false);

  useEffect(() => {
    const next = Array(labels.length).fill(null);
    setFiles(next);
    setShowErrors(false);
    onValidChange(false);
    onFilesChange(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [labels]);

  const updateFile = (i: number, picked: File | null) => {
    setFiles(prev => {
      const next = [...prev]; next[i] = picked;
      onValidChange(next.length === labels.length && labels.every((_, index) => next[index] != null));
      onFilesChange(next);
      return next;
    });
  };

  (Step5Files as any)._triggerValidation = () => setShowErrors(true);

  const allFilled = labels.length > 0 && files.length === labels.length && labels.every((_, index) => files[index] != null);
  const filled = files.filter(v => v !== null).length;

  return (
    <div className="bg-white rounded-2xl border border-border p-6 sm:p-8">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center">
          <Upload className="h-4 w-4 text-indigo-600" />
        </div>
        <div>
          <h2 className="font-extrabold text-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Unggah Berkas Persyaratan</h2>
          <p className="text-xs text-muted-foreground">Format: <strong>PDF saja</strong>. Ukuran maksimal 5 MB per berkas. Semua berkas wajib diunggah.</p>
        </div>
      </div>
      <div className="flex items-center justify-between bg-secondary/50 rounded-xl px-4 py-3 mt-4 mb-2">
        <span className="text-xs text-muted-foreground font-medium">Progress unggah berkas</span>
        <span className="text-xs font-bold text-foreground tabular-nums">{filled} / {labels.length}</span>
      </div>
      <div className="h-1.5 bg-secondary rounded-full overflow-hidden mb-5">
        <div className={`h-full rounded-full transition-all duration-500 ${allFilled ? "bg-emerald-500" : "bg-accent"}`}
          style={{ width: `${labels.length ? (filled / labels.length) * 100 : 0}%` }} />
      </div>
      <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-center gap-2.5 text-xs text-amber-800 mb-5">
        <Info className="h-4 w-4 text-amber-500 flex-shrink-0" />
        Pastikan semua dokumen terbaca jelas, dalam format <strong>PDF</strong>, dan berukuran di bawah 5 MB sebelum diunggah.
      </div>
      <div className="space-y-3">
        {labels.map((item, i) => (
          <FileItem key={i} label={item.label} note={item.note} downloadable={item.downloadable}
            status={item.status} link={item.link} items={item.items}
            showError={showErrors} onFileChange={picked => updateFile(i, picked)} />
        ))}
      </div>
      {showErrors && !allFilled && (
        <div className="mt-4 flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          <AlertTriangle className="h-4 w-4 flex-shrink-0" />
          <span>Masih ada <strong>{labels.length - filled} berkas</strong> yang belum diunggah. Lengkapi semua berkas sebelum mengajukan permohonan.</span>
        </div>
      )}
    </div>
  );
}

// ─── Multi-draft helpers ─────────────────────────────────────────────────────

type DraftItem = {
  id: number;
  serviceType: ServiceType | null;
  step: number;
  skipCompany: boolean;
  formData: Record<string, string>;
  savedAt: string;
};

function fromApiDraft(draft: ApiDraft): DraftItem {
  return {
    id: draft.id,
    serviceType: draft.service_type,
    step: draft.current_step,
    skipCompany: draft.skip_company,
    formData: draft.form_data,
    savedAt: draft.updated_at,
  };
}

function fmtTime(iso: string): string {
  const d = new Date(iso);
  return (
    d.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" }) +
    " · " +
    d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
  );
}

const STEP_LABELS: Record<number, string> = {
  1: "Data Pemohon",
  2: "Lokasi Izin",
  3: "Data Perusahaan",
  4: "Data Permohonan",
  5: "Upload Berkas",
};

// ─── Field tips lookup ────────────────────────────────────────────────────────

const FIELD_TIPS: Record<string, string> = {
  ktp:               "NIK adalah 16 digit angka unik yang tertera di KTP Anda. Contoh: 3271012345678901.",
  npwp:              "NPWP (Nomor Pokok Wajib Pajak) pribadi Anda. Jika belum memiliki, kolom ini boleh dikosongkan.",
  name:              "Isi nama lengkap sesuai yang tertulis di KTP, tanpa gelar atau singkatan.",
  phone:             "Nomor WhatsApp aktif untuk menerima update status permohonan Anda.",
  province:          "Pilih provinsi sesuai alamat yang tertera di KTP Anda.",
  city:              "Pilih kabupaten atau kota sesuai alamat di KTP Anda.",
  district:          "Pilih kecamatan sesuai alamat di KTP Anda.",
  village:           "Pilih kelurahan atau desa sesuai alamat di KTP Anda.",
  address:           "Tuliskan alamat lengkap: nama jalan, nomor rumah, RT/RW, dan kelurahan.",
  notes:             "Tambahkan catatan atau keterangan lain yang relevan dengan permohonan Anda.",
  permitCity:        "Kota/kabupaten tempat usaha Anda berada. Boleh berbeda dari domisili KTP.",
  permitDistrict:    "Kecamatan lokasi usaha atau kegiatan yang dimohonkan izinnya.",
  permitVillage:     "Kelurahan atau desa lokasi usaha yang dimohonkan izinnya.",
  permitAddress:     "Alamat lengkap lokasi usaha, termasuk nama jalan, nomor bangunan, dan RT/RW.",
  companyName:       "Nama resmi badan usaha sesuai akta pendirian. Contoh: PT. Maju Bersama.",
  companyNpwp:       "NPWP atas nama perusahaan — berbeda dengan NPWP pribadi Anda.",
  companyPhone:      "Nomor telepon kantor atau HP penanggung jawab yang bisa dihubungi.",
  companyEmail:      "Alamat email resmi perusahaan untuk korespondensi administrasi.",
  companyFax:        "Nomor fax kantor jika ada. Boleh dikosongkan jika tidak memiliki fax.",
  businessType:      "Pilih bidang usaha yang paling sesuai dengan kegiatan utama perusahaan Anda.",
  companyProvince:   "Pilih provinsi alamat domisili atau kantor perusahaan.",
  companyCity:       "Pilih kabupaten atau kota tempat kantor perusahaan berada.",
  companyDistrict:   "Pilih kecamatan tempat kantor perusahaan berada.",
  companyVillage:    "Pilih kelurahan atau desa tempat kantor perusahaan berada.",
  companyAddress:    "Alamat lengkap kantor atau tempat usaha Anda.",
  zipCode:           "5 digit kode pos wilayah perusahaan Anda. Cek di pos.go.id atau Google Maps.",
  decName:           "Nama pemohon yang akan dicantumkan dalam Surat Keputusan (SK) izin.",
  decAddress:        "Alamat yang akan tercetak dalam Surat Keputusan izin.",
  education:         "Pilih jenjang pendidikan terakhir yang telah Anda selesaikan.",
  position:          "Jabatan resmi Anda dalam lembaga, misalnya: Direktur, Kepala Lembaga.",
  decPhone:          "Nomor telepon atau fax yang dapat dihubungi petugas terkait permohonan ini.",
  institutionLembaga:"Nama resmi lembaga kursus atau pelatihan yang mengajukan izin.",
  instName:          "Nama lembaga sesuai akta pendirian atau dokumen resmi lembaga.",
  instAddress:       "Alamat operasional lembaga tempat kegiatan kursus diselenggarakan.",
  admin:             "Nama petugas atau staf yang mengelola administrasi lembaga.",
  building:          "Nama gedung, nomor lantai, atau nomor ruangan tempat kegiatan berlangsung.",
  equipment:         "Daftar peralatan dan fasilitas yang tersedia, misal: 20 komputer, 30 kursi.",
  curriculum:        "Gambaran singkat materi pelajaran, durasi kursus, dan metode pengajaran.",
  students:          "Jumlah siswa atau peserta didik yang direncanakan per angkatan.",
  fees:              "Biaya kursus per peserta, misalnya: Rp 500.000 per bulan.",
};

const DEFAULT_FORM: Record<string, string> = {
  // Step 1 — Data Pemohon
  ktp:              "",
  npwp:             "",
  name:             "",
  phone:            "",
  province:         "",
  city:             "",
  district:         "",
  village:          "",
  address:          "",
  notes:            "",
  // Step 2 — Lokasi Izin
  permitCity:       "",
  permitDistrict:   "",
  permitVillage:    "",
  permitAddress:    "",
  // Step 3 — Data Perusahaan
  companyName:      "",
  companyNpwp:      "",
  companyPhone:     "",
  companyEmail:     "",
  companyFax:       "",
  businessType:     "",
  companyProvince:  "",
  companyCity:      "",
  companyDistrict:  "",
  companyVillage:   "",
  companyAddress:   "",
  zipCode:          "",
  // Step 4 — Data Permohonan
  decName:          "",
  decAddress:       "",
  education:        "",
  position:         "",
  decPhone:         "",
  institutionLembaga: "",
  instName:         "",
  instAddress:      "",
  admin:            "",
  building:         "",
  equipment:        "",
  curriculum:       "",
  students:         "",
  fees:             "",
};

export function ApplyPage({ setView, auth, profile }: { setView: (v: View) => void; auth: AuthUser | null; profile: UserProfile | null }) {
  const [serviceType, setServiceType] = useState<ServiceType | null>(null);
  const [pendingService, setPendingService] = useState<ServiceType | null>(null);
  const [creatingDraft, setCreatingDraft] = useState(false);
  const creatingDraftRef = useRef(false);
  const { items: permitTypes } = usePermitTypes();
  const [step, setStep] = useState(1);
  const [skipCompany, setSkipCompany] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [f, setF] = useState<Record<string, string>>({});
  const [err, setErr] = useState<Record<string, string>>({});
  const [step5Valid, setStep5Valid] = useState(false);
  const [step5Touched, setStep5Touched] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<(File | null)[]>([]);
  const [step4FilesByField, setStep4FilesByField] = useState<Record<string, File | null>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const selectedPermitValue = f[PERMIT_FIELDS.value] ?? "";
  const permitConfig = SIP_FORM_CONFIG[selectedPermitValue] ?? (serviceType ? SIP_FORM_CONFIG[serviceType] : undefined);
  const step5Labels: Step5FileLabel[] = permitConfig?.files ?? FILE_LABELS;
  const step4FileFields = permitConfig?.sections
    .filter(section => !section.visibleIf || f[section.visibleIf.field] === section.visibleIf.equals)
    .flatMap(section => section.fields)
    .filter(field => field.type === "file") ?? [];
  const step4Files = step4FileFields
    .map(field => ({ file: step4FilesByField[field.id] ?? null, label: field.label }))
    .filter((item): item is { file: File; label: string } => item.file !== null);
  // Labels are stored in a VARCHAR(150) column by the API. Keep the full
  // explanatory text in the UI, but send a bounded label during submission.
  const uploadLabels = step5Labels.map(item => item.label.slice(0, 150));
  // SIMBG & OSS RBA tidak punya Tahap 5 (Upload Berkas) — wizard berakhir di Tahap 4 lalu submit.
  const hasStep5 = serviceType !== "simbg" && serviceType !== "oss";
  // Untuk OSS, Tahap 4 adalah Data Usaha (bukan Data Permohonan).
  const step4Label = serviceType === "oss" ? "Data Usaha" : "Data Permohonan";
  const totalSteps = hasStep5 ? 5 : 4;
  const stepLabels = hasStep5
    ? undefined
    : ["Data Pemohon", "Lokasi Izin", "Data Perusahaan", step4Label];
  const [submittedCode, setSubmittedCode] = useState("");

  // Assistance mode from profile
  const showTip  = profile?.serviceModel === "bantuan" || profile?.serviceModel === "bantuan_penuh";
  const showChat = profile?.serviceModel === "bantuan_penuh";
  // Helper: returns tip text only when tips are active
  const t = (key: string) => showTip ? (FIELD_TIPS[key] ?? undefined) : undefined;

  // Which view to show in the selection screen
  const [selView, setSelView] = useState<"list" | "pick-service">("list");
  // Confirm-new popup (shown when user has drafts and clicks "Ajukan Perizinan Baru")
  const [showNewConfirm, setShowNewConfirm] = useState(false);

  // Draft list (reactive)
  const [drafts, setDrafts] = useState<DraftItem[]>([]);
  const refreshDrafts = useCallback(async () => {
    if (!auth) return;
    try { setDrafts((await api.drafts()).map(fromApiDraft)); }
    catch { setDrafts([]); }
  }, [auth]);

  useEffect(() => { void refreshDrafts(); }, [refreshDrafts]);

  // Current draft ID (ref so debounce always reads latest)
  const draftId = useRef<number | null>(null);

  // Toast
  const [toast, setToast] = useState<"saved" | "deleted" | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const showToast = (kind: "saved" | "deleted") => {
    setToast(kind);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2400);
  };

  // Auto-save debounced 700ms
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const persistDraft = useCallback(async (item: DraftItem) => {
    const saved = await api.updateDraft(item.id, {
      service_type: item.serviceType,
      current_step: item.step,
      skip_company: item.skipCompany,
      form_data: item.formData,
    });
    setDrafts(current => current.map(d => d.id === saved.id ? fromApiDraft(saved) : d));
  }, []);

  const scheduleSave = useCallback((item: DraftItem) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      try {
        await persistDraft(item);
      } catch { /* auto-save akan dicoba kembali pada perubahan berikutnya */ }
    }, 700);
  }, [persistDraft]);

  const currentDraft = (formData = f): DraftItem | null => draftId.current === null ? null : ({
    id: draftId.current,
    serviceType,
    step,
    skipCompany,
    formData,
    savedAt: new Date().toISOString(),
  });

  const set = (key: string, val: string) => {
    const nextForm = { ...f, [key]: val };
    setF(prev => {
      const next = { ...prev, [key]: val };
      const draft = currentDraft(next);
      if (draft) scheduleSave(draft);
      return next;
    });
    // Revalidate the complete current step with the new value. This keeps
    // required, format, choice, and schema errors in sync after every edit.
    setErr(errorsForStep(step, nextForm));
  };

  // Save when step / serviceType / skipCompany changes
  useEffect(() => {
    const draft = currentDraft();
    if (draft) scheduleSave(draft);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, serviceType, skipCompany]);

  // Start a brand-new form with a fresh draft ID
  const startNew = async (svcType: ServiceType, permit?: PermitType) => {
    if (creatingDraftRef.current) return;
    if (needsPermitType(svcType) && !permit) { setPendingService(svcType); return; }
    const initialForm = { ...DEFAULT_FORM, ...(permit ? {
      [PERMIT_FIELDS.value]: permit.value, [PERMIT_FIELDS.name]: permit.name,
    } : {}) };
    creatingDraftRef.current = true;
    setCreatingDraft(true);
    setSubmitError("");
    try {
      const created = await api.createDraft({ service_type: svcType, current_step: 1, skip_company: false, form_data: initialForm });
      draftId.current = created.id;
      setDrafts(current => [fromApiDraft(created), ...current]);
    } catch (e) {
      setSubmitError(e instanceof ApiError ? e.firstValidationMessage() : "Draft baru gagal dibuat.");
      return;
    } finally {
      creatingDraftRef.current = false;
      setCreatingDraft(false);
    }
    setPendingService(null);
    setServiceType(svcType);
    setStep(1);
    setF(initialForm);
    setSkipCompany(false);
    setErr({});
  };

  // Resume an existing draft
  const resumeDraft = (d: DraftItem) => {
    draftId.current = d.id;
    setServiceType(d.serviceType);
    setStep(d.step);
    setSkipCompany(d.skipCompany);
    setF({ ...DEFAULT_FORM, ...d.formData });
    setErr({});
  };

  // Manual save
  const manualSave = async () => {
    const item = currentDraft();
    if (!item) return;
    try {
      await persistDraft(item);
      showToast("saved");
    } catch (e) {
      setSubmitError(e instanceof ApiError ? e.firstValidationMessage() : "Draft gagal disimpan.");
    }
  };

  // Delete a draft card from the list
  const removeDraftEntry = async (id: number) => {
    try {
      await api.deleteDraft(id);
      setDrafts(current => current.filter(d => d.id !== id));
      showToast("deleted");
    } catch (e) {
      setSubmitError(e instanceof ApiError ? e.firstValidationMessage() : "Draft gagal dihapus.");
    }
  };

  const required = (s: number): Array<{ key: string; label: string; rule?: (v: string) => string | null }> => {
    if (s === 4) {
      const config = permitConfig;
      if (config) {
        return config.sections
          .filter(sec => !sec.visibleIf || (f[sec.visibleIf.field] ?? "") === sec.visibleIf.equals)
          .flatMap(sec => sec.fields)
          .filter(field => field.required && field.type !== "file")
          .map(field => ({ key: field.id, label: field.label }));
      }
    }
    if (s === 1) return [
      { key: "ktp", label: "No. KTP", rule: v => /^\d{16}$/.test(v) ? null : "NIK harus 16 digit angka" },
      { key: "name", label: "Nama Lengkap" },
      { key: "phone", label: "No. HP / WhatsApp", rule: v => validateFormat(v, "tel") },
      { key: "province", label: "Provinsi" },
      { key: "city", label: "Kabupaten / Kota" },
      { key: "district", label: "Kecamatan" },
      { key: "village", label: "Kelurahan / Desa" },
      { key: "address", label: "Alamat Lengkap" },
    ];
    if (s === 2) return [
      { key: "permitCity", label: "Kabupaten / Kota" },
      { key: "permitDistrict", label: "Kecamatan" },
      { key: "permitVillage", label: "Kelurahan / Desa" },
      { key: "permitAddress", label: "Alamat / Lokasi Izin" },
    ];
    if (s === 3 && !skipCompany) return [
      { key: "companyName", label: "Nama Perusahaan" },
      { key: "companyNpwp", label: "NPWP Perusahaan", rule: v => validateFormat(v, "npwp") },
      { key: "companyPhone", label: "Nomor Telepon", rule: v => validateFormat(v, "tel") },
      { key: "companyEmail", label: "Email Perusahaan", rule: v => validateFormat(v, "email") },
      { key: "businessType", label: "Bidang Usaha" },
      { key: "companyProvince", label: "Provinsi" },
      { key: "companyCity", label: "Kabupaten / Kota" },
      { key: "companyDistrict", label: "Kecamatan" },
      { key: "companyVillage", label: "Kelurahan / Desa" },
      { key: "companyAddress", label: "Alamat Perusahaan" },
    ];
    if (s === 4) return [
      { key: "decName", label: "Nama Pemohon (SK)" },
      { key: "decAddress", label: "Alamat Pemohon (SK)" },
      { key: "education", label: "Jenis Pendidikan" },
      { key: "position", label: "Jabatan" },
      { key: "decPhone", label: "Nomor Telepon / Fax", rule: v => validateFormat(v, "tel") },
      { key: "institutionLembaga", label: "Nama Lembaga Kursus" },
      { key: "instName", label: "Nama Lembaga (Detail)" },
      { key: "instAddress", label: "Alamat Lembaga" },
      { key: "admin", label: "Administrasi" },
      { key: "building", label: "Gedung / Ruangan" },
      { key: "equipment", label: "Peralatan & Fasilitas" },
      { key: "curriculum", label: "Rencana Pelajaran" },
      { key: "students", label: "Jumlah Siswa", rule: v => /^\d+$/.test(v) && Number.isSafeInteger(Number(v)) ? null : "Jumlah siswa harus bilangan bulat nol atau lebih" },
      { key: "fees", label: "Biaya Kursus" },
    ];
    return [];
  };

  const errorsForStep = (s: number, values: Record<string, string> = f): Record<string, string> => {
    if (s === 5) return {}; // Uploads have their own validation, not the scraped table fields.
    const fields = required(s);
    const newErr: Record<string, string> = {};
    for (const { key, label, rule } of fields) {
      const val = values[key]?.trim() ?? "";
      if (!val) { newErr[key] = `${label} wajib diisi`; continue; }
      if (rule) { const msg = rule(val); if (msg) newErr[key] = msg; }
    }
    const optional: Array<[string, "npwp" | "postal" | "tel"]> = s === 1 ? [["npwp", "npwp"], ["postal", "postal"]] : s === 3 && !skipCompany ? [["companyFax", "tel"]] : [];
    optional.forEach(([key, format]) => {
      const error = validateFormat(values[key] ?? "", format);
      if (error) newErr[key] = error;
    });
    const choices: Record<string, string[]> = { province: provinces, city: cities, district: districts, village: villages, permitCity: cities, permitDistrict: districts, permitVillage: villages, companyProvince: provinces, companyCity: cities, companyDistrict: districts, companyVillage: villages };
    fields.forEach(({ key, label }) => {
      if (values[key]?.trim() && choices[key] && !choices[key].includes(values[key])) newErr[key] = `Pilih ${label} dari pilihan yang tersedia`;
    });

    return newErr;
  };

  const validate = (s: number) => {
    const errors = errorsForStep(s);
    setErr(errors);
    return Object.keys(errors).length === 0;
  };

  const go = async (dir: 1 | -1) => {
    if (submitting) return;
    if (dir === 1 && needsPermitType(serviceType) && !permitTypes?.some(p => p.value === f[PERMIT_FIELDS.value])) {
      setSubmitError("Pilih jenis perizinan terlebih dahulu.");
      return;
    }
    if (dir === -1 && step === 1) { draftId.current = null; setServiceType(null); setSelView("list"); return; }
    const lastStep = totalSteps;
    if (dir === 1 && step === lastStep) {
      for (const previousStep of [1, 2, 3, 4] as const) {
        if (previousStep >= step) continue;
        const errors = errorsForStep(previousStep);
        if (Object.keys(errors).length) {
          setStep(previousStep);
          setErr(errors);
          window.scrollTo({ top: 200, behavior: "smooth" });
          return;
        }
      }
      if (hasStep5) {
        setStep5Touched(true);
        if (!step5Valid) { (Step5Files as any)._triggerValidation?.(); window.scrollTo({ top: 200, behavior: "smooth" }); return; }
      }
    }
    if (dir === 1 && !validate(step)) { window.scrollTo({ top: 200, behavior: "smooth" }); return; }
    const next = step + dir;
    if (next > lastStep) {
      if (!serviceType || (serviceType === "sip" && (!step5Valid || uploadedFiles.length !== step5Labels.length || !step5Labels.every((_, index) => uploadedFiles[index] != null))) || submitting) return;
      setSubmitting(true);
      setSubmitError("");
      try {
        const application = await api.submitApplication({
          serviceType,
          skipCompany,
          draftId: draftId.current,
          formData: f,
          files: serviceType === "simbg"
            ? step4Files.map(item => item.file)
            : serviceType === "oss" ? [] : uploadedFiles.filter((file): file is File => file !== null),
          labels: serviceType === "simbg"
            ? step4Files.map(item => item.label)
            : serviceType === "oss" ? [] : uploadLabels,
        });
        setSubmittedCode(application.code);
        if (draftId.current) setDrafts(current => current.filter(d => d.id !== draftId.current));
        draftId.current = null;
        setSubmitted(true);
      } catch (e) {
        if (e instanceof ApiError && e.status === 422 && Object.keys(e.errors).length) {
          const details = Object.entries(e.errors)
            .flatMap(([field, messages]) => messages.map(message => `${field.replace(/^form_data\./, "")}: ${message}`));
          setSubmitError(`Data belum valid: ${details.join("; ")}`);
        } else {
          setSubmitError(e instanceof ApiError ? e.firstValidationMessage() : "Permohonan gagal diajukan.");
        }
        window.scrollTo({ top: 0, behavior: "smooth" });
      } finally {
        setSubmitting(false);
      }
      return;
    }
    setErr({});
    setStep(next as 1 | 2 | 3 | 4 | 5);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // ─── Login guard ───────────────────────────────────────────────────────────

  if (!auth) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 px-4">
        <div className="w-20 h-20 rounded-3xl bg-accent/10 flex items-center justify-center">
          <Lock className="h-9 w-9 text-accent" />
        </div>
        <div className="text-center">
          <h2 className="text-xl font-extrabold text-foreground mb-2" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Login Diperlukan</h2>
          <p className="text-sm text-muted-foreground max-w-xs">Anda harus masuk terlebih dahulu untuk mengajukan permohonan izin.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setView("login")} className="px-6 py-2.5 rounded-xl bg-accent text-white text-sm font-semibold hover:bg-accent/90 transition-colors">Masuk</button>
          <button onClick={() => setView("register")} className="px-6 py-2.5 rounded-xl border border-border text-sm font-medium hover:bg-secondary transition-colors">Daftar Akun</button>
        </div>
      </div>
    );
  }

  // ─── Service selection + draft list ───────────────────────────────────────

  if (pendingService || (serviceType && needsPermitType(serviceType) && !f[PERMIT_FIELDS.value])) {
    const svc = pendingService ?? serviceType!;
    return (
      <div className="max-w-3xl mx-auto px-4 py-10">
        {submitError && <p role="alert" className="mb-4 text-sm text-red-600">{submitError}</p>}
        <fieldset disabled={creatingDraft}>
          <PermitTypePicker serviceLabel={SERVICE_META[svc].label}
            onBack={() => { setPendingService(null); setServiceType(null); draftId.current = null; setSelView("pick-service"); }}
            onSelect={permit => {
              if (serviceType && draftId.current) {
                const next = { ...f, [PERMIT_FIELDS.value]: permit.value, [PERMIT_FIELDS.name]: permit.name };
                setF(next);
                const draft = currentDraft(next);
                if (draft) scheduleSave(draft);
              } else { void startNew(svc, permit); }
            }} />
        </fieldset>
        {creatingDraft && <p role="status" className="mt-4 text-sm">Menyiapkan formulir…</p>}
      </div>
    );
  }

  if (!serviceType) {
    return (
      <div className="min-h-screen bg-background" style={{ fontFamily: "'Inter', sans-serif" }}>
        <div className="max-w-3xl mx-auto px-4 py-10">

          <button
            onClick={() => selView === "pick-service" ? setSelView("list") : setView("home")}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-7"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            {selView === "pick-service" ? "Kembali ke Daftar Draft" : "Kembali ke Beranda"}
          </button>

          {/* ── Confirm-new popup ── */}
          {showNewConfirm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
              <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-7 flex flex-col gap-5">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center flex-shrink-0">
                    <Folder className="h-6 w-6 text-amber-600" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-foreground text-base mb-1" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                      Anda memiliki {drafts.length} draft tersimpan
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Ingin melanjutkan draft yang sudah ada, atau mulai permohonan baru dari awal?
                    </p>
                  </div>
                </div>
                <div className="flex flex-col gap-3">
                  <button
                    onClick={() => { setShowNewConfirm(false); window.scrollTo({ top: 0 }); }}
                    className="w-full py-3.5 rounded-2xl border-2 border-accent text-accent text-base font-bold hover:bg-accent/6 transition-colors"
                  >
                    Lihat Draft Saya
                  </button>
                  <button
                    onClick={() => { setShowNewConfirm(false); setSelView("pick-service"); }}
                    className="w-full py-3.5 rounded-2xl bg-accent text-white text-base font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-accent/25"
                  >
                    Mulai Permohonan Baru
                  </button>
                  <button
                    onClick={() => setShowNewConfirm(false)}
                    className="w-full py-2.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Batal
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── Draft list view ── */}
          {selView === "list" && (
            <>
              <div className="text-center mb-10">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-accent/10 mb-5">
                  <FileText className="h-7 w-7 text-accent" />
                </div>
                <h1 className="text-2xl font-extrabold text-foreground mb-2" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Ajukan Perizinan</h1>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  {drafts.length > 0 ? "Lanjutkan draft yang tersimpan, atau mulai permohonan baru." : "Pilih jenis perizinan yang ingin Anda ajukan."}
                </p>
              </div>

              {/* Draft cards */}
              {drafts.length > 0 && (
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Folder className="h-4 w-4 text-amber-500" />
                    <span className="text-sm font-bold text-foreground">Draft Tersimpan</span>
                    <span className="ml-auto text-[11px] font-semibold bg-amber-100 text-amber-700 px-2.5 py-0.5 rounded-full border border-amber-200">
                      {drafts.length} draft
                    </span>
                  </div>
                  <div className="space-y-3">
                    {drafts.map(d => {
                      const meta = d.serviceType ? SERVICE_META[d.serviceType] : null;
                      const Icon = meta?.icon ?? FileText;
                      return (
                        <div key={d.id} className="bg-white rounded-2xl border border-border shadow-sm p-4">
                          <div className="flex items-center gap-4 mb-4">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${meta?.bg ?? "bg-secondary"}`}>
                              <Icon className={`h-6 w-6 ${meta?.color ?? "text-muted-foreground"}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-base font-bold text-foreground truncate">
                                {meta?.label ?? "Layanan belum dipilih"}
                              </p>
                              {d.formData[PERMIT_FIELDS.name] && <p className="text-sm text-accent">{d.formData[PERMIT_FIELDS.name]}</p>}
                              <div className="flex items-center gap-2 mt-1 flex-wrap">
                                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-100">
                                  {STEP_LABELS[d.step] ?? `Langkah ${d.step}`}
                                </span>
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                  <Clock className="h-3 w-3" />{fmtTime(d.savedAt)}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              onClick={() => removeDraftEntry(d.id)}
                              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-red-200 text-red-500 text-sm font-semibold hover:bg-red-50 transition-colors"
                            >
                              <Trash2 className="h-4 w-4" />
                              Hapus
                            </button>
                            <button
                              type="button"
                              onClick={() => resumeDraft(d)}
                              className="flex-1 py-2.5 rounded-xl bg-accent text-white text-sm font-bold hover:bg-blue-700 transition-colors shadow-md shadow-accent/20 text-center"
                            >
                              Lanjutkan Draft →
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* New permit button — large, high-contrast, easy for all ages */}
              <button
                type="button"
                onClick={() => drafts.length > 0 ? setShowNewConfirm(true) : setSelView("pick-service")}
                className="w-full flex items-center justify-center gap-3 py-5 rounded-2xl bg-accent text-white text-base font-extrabold hover:bg-blue-700 active:scale-[0.98] transition-all shadow-xl shadow-accent/30"
                style={{ minHeight: "64px" }}
              >
                <Plus className="h-6 w-6" />
                Ajukan Perizinan Baru
              </button>
            </>
          )}

          {/* ── Service type picker ── */}
          {selView === "pick-service" && (
            <>
              <div className="text-center mb-10">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-accent/10 mb-5">
                  <FileText className="h-7 w-7 text-accent" />
                </div>
                <h1 className="text-2xl font-extrabold text-foreground mb-2" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Pilih Jenis Layanan</h1>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">Pilih jenis perizinan yang ingin Anda ajukan. Pastikan memilih layanan yang sesuai kebutuhan.</p>
              </div>
              <div className="grid grid-cols-1 gap-4">
                {(Object.entries(SERVICE_META) as [ServiceType, typeof SERVICE_META[ServiceType]][]).map(([key, meta]) => {
                  const Icon = meta.icon;
                  return (
                    <button
                      key={key}
                      onClick={() => startNew(key)}
                      className="group flex items-center gap-5 p-6 bg-white rounded-2xl border border-border hover:border-accent/40 hover:shadow-lg hover:shadow-primary/6 hover:-translate-y-0.5 transition-all text-left"
                    >
                      <div className={`w-14 h-14 rounded-xl ${meta.bg} flex items-center justify-center flex-shrink-0`}>
                        <Icon className={`h-7 w-7 ${meta.color}`} />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-foreground group-hover:text-accent transition-colors mb-1" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{meta.label}</h3>
                        <p className="text-xs text-muted-foreground leading-relaxed">{meta.desc}</p>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-accent group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  // ─── Success ───────────────────────────────────────────────────────────────

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4" style={{ fontFamily: "'Inter', sans-serif" }}>
        <div className="text-center max-w-md">
          <div className="w-24 h-24 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-6 shadow-xl shadow-emerald-100">
            <CheckCircle className="h-12 w-12 text-emerald-500" />
          </div>
          <h2 className="text-2xl font-extrabold text-foreground mb-3" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Permohonan Berhasil Diajukan!</h2>
          <p className="text-muted-foreground text-sm mb-2">Nomor Permohonan Anda:</p>
          <div className="bg-secondary rounded-2xl px-8 py-4 mb-6 inline-block border border-border">
            <span className="font-mono font-bold text-lg text-primary">{submittedCode}</span>
          </div>
          <p className="text-sm text-muted-foreground mb-8 leading-relaxed">
            Permohonan sedang dalam proses verifikasi. Anda akan menerima notifikasi melalui <strong>WhatsApp</strong> dan <strong>email</strong> setiap kali ada perkembangan status.
          </p>
          <button onClick={() => setView("home")} className="px-8 py-3 bg-primary text-primary-foreground rounded-xl font-bold text-sm hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20">
            Kembali ke Beranda
          </button>
        </div>
      </div>
    );
  }

  // ─── Form ──────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-background" style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 px-5 py-3 rounded-2xl shadow-xl text-sm font-semibold text-white pointer-events-none ${
          toast === "saved" ? "bg-emerald-600" : "bg-slate-700"
        }`}>
          {toast === "saved"
            ? <><Save className="h-4 w-4" /> Draft tersimpan</>
            : <><Trash2 className="h-4 w-4" /> Draft dihapus</>}
        </div>
      )}

      {/* Sticky header */}
      <div className="bg-white border-b border-border sticky top-0 z-30 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center gap-3 mb-4">
            <button onClick={() => { draftId.current = null; setServiceType(null); setSelView("list"); }}
              className="p-1.5 rounded-lg hover:bg-secondary transition-colors">
              <ChevronLeft className="h-5 w-5 text-muted-foreground" />
            </button>
            <div className="flex-1 min-w-0">
              <h1 className="font-extrabold text-foreground text-lg leading-tight" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Formulir Permohonan Izin</h1>
              <p className="text-xs text-muted-foreground">Tersimpan otomatis · Lengkapi seluruh data yang diperlukan</p>
            </div>
            {serviceType && (
              <span className={`hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border ${SERVICE_META[serviceType].bg} ${SERVICE_META[serviceType].color} border-current/20 flex-shrink-0`}>
                {(() => { const Icon = SERVICE_META[serviceType].icon; return <Icon className="h-3.5 w-3.5" />; })()}
                {SERVICE_META[serviceType].label}
              </span>
            )}
            <button onClick={manualSave}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border bg-white text-xs font-semibold text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors flex-shrink-0 shadow-sm">
              <Save className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Simpan Draft</span>
            </button>
          </div>
          <StepIndicator current={step} labels={stepLabels} />
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {submitError && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-start gap-3 mb-6 text-sm text-red-700">
            <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />{submitError}
          </div>
        )}
        {Object.keys(err).length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-start gap-3 mb-6">
            <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-red-700">Harap perbaiki {Object.keys(err).length} kesalahan sebelum melanjutkan</p>
              <p className="text-xs text-red-500 mt-0.5">Field yang wajib diisi ditandai dengan border merah di bawah.</p>
            </div>
          </div>
        )}

        {/* Step 1 */}
        {needsPermitType(serviceType) && (
          <details className="mb-6 rounded-xl border border-border bg-white p-4">
            <summary className="cursor-pointer font-semibold text-sm">
              {f[PERMIT_FIELDS.name]} — Informasi & Persyaratan
            </summary>
            <div className="mt-4">
              {permitTypes?.find(p => p.value === f[PERMIT_FIELDS.value]) ? (
                <PermitInfo permit={permitTypes.find(p => p.value === f[PERMIT_FIELDS.value])!} compact />
              ) : <p className="text-sm text-muted-foreground">Informasi perizinan belum tersedia.</p>}
            </div>
          </details>
        )}
        {step === 1 && (
          <div className="bg-white rounded-2xl border border-border p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-9 h-9 rounded-xl bg-accent/10 flex items-center justify-center"><User className="h-4 w-4 text-accent" /></div>
              <div>
                <h2 className="font-extrabold text-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Data Pemohon</h2>
                <p className="text-xs text-muted-foreground">Identitas diri sesuai KTP yang masih berlaku</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Inp label="No. KTP (NIK)" placeholder="16 digit Nomor Induk Kependudukan" required value={f.ktp} onChange={v => set("ktp", v)} error={err.ktp} tip={t("ktp")} />
                <Inp label="NPWP" placeholder="XX.XXX.XXX.X-XXX.XXX" value={f.npwp} onChange={v => set("npwp", v)} error={err.npwp} tip={t("npwp")} />
              <div className="sm:col-span-2">
                <Inp label="Nama Lengkap Pemohon" placeholder="Nama sesuai KTP" required value={f.name} onChange={v => set("name", v)} error={err.name} tip={t("name")} />
              </div>
              <Inp label="No. HP / WhatsApp Aktif" placeholder="+62 8xx-xxxx-xxxx" type="tel" required value={f.phone} onChange={v => set("phone", v)} error={err.phone} tip={t("phone")} />
              <Sel label="Provinsi" options={provinces} required value={f.province} onChange={v => set("province", v)} error={err.province} tip={t("province")} />
              <Sel label="Kabupaten / Kota" options={cities} required value={f.city} onChange={v => set("city", v)} error={err.city} tip={t("city")} />
              <Sel label="Kecamatan" options={districts} required value={f.district} onChange={v => set("district", v)} error={err.district} tip={t("district")} />
              <Sel label="Kelurahan / Desa" options={villages} required value={f.village} onChange={v => set("village", v)} error={err.village} tip={t("village")} />
              <div className="sm:col-span-2">
                <Tex label="Alamat Lengkap Pemohon" placeholder="Jalan, nomor rumah, RT/RW, kelurahan, kecamatan..." required value={f.address} onChange={v => set("address", v)} error={err.address} tip={t("address")} />
              </div>
              <div className="sm:col-span-2">
                <Tex label="Keterangan Tambahan" placeholder="Informasi lain yang relevan (opsional)" value={f.notes} onChange={v => set("notes", v)} tip={t("notes")} />
              </div>
            </div>
          </div>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <div className="bg-white rounded-2xl border border-border p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center"><MapPin className="h-4 w-4 text-emerald-600" /></div>
              <div>
                <h2 className="font-extrabold text-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Lokasi Izin</h2>
                <p className="text-xs text-muted-foreground">Tentukan lokasi usaha yang akan mendapatkan izin</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <Sel label="Kabupaten / Kota" options={cities} required value={f.permitCity} onChange={v => set("permitCity", v)} error={err.permitCity} tip={t("permitCity")} />
              <Sel label="Kecamatan" options={districts} required value={f.permitDistrict} onChange={v => set("permitDistrict", v)} error={err.permitDistrict} tip={t("permitDistrict")} />
              <Sel label="Kelurahan / Desa" options={villages} required value={f.permitVillage} onChange={v => set("permitVillage", v)} error={err.permitVillage} tip={t("permitVillage")} />
              <div className="sm:col-span-2">
                <Inp label="Alamat / Lokasi Izin" placeholder="Alamat lengkap lokasi usaha" required value={f.permitAddress} onChange={v => set("permitAddress", v)} error={err.permitAddress} tip={t("permitAddress")} />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground block mb-2">Koordinat Lokasi <span className="text-red-500">*</span></label>
              <MapView />
            </div>
          </div>
        )}

        {/* Step 3 */}
        {step === 3 && (
          <div className="bg-white rounded-2xl border border-border p-6 sm:p-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-purple-100 flex items-center justify-center"><Building className="h-4 w-4 text-purple-600" /></div>
                <div>
                  <h2 className="font-extrabold text-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Data Perusahaan</h2>
                  <p className="text-xs text-muted-foreground">Badan usaha / perusahaan pemohon</p>
                </div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input type="checkbox" checked={skipCompany} onChange={e => { setSkipCompany(e.target.checked); setErr({}); }} className="w-4 h-4 rounded border-border accent-accent" />
                <span className="text-xs text-muted-foreground font-medium">Lewati (Perorangan)</span>
              </label>
            </div>
            {skipCompany ? (
              <div className="flex flex-col items-center py-12 text-center">
                <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center mb-4"><User className="h-8 w-8 text-muted-foreground" /></div>
                <h3 className="font-bold text-foreground mb-2" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Pendaftaran Perorangan</h3>
                <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">Anda memilih mendaftar sebagai perorangan. Data perusahaan tidak diperlukan. Klik Selanjutnya untuk melanjutkan.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <Inp label="Nama Perusahaan" placeholder="PT. / CV. / UD. Nama Lengkap Perusahaan" required value={f.companyName} onChange={v => set("companyName", v)} error={err.companyName} tip={t("companyName")} />
                </div>
                <Inp label="NPWP Perusahaan" placeholder="XX.XXX.XXX.X-XXX.XXX" required value={f.companyNpwp} onChange={v => set("companyNpwp", v)} error={err.companyNpwp} tip={t("companyNpwp")} />
                <Inp label="Nomor Telepon" placeholder="(021) xxx-xxxx" type="tel" required value={f.companyPhone} onChange={v => set("companyPhone", v)} error={err.companyPhone} tip={t("companyPhone")} />
                <Inp label="Email Perusahaan" placeholder="info@perusahaan.com" type="email" required value={f.companyEmail} onChange={v => set("companyEmail", v)} error={err.companyEmail} tip={t("companyEmail")} />
                <Inp label="Kode Pos" placeholder="15310" value={f.postal} onChange={v => set("postal", v)} error={err.postal} tip={t("postal")} />
                <div className="sm:col-span-2">
                  <Sel label="Bidang Usaha" options={["Jasa Pendidikan & Kursus", "Perdagangan Retail", "Industri Makanan & Minuman", "Jasa Kecantikan", "Fasilitas Kesehatan", "Industri Manufaktur", "Jasa Pariwisata"]} required value={f.businessType} onChange={v => set("businessType", v)} error={err.businessType} tip={t("businessType")} />
                </div>
                <Sel label="Provinsi" options={provinces} required value={f.companyProvince} onChange={v => set("companyProvince", v)} error={err.companyProvince} tip={t("companyProvince")} />
                <Sel label="Kabupaten / Kota" options={cities} required value={f.companyCity} onChange={v => set("companyCity", v)} error={err.companyCity} tip={t("companyCity")} />
                <Sel label="Kecamatan" options={districts} required value={f.companyDistrict} onChange={v => set("companyDistrict", v)} error={err.companyDistrict} tip={t("companyDistrict")} />
                <Sel label="Kelurahan / Desa" options={villages} required value={f.companyVillage} onChange={v => set("companyVillage", v)} error={err.companyVillage} tip={t("companyVillage")} />
                <div className="sm:col-span-2">
                  <Tex label="Alamat Lengkap Perusahaan" placeholder="Alamat lengkap kantor / tempat usaha..." required value={f.companyAddress} onChange={v => set("companyAddress", v)} error={err.companyAddress} tip={t("companyAddress")} />
                </div>
                <Inp label="Nomor Fax" placeholder="(021) xxx-xxxx" value={f.companyFax} onChange={v => set("companyFax", v)} error={err.companyFax} tip={t("companyFax")} />
              </div>
            )}
          </div>
        )}

        {/* Step 4 */}
        {step === 4 && permitConfig ? (
          <ConfigStep4 config={permitConfig} f={f} err={err} set={set} onFileChange={(key, file) => setStep4FilesByField(current => ({ ...current, [key]: file }))} />
        ) : step === 4 && (
          <div className="space-y-5">
            <div className="bg-white rounded-2xl border border-border p-6 sm:p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center"><FileText className="h-4 w-4 text-amber-600" /></div>
                <div>
                  <h2 className="font-extrabold text-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Data yang Tercatat dalam SK</h2>
                  <p className="text-xs text-muted-foreground">Data yang akan tertulis dalam Surat Keputusan izin</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2"><Inp label="Nama Pemohon" placeholder="Nama lengkap sesuai KTP" required value={f.decName} onChange={v => set("decName", v)} error={err.decName} tip={t("decName")} /></div>
                <div className="sm:col-span-2"><Tex label="Alamat Pemohon" placeholder="Alamat lengkap sesuai KTP" required value={f.decAddress} onChange={v => set("decAddress", v)} error={err.decAddress} tip={t("decAddress")} /></div>
                <Sel label="Jenis Pendidikan" options={["SD / Sederajat", "SMP / Sederajat", "SMA / SMK / Sederajat", "Diploma III (D3)", "Sarjana (S1)", "Magister (S2)", "Doktor (S3)"]} required value={f.education} onChange={v => set("education", v)} error={err.education} tip={t("education")} />
                <Inp label="Jabatan" placeholder="Contoh: Kepala Lembaga / Pimpinan" required value={f.position} onChange={v => set("position", v)} error={err.position} tip={t("position")} />
                <Inp label="Nomor Telepon / Fax" placeholder="(021) xxx-xxxx" type="tel" required value={f.decPhone} onChange={v => set("decPhone", v)} error={err.decPhone} tip={t("decPhone")} />
                <div className="sm:col-span-2"><Inp label="Nama Lembaga Kursus" placeholder="Nama resmi lembaga kursus dan pelatihan" required value={f.institutionLembaga} onChange={v => set("institutionLembaga", v)} error={err.institutionLembaga} tip={t("institutionLembaga")} /></div>
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-border p-6 sm:p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center"><BookOpen className="h-4 w-4 text-blue-600" /></div>
                <div>
                  <h2 className="font-extrabold text-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Data Lembaga / Institusi</h2>
                  <p className="text-xs text-muted-foreground">Informasi detail mengenai lembaga yang diajukan</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2"><Inp label="Nama Lembaga" placeholder="Nama resmi lembaga sesuai akta" required value={f.instName} onChange={v => set("instName", v)} error={err.instName} tip={t("instName")} /></div>
                <div className="sm:col-span-2"><Tex label="Alamat Lembaga" placeholder="Alamat lengkap lembaga/institusi" required value={f.instAddress} onChange={v => set("instAddress", v)} error={err.instAddress} tip={t("instAddress")} /></div>
                <Inp label="Administrasi" placeholder="Nama pengelola / staf administrasi" required value={f.admin} onChange={v => set("admin", v)} error={err.admin} tip={t("admin")} />
                <Inp label="Gedung / Ruangan" placeholder="Nama gedung atau nomor ruangan" required value={f.building} onChange={v => set("building", v)} error={err.building} tip={t("building")} />
                <div className="sm:col-span-2"><Tex label="Peralatan & Fasilitas" placeholder="Daftar peralatan dan fasilitas yang tersedia" required value={f.equipment} onChange={v => set("equipment", v)} error={err.equipment} tip={t("equipment")} /></div>
                <div className="sm:col-span-2"><Tex label="Rencana Pelajaran / Kurikulum" placeholder="Deskripsi rencana pelajaran dan kurikulum yang digunakan" required value={f.curriculum} onChange={v => set("curriculum", v)} error={err.curriculum} tip={t("curriculum")} /></div>
                <Inp label="Jumlah Siswa / Peserta Didik" placeholder="Contoh: 50 orang" type="number" required value={f.students} onChange={v => set("students", v)} error={err.students} tip={t("students")} />
                <Inp label="Biaya Kursus" placeholder="Rp 0,-" required value={f.fees} onChange={v => set("fees", v)} error={err.fees} tip={t("fees")} />
              </div>
            </div>
          </div>
        )}


        {/* Step 5 */}
        <div hidden={step !== 5}><Step5Files onValidChange={setStep5Valid} onFilesChange={setUploadedFiles} labels={step5Labels} /></div>

        {/* Assistance tip banner */}
        {showTip && (
          <div className="mt-4 flex items-center gap-2.5 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-xs text-blue-700">
            <Info className="h-4 w-4 text-blue-500 flex-shrink-0" />
            {showChat
              ? "Mode Bantuan Penuh aktif — klik tombol ? di setiap label untuk petunjuk, atau chat dengan Asisten DSJ di pojok kanan bawah."
              : "Mode Dengan Bantuan aktif — klik tombol ? di setiap label untuk melihat petunjuk pengisian."}
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between mt-6">
          <button onClick={() => go(-1)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-border bg-white text-foreground text-sm font-medium hover:bg-secondary transition-colors">
            <ChevronLeft className="h-4 w-4" />
            {step === 1 ? "Batal" : "Sebelumnya"}
          </button>
          <div className="text-xs text-muted-foreground font-medium tabular-nums">
            Langkah <span className="text-foreground font-bold">{step}</span> dari {totalSteps}
          </div>
          <button onClick={() => void go(1)}
            disabled={submitting || (hasStep5 && step === 5 && step5Touched && !step5Valid)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-bold transition-all shadow-md ${
              hasStep5 && step === 5 && step5Touched && !step5Valid
                ? "bg-accent/40 cursor-not-allowed shadow-none"
                : "bg-accent hover:bg-blue-700 shadow-accent/20"
            }`}>
            {submitting ? "Mengunggah..." : step === totalSteps ? "Ajukan Permohonan" : "Selanjutnya"}
            {step < totalSteps ? <ChevronRight className="h-4 w-4" /> : <Check className="h-4 w-4" />}
          </button>
        </div>
      </div>

    </div>
  );
}
