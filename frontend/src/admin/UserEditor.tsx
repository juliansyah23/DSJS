import { useState } from "react";
import { api, type AdminUser } from "../app/api";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../app/components/ui/dialog";
import { messageOf } from "./hooks";

export function UserEditor({ user, readOnly = false, onClose, onSaved }: {
  user?: AdminUser; readOnly?: boolean; onClose: () => void; onSaved: () => void;
}) {
  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [role, setRole] = useState<AdminUser["role"]>(user?.role ?? "user");
  const [active, setActive] = useState(user?.is_active ?? true);
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const field = "mt-1 w-full rounded-lg border border-border bg-background p-2";
  return <Dialog open onOpenChange={open => { if (!open && !busy) onClose(); }}>
    <DialogContent><DialogHeader><DialogTitle>{readOnly ? "Detail pengguna" : user ? "Edit pengguna" : "Tambah pengguna"}</DialogTitle>
      <DialogDescription>{user ? `Akun #${user.id}. Email tidak dapat diubah di sini.` : "Password minimal 8 karakter, mengandung huruf besar, kecil, dan angka."}</DialogDescription></DialogHeader>
      <form className="space-y-3 text-sm" onSubmit={async e => {
        e.preventDefault(); setError("");
        if (password !== confirmation) { setError("Konfirmasi password tidak cocok."); return; }
        setBusy(true);
        try {
          const input = { name, phone: phone || null, role, is_active: active, ...(password ? { password, password_confirmation: confirmation } : {}) };
          if (user) await api.updateAdminUser(user.id, input);
          else await api.createAdminUser({ ...input, email, password, password_confirmation: confirmation });
          onSaved(); onClose();
        } catch (err) { setError(messageOf(err)); } finally { setBusy(false); }
      }}>
        {error && <p role="alert" className="text-destructive">{error}</p>}
        <fieldset disabled={busy || readOnly} className="space-y-3">
          <label className="block">Nama<input className={field} required minLength={3} maxLength={100} value={name} onChange={e => setName(e.target.value)} /></label>
          <label className="block">Email<input className={field} required type="email" maxLength={255} disabled={!!user} value={email} onChange={e => setEmail(e.target.value)} /></label>
          <label className="block">Telepon<input className={field} maxLength={20} value={phone} onChange={e => setPhone(e.target.value)} /></label>
          <label className="block">Role<select className={field} value={role} onChange={e => setRole(e.target.value as AdminUser["role"])}><option value="user">Pemohon</option><option value="admin">Administrator</option></select></label>
          <label className="flex gap-2"><input type="checkbox" checked={active} onChange={e => setActive(e.target.checked)} />Akun aktif</label>
          {!readOnly && <>
            <label className="block">{user ? "Password baru (kosongkan jika tidak diubah)" : "Password"}<input className={field} type="password" autoComplete="new-password" required={!user} minLength={8} value={password} onChange={e => setPassword(e.target.value)} /></label>
            <label className="block">Konfirmasi password<input className={field} type="password" autoComplete="new-password" required={!!password} value={confirmation} onChange={e => setConfirmation(e.target.value)} /></label>
            {user && <p className="text-muted-foreground">Mengubah password akan mencabut sesi login pengguna.</p>}
          </>}
        </fieldset>
        {readOnly && user && <p>{user.email_verified ? "Email terverifikasi" : "Email belum terverifikasi"} · {user.applications_count} permohonan</p>}
        {!readOnly && <button disabled={busy} className="rounded-lg bg-primary px-4 py-2 text-primary-foreground disabled:opacity-50">{busy ? "Menyimpan…" : "Simpan pengguna"}</button>}
      </form>
    </DialogContent>
  </Dialog>;
}