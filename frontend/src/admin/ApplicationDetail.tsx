import { useEffect, useState } from "react";
import { api, type ApiApplication, type ApiStage } from "../app/api";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../app/components/ui/dialog";
import { messageOf, useAdminUsers } from "./hooks";

const field = "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm";
const button = "rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-50";

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
  const officers = useAdminUsers({ role: "admin", status: "active" });

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

  return <Dialog open onOpenChange={open => { if (!open && !busy) onClose(); }}>
    <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>Detail Permohonan {application?.code}</DialogTitle>
        <DialogDescription>Periksa data dan dokumen sebelum memproses permohonan. Simpan setiap bagian secara terpisah.</DialogDescription>
      </DialogHeader>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      {success && <p role="status" className="text-sm text-accent">{success}</p>}
      {!application ? <div>{error
        ? <button className={button} onClick={() => setAttempt(v => v + 1)}>Coba lagi</button>
        : <p role="status">Memuat detail…</p>}</div> : <div className="space-y-6">
        <section>
          <h3 className="font-semibold">{application.applicant_name} · {application.service_label}</h3>
          <p className="text-sm text-muted-foreground">Diajukan: {new Date(application.submitted_at).toLocaleString("id-ID")}</p>
          <dl className="mt-3 grid gap-2 text-sm">
            {Object.entries(application.form_data ?? {}).map(([key, value]) => <div key={key} className="grid grid-cols-2 gap-3 border-b border-border py-2">
              <dt className="break-words text-muted-foreground">{key.replace(/_/g, " ")}</dt>
              <dd className="break-words">{typeof value === "object" ? JSON.stringify(value) : String(value ?? "—")}</dd>
            </div>)}
          </dl>
        </section>
        <section className="space-y-2">
          <h3 className="font-semibold">Dokumen</h3>
          {!application.files?.length && <p className="text-sm text-muted-foreground">Tidak ada dokumen.</p>}
          {application.files?.map(file => <div key={file.id} className="flex items-center justify-between gap-3 text-sm">
            <span className="break-all">{file.label}: {file.original_name}</span>
            <button disabled={busy} className={button} onClick={() => download(file)}>Unduh</button>
          </div>)}
        </section>
        <form className="space-y-3 border-t border-border pt-4" onSubmit={e => {
          e.preventDefault();
          if (window.confirm("Simpan status dan petugas permohonan ini?")) void save({ status, officer_id: officer ? Number(officer) : null });
        }}>
          <h3 className="font-semibold">Status dan petugas</h3>
          <label className="block text-sm">Status<select className={field} disabled={busy} value={status} onChange={e => setStatus(e.target.value as ApiApplication["status"])}>
            <option value="pending">Menunggu</option><option value="review">Diproses</option><option value="approved">Disetujui</option><option value="rejected">Ditolak</option>
          </select></label>
          <label className="block text-sm">Petugas<select className={field} disabled={busy || officers.loading || !!officers.error} value={officer} onChange={e => setOfficer(e.target.value)}>
            <option value="">Belum ditetapkan</option>
            {application.officer && !officers.data.some(u => u.id === application.officer?.id) && <option value={application.officer.id}>{application.officer.name} (petugas saat ini)</option>}
            {officers.data.map(user => <option key={user.id} value={user.id}>{user.name}</option>)}
          </select></label>
          {officers.error && <div role="alert" className="text-sm">{officers.error} <button type="button" onClick={officers.refresh}>Muat ulang petugas</button></div>}
          <button className={button} disabled={busy || officers.loading || !!officers.error}>Simpan status dan petugas</button>
        </form>
        <section className="space-y-4">
          <h3 className="font-semibold">Tahapan proses</h3>
          {stages.map(stage => <form key={stage.id} className="space-y-2 rounded-lg border border-border p-3" onSubmit={e => {
            e.preventDefault();
            void save({ stage_sequence: stage.sequence, stage_status: stage.status, notes: stage.notes });
          }}>
            <h4 className="text-sm font-semibold">{stage.sequence}. {stage.name}</h4>
            <label className="block text-sm">Status tahap<select className={field} value={stage.status} disabled={busy} onChange={e => setStages(current => current.map(s => s.id === stage.id ? { ...s, status: e.target.value as ApiStage["status"] } : s))}>
              <option value="pending">Menunggu</option><option value="in_progress">Diproses</option><option value="completed">Selesai</option><option value="rejected">Ditolak</option>
            </select></label>
            <label className="block text-sm">Catatan<textarea className={field} maxLength={2000} disabled={busy} value={stage.notes ?? ""} onChange={e => setStages(current => current.map(s => s.id === stage.id ? { ...s, notes: e.target.value } : s))} /></label>
            <button className={button} disabled={busy}>Simpan tahap</button>
          </form>)}
        </section>
      </div>}
    </DialogContent>
  </Dialog>;
}