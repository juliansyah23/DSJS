import { useEffect, useMemo, useState } from "react";
import { api, type ApiApplication, type ApiStage } from "../app/api";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../app/components/ui/dialog";
import { messageOf, useAdminUsers } from "./hooks";
import { Check, Clock3, Copy, Download, FileText, UserRound } from "lucide-react";

const field = "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm";
const button = "rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-50";

const STATUS_LABELS: Record<ApiApplication["status"], string> = {
  pending: "Menunggu",
  review: "Sedang diproses",
  approved: "Disetujui",
  rejected: "Ditolak",
};

const STAGE_LABELS: Record<ApiStage["status"], string> = {
  pending: "Menunggu",
  in_progress: "Sedang diproses",
  completed: "Selesai",
  rejected: "Ditolak",
};

function humanizeKey(key: string): string {
  return key
    .replace(/[._-]+/g, " ")
    .replace(/\b\w/g, letter => letter.toUpperCase());
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "boolean") return value ? "Ya" : "Tidak";
  if (typeof value === "number") return value.toLocaleString("id-ID");
  if (Array.isArray(value)) return value.length ? value.map(item => formatValue(item)).join(", ") : "—";
  if (typeof value === "object") {
    return Object.entries(value as Record<string, unknown>)
      .map(([key, item]) => `${humanizeKey(key)}: ${formatValue(item)}`)
      .join("; ");
  }
  return String(value);
}

function formatDateTime(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" });
}

function ageLabel(value: string): { label: string; overdue: boolean } {
  const submitted = new Date(value).getTime();
  if (Number.isNaN(submitted)) return { label: "Usia tidak tersedia", overdue: false };
  const days = Math.max(0, Math.floor((Date.now() - submitted) / 86_400_000));
  return { label: `${days} hari sejak masuk`, overdue: days >= 7 };
}

function stageDuration(stage: ApiStage): string {
  const start = stage.started_at ? new Date(stage.started_at).getTime() : NaN;
  const end = stage.completed_at ? new Date(stage.completed_at).getTime() : Date.now();
  if (Number.isNaN(start) || end < start) return "Durasi belum tersedia";
  const hours = Math.floor((end - start) / 3_600_000);
  if (hours < 24) return `${Math.max(1, hours)} jam`;
  return `${Math.floor(hours / 24)} hari`;
}

export function ApplicationDetail({ id, onClose, onSaved }: {
  id: number; onClose: () => void; onSaved: () => void;
}) {
  const [application, setApplication] = useState<ApiApplication | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [busy, setBusy] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [status, setStatus] = useState<ApiApplication["status"]>("pending");
  const [officer, setOfficer] = useState("");
  const [stages, setStages] = useState<ApiStage[]>([]);
  const [reason, setReason] = useState("");
  const [copied, setCopied] = useState(false);
  const officers = useAdminUsers({ role: "admin", status: "active" });
  const age = useMemo(() => application ? ageLabel(application.submitted_at) : null, [application]);

  const populate = (app: ApiApplication) => {
    setApplication(app);
    setStatus(app.status);
    setOfficer(app.officer ? String(app.officer.id) : "");
    setStages(app.stages);
  };

  useEffect(() => {
    const controller = new AbortController();
    setApplication(null);
    setError("");
    api.application(id, controller.signal).then(populate).catch(e => {
      if (!controller.signal.aborted) setError(messageOf(e));
    });
    return () => controller.abort();
  }, [id, attempt]);

  async function save(input: Parameters<typeof api.updateAdminApplication>[1]) {
    setBusy(true); setError(""); setSuccess("");
    try {
      populate(await api.updateAdminApplication(id, input));
      setSuccess("Perubahan berhasil disimpan.");
      onSaved();
    } catch (e) { setError(messageOf(e)); }
    finally { setBusy(false); }
  }

  async function download(file: NonNullable<ApiApplication["files"]>[number]) {
    setBusy(true); setError(""); setSuccess("");
    try { await api.downloadApplicationFile(id, file); }
    catch (e) { setError(messageOf(e)); }
    finally { setBusy(false); }
  }

  async function copyCode() {
    if (!application) return;
    try {
      await navigator.clipboard.writeText(application.code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setError("Nomor permohonan tidak dapat disalin otomatis.");
    }
  }

  function submitApplicationUpdate() {
    if (!application) return;
    if (status === "rejected" && !reason.trim()) {
      setError("Alasan penolakan wajib diisi agar pemohon mendapat kejelasan.");
      return;
    }
    const confirmation = status === "rejected"
      ? `Tolak permohonan ini?\n\nAlasan: ${reason.trim()}`
      : `Simpan status “${STATUS_LABELS[status]}” dan petugas permohonan ini?`;
    if (window.confirm(confirmation)) {
      void save({ status, officer_id: officer ? Number(officer) : null, notes: status === "rejected" ? reason.trim() : undefined });
    }
  }

  return <Dialog open onOpenChange={open => { if (!open && !busy) onClose(); }}>
    <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
      <DialogTitle>Detail Permohonan {application?.code ?? ""}</DialogTitle>
        <DialogDescription>Periksa data dan dokumen sebelum memproses permohonan. Simpan setiap bagian secara terpisah.</DialogDescription>
      </DialogHeader>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      {success && <p role="status" className="text-sm text-accent">{success}</p>}
      {!application ? <div>{error
        ? <button className={button} onClick={() => setAttempt(v => v + 1)}>Coba lagi</button>
        : <p role="status">Memuat detail…</p>}</div> : <div className="space-y-6">
        <section className="rounded-xl border border-border bg-secondary/30 p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Ringkasan permohonan</p>
              <h3 className="mt-1 text-lg font-semibold">{application.applicant_name || application.company_name || "Nama pemohon belum tersedia"}</h3>
              <p className="text-sm text-muted-foreground">{application.service_label} · Masuk {formatDateTime(application.submitted_at)}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${application.status === "approved" ? "bg-emerald-100 text-emerald-800" : application.status === "rejected" ? "bg-red-100 text-red-800" : "bg-amber-100 text-amber-800"}`}>{STATUS_LABELS[application.status]}</span>
              {age && <span className={`flex items-center gap-1 text-xs ${age.overdue ? "font-semibold text-amber-700" : "text-muted-foreground"}`}><Clock3 className="h-3.5 w-3.5" />{age.label}</span>}
            </div>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
            <span className="rounded-md border border-border bg-background px-2 py-1 font-mono">{application.code}</span>
            <button type="button" onClick={copyCode} className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-2 py-1 text-muted-foreground hover:text-foreground" aria-label={`Salin nomor ${application.code}`}>
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}{copied ? "Tersalin" : "Salin nomor"}
            </button>
          </div>
        </section>
        <section>
          <h3 className="flex items-center gap-2 font-semibold"><UserRound className="h-4 w-4 text-primary" />Data pemohon dan formulir</h3>
          {Object.keys(application.form_data ?? {}).length === 0
            ? <p className="mt-3 text-sm text-muted-foreground">Data formulir belum tersedia.</p>
            : <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
              {Object.entries(application.form_data ?? {}).map(([key, value]) => <div key={key} className="rounded-lg border border-border bg-background p-3">
                <dt className="text-xs font-medium text-muted-foreground">{humanizeKey(key)}</dt>
                <dd className="mt-1 break-words whitespace-pre-wrap">{formatValue(value)}</dd>
              </div>)}
            </dl>}
        </section>
        <section className="space-y-2">
          <h3 className="flex items-center gap-2 font-semibold"><FileText className="h-4 w-4 text-primary" />Dokumen</h3>
          {!application.files?.length && <p className="text-sm text-muted-foreground">Tidak ada dokumen.</p>}
          {application.files?.map(file => <div key={file.id} className="flex items-center justify-between gap-3 text-sm">
            <span className="break-all"><span className="font-medium">{file.label}</span>: {file.original_name} {file.size != null && <span className="text-xs text-muted-foreground">({(file.size / 1024).toFixed(0)} KB)</span>}</span>
            <button type="button" disabled={busy} className={button} onClick={() => download(file)}><Download className="mr-1 inline h-3.5 w-3.5" />Unduh</button>
          </div>)}
        </section>
        <form className="space-y-3 border-t border-border pt-4" onSubmit={e => {
          e.preventDefault();
          submitApplicationUpdate();
        }}>
          <h3 className="font-semibold">Status dan petugas</h3>
          <label className="block text-sm">Status<select className={field} disabled={busy} value={status} onChange={e => { setStatus(e.target.value as ApiApplication["status"]); setError(""); }}>
            <option value="pending">Menunggu</option><option value="review">Diproses</option><option value="approved">Disetujui</option><option value="rejected">Ditolak</option>
          </select></label>
          {status === "rejected" && <label className="block text-sm">Alasan penolakan <span className="text-destructive">*</span><textarea className={field} required maxLength={2000} disabled={busy} value={reason} onChange={e => setReason(e.target.value)} placeholder="Jelaskan hal yang perlu diperbaiki atau alasan penolakan." /></label>}
          <label className="block text-sm">Petugas<select className={field} disabled={busy || officers.loading || !!officers.error} value={officer} onChange={e => setOfficer(e.target.value)}>
            <option value="">Belum ditetapkan</option>
            {application.officer && !officers.data.some(u => u.id === application.officer?.id) && <option value={application.officer.id}>{application.officer.name} (petugas saat ini)</option>}
            {officers.data.map(user => <option key={user.id} value={user.id}>{user.name}</option>)}
          </select></label>
          {officers.error && <div role="alert" className="text-sm">{officers.error} <button type="button" onClick={officers.refresh}>Muat ulang petugas</button></div>}
          <button className={button} disabled={busy || officers.loading || !!officers.error}>Simpan status dan petugas</button>
        </form>
        <section className="space-y-4">
          <h3 className="flex items-center gap-2 font-semibold"><Clock3 className="h-4 w-4 text-primary" />Tahapan proses</h3>
          <div className="relative space-y-3 before:absolute before:bottom-4 before:left-3 before:top-4 before:w-px before:bg-border">
          {stages.map(stage => <form key={stage.id} className="relative ml-0 space-y-2 rounded-lg border border-border bg-background p-3 pl-8" onSubmit={e => {
            e.preventDefault();
            void save({ stage_sequence: stage.sequence, stage_status: stage.status, notes: stage.notes });
          }}>
            <span className={`absolute left-1.5 top-4 flex h-3 w-3 rounded-full border-2 border-background ${stage.status === "completed" ? "bg-emerald-500" : stage.status === "rejected" ? "bg-red-500" : stage.status === "in_progress" ? "bg-primary" : "bg-muted-foreground/40"}`} aria-hidden="true" />
            <div className="flex flex-wrap items-center justify-between gap-2"><h4 className="text-sm font-semibold">{stage.sequence}. {stage.name}</h4><span className="text-xs text-muted-foreground">{STAGE_LABELS[stage.status]} · {stageDuration(stage)}</span></div>
            <p className="text-xs text-muted-foreground">Mulai: {formatDateTime(stage.started_at)} · Selesai: {formatDateTime(stage.completed_at)}</p>
            <label className="block text-sm">Status tahap<select className={field} value={stage.status} disabled={busy} onChange={e => setStages(current => current.map(s => s.id === stage.id ? { ...s, status: e.target.value as ApiStage["status"] } : s))}>
              <option value="pending">Menunggu</option><option value="in_progress">Diproses</option><option value="completed">Selesai</option><option value="rejected">Ditolak</option>
            </select></label>
            <label className="block text-sm">Catatan<textarea className={field} maxLength={2000} disabled={busy} value={stage.notes ?? ""} onChange={e => setStages(current => current.map(s => s.id === stage.id ? { ...s, notes: e.target.value } : s))} /></label>
            <button className={button} disabled={busy}>Simpan tahap</button>
          </form>)}
          </div>
          {!stages.length && <p className="text-sm text-muted-foreground">Tahapan proses belum tersedia.</p>}
        </section>
      </div>}
    </DialogContent>
  </Dialog>;
}