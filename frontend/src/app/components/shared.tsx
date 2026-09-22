import { useState } from "react";
import { AlertTriangle, ChevronDown } from "lucide-react";

// ─── Tooltip bubble ────────────────────────────────────────────────────────────

function TipBubble({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  return (
    <span className="relative inline-block ml-1.5 align-middle">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 text-[11px] font-bold inline-flex items-center justify-center hover:bg-blue-200 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-300 flex-shrink-0"
        aria-label="Petunjuk pengisian"
      >?</button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-7 z-50 w-64 bg-white border border-blue-200 rounded-2xl shadow-2xl p-4 text-xs text-slate-700 leading-relaxed">
            <div className="absolute -top-1.5 left-3 w-3 h-3 bg-white border-l border-t border-blue-200 rotate-45" />
            <p className="font-semibold text-blue-700 mb-1 text-[11px] uppercase tracking-wide">Petunjuk</p>
            {text}
          </div>
        </>
      )}
    </span>
  );
}

// ─── Form components ───────────────────────────────────────────────────────────

export interface FieldProps {
  label: string; placeholder: string; type?: string;
  required?: boolean; value?: string; onChange?: (v: string) => void; error?: string;
  tip?: string;
}

export function Inp({ label, placeholder, type = "text", required = false, value = "", onChange, error, tip }: FieldProps) {
  const cls = error
    ? "border-red-400 bg-red-50/30 focus:ring-red-200 focus:border-red-400"
    : "border-border bg-white focus:ring-accent/25 focus:border-accent";
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-foreground flex items-center flex-wrap gap-x-0.5">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
        {tip && <TipBubble text={tip} />}
      </label>
      <input type={type} placeholder={placeholder} value={value} onChange={e => onChange?.(e.target.value)}
        className={`h-10 px-3 rounded-lg border text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 transition-all ${cls}`} />
      {error && <p className="text-xs text-red-500 flex items-center gap-1"><AlertTriangle className="h-3 w-3 flex-shrink-0" />{error}</p>}
    </div>
  );
}

export interface SelProps {
  label: string; options: string[];
  required?: boolean; value?: string; onChange?: (v: string) => void; error?: string;
  tip?: string;
}

export function Sel({ label, options, required = false, value = "", onChange, error, tip }: SelProps) {
  const cls = error
    ? "border-red-400 bg-red-50/30 focus:ring-red-200 focus:border-red-400"
    : "border-border bg-white focus:ring-accent/25 focus:border-accent";
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-foreground flex items-center flex-wrap gap-x-0.5">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
        {tip && <TipBubble text={tip} />}
      </label>
      <div className="relative">
        <select value={value} onChange={e => onChange?.(e.target.value)}
          className={`w-full h-10 px-3 pr-9 rounded-lg border text-sm text-foreground focus:outline-none focus:ring-2 transition-all appearance-none ${cls}`}>
          <option value="">-- Pilih {label} --</option>
          {options.map(o => <option key={o}>{o}</option>)}
        </select>
        <ChevronDown className="absolute right-2.5 top-3 h-4 w-4 text-muted-foreground pointer-events-none" />
      </div>
      {error && <p className="text-xs text-red-500 flex items-center gap-1"><AlertTriangle className="h-3 w-3 flex-shrink-0" />{error}</p>}
    </div>
  );
}

export interface TexProps {
  label: string; placeholder: string;
  required?: boolean; value?: string; onChange?: (v: string) => void; error?: string;
  tip?: string;
}

export function Tex({ label, placeholder, required = false, value = "", onChange, error, tip }: TexProps) {
  const cls = error
    ? "border-red-400 bg-red-50/30 focus:ring-red-200 focus:border-red-400"
    : "border-border bg-white focus:ring-accent/25 focus:border-accent";
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-foreground flex items-center flex-wrap gap-x-0.5">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
        {tip && <TipBubble text={tip} />}
      </label>
      <textarea placeholder={placeholder} rows={3} value={value} onChange={e => onChange?.(e.target.value)}
        className={`px-3 py-2.5 rounded-lg border text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 transition-all resize-none ${cls}`} />
      {error && <p className="text-xs text-red-500 flex items-center gap-1"><AlertTriangle className="h-3 w-3 flex-shrink-0" />{error}</p>}
    </div>
  );
}

export function Badge({ status }: { status: string }) {
  const map: Record<string, { cls: string; label: string }> = {
    approved: { cls: "bg-emerald-50 text-emerald-700 border-emerald-200", label: "Disetujui" },
    review:   { cls: "bg-blue-50 text-blue-700 border-blue-200",          label: "Review"    },
    pending:  { cls: "bg-amber-50 text-amber-700 border-amber-200",        label: "Pending"   },
    rejected: { cls: "bg-red-50 text-red-700 border-red-200",             label: "Ditolak"   },
  };
  const { cls, label } = map[status] ?? { cls: "bg-gray-100 text-gray-600 border-gray-200", label: status };
  return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${cls}`}>{label}</span>;
}

export function ChartTip({ active, payload, label }: { active?: boolean; payload?: { color: string; name: string; value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white rounded-xl shadow-lg border border-border p-3 text-xs min-w-[120px]">
      <div className="font-semibold text-foreground mb-2">{label}</div>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-1.5 text-muted-foreground">
          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: p.color }} />
          {p.name}: <span className="font-semibold text-foreground ml-auto pl-2">{p.value}</span>
        </div>
      ))}
    </div>
  );
}
