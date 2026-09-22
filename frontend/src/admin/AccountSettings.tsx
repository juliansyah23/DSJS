import { useEffect, useState } from "react";
import { api, setAuthToken } from "../app/api";
import { messageOf } from "./hooks";

export function AccountSettings() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [current, setCurrent] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    setLoading(true); setError("");
    api.me().then(user => { if (active) { setName(user.name); setPhone(user.phone ?? ""); setEmail(user.email); } })
      .catch(e => { if (active) setError(messageOf(e)); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [attempt]);
  const field = "mt-1 w-full rounded-lg border border-border bg-background p-2";
  async function save(changePassword: boolean) {
    setBusy(true); setError(""); setSuccess("");
    try {
      const result = await api.updateAdminAccount(changePassword
        ? { current_password: current, password, password_confirmation: confirmation }
        : { name, phone: phone || null });
      if (result.requires_login) {
        setAuthToken(null);
        window.location.reload();
      } else setSuccess("Profil berhasil disimpan. Nama pada header diperbarui setelah halaman dimuat ulang.");
    } catch (e) { setError(messageOf(e)); } finally { setBusy(false); }
  }
  return <div className="max-w-2xl space-y-5">
    <h2 className="text-xl font-bold">Pengaturan akun administrator</h2>
    {error && <div role="alert" className="text-destructive">{error} {!email && <button onClick={() => setAttempt(v => v + 1)}>Coba lagi</button>}</div>}
    {success && <p role="status">{success}</p>}
    {loading ? <p>Memuat profil…</p> : <>
      <form className="space-y-3 rounded-xl border border-border bg-background p-5 text-sm" onSubmit={e => { e.preventDefault(); void save(false); }}>
        <h3 className="font-semibold">Profil administrator</h3>
        <fieldset disabled={busy || !email} className="space-y-3">
          <label className="block">Nama<input className={field} required minLength={3} maxLength={100} value={name} onChange={e => setName(e.target.value)} /></label>
          <label className="block">Email (hanya baca)<input className={field} readOnly value={email} /></label>
          <label className="block">Telepon<input className={field} maxLength={20} value={phone} onChange={e => setPhone(e.target.value)} /></label>
          <button className="rounded-lg bg-primary px-4 py-2 text-primary-foreground">{busy ? "Menyimpan…" : "Simpan profil"}</button>
        </fieldset>
      </form>
      <form className="space-y-3 rounded-xl border border-border bg-background p-5 text-sm" onSubmit={e => {
        e.preventDefault();
        if (password !== confirmation) { setError("Konfirmasi password tidak cocok."); return; }
        if (window.confirm("Ubah password dan keluar dari semua sesi?")) void save(true);
      }}>
        <h3 className="font-semibold">Ubah password</h3>
        <p>Minimal 8 karakter, huruf besar, huruf kecil, dan angka. Anda harus login kembali setelah perubahan.</p>
        <fieldset disabled={busy || !email} className="space-y-3">
          <label className="block">Password saat ini<input className={field} required type="password" autoComplete="current-password" value={current} onChange={e => setCurrent(e.target.value)} /></label>
          <label className="block">Password baru<input className={field} required minLength={8} type="password" autoComplete="new-password" value={password} onChange={e => setPassword(e.target.value)} /></label>
          <label className="block">Konfirmasi password baru<input className={field} required type="password" autoComplete="new-password" value={confirmation} onChange={e => setConfirmation(e.target.value)} /></label>
          <button className="rounded-lg bg-primary px-4 py-2 text-primary-foreground">Ubah password</button>
        </fieldset>
      </form>
    </>}
    <section className="rounded-xl border border-border p-5 text-sm text-muted-foreground">
      <h3 className="font-semibold text-foreground">Konfigurasi sistem belum tersedia di panel</h3>
      <p className="mt-2">Notifikasi email, auto-assign, SLA, batas upload, email pengirim, zona waktu, dan 2FA belum dapat dikonfigurasi melalui halaman ini. Hubungi pengelola server. Kontrol simulasi telah dihilangkan agar tidak menampilkan keberhasilan penyimpanan yang keliru.</p>
    </section>
  </div>;
}