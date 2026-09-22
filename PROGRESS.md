# Progress Backend DSJ (Laravel 12 + MySQL)

Struktur proyek sekarang dipisah:
```
dsj-project/
├── frontend/   ← aplikasi React (yang sudah ada sebelumnya)
└── backend/    ← Laravel API (baru dibangun bertahap)
```

## ✅ Tahap 1 — Fondasi & Autentikasi (SELESAI, target Laravel 12)

- [x] Skeleton Laravel 12 lengkap (bootstrap/app.php, config/*, routes/*)
- [x] Koneksi MySQL dikonfigurasi (`config/database.php`, `.env.example`)
- [x] Laravel Sanctum untuk auth token API (bukan cookie session — aman untuk SPA terpisah domain)
- [x] Migrasi: `users` (dengan role user/admin), `otps`, `personal_access_tokens`, `password_reset_tokens`
- [x] Model `User` (password auto-hash, `hidden` field sensitif, guard role) dan `Otp`
- [x] `OtpService`: generate kode OTP ter-hash, verifikasi dengan limit percobaan, auto-invalidate kode lama
- [x] `AuthController` dengan endpoint:
  - `POST /api/auth/register`
  - `POST /api/auth/verify-otp`
  - `POST /api/auth/login`
  - `POST /api/auth/logout` (auth)
  - `GET  /api/auth/me` (auth)
  - `POST /api/auth/forgot-password` (anti user-enumeration)
  - `POST /api/auth/reset-password`
  - `POST /api/auth/resend-otp` (dengan cooldown)
- [x] Form Request validation ketat per endpoint (email, password kompleks, nomor HP format Indonesia)
- [x] Rate limiting berlapis: `login` (5/menit per email+IP), `otp` (5/menit), `register` (3/menit per IP), `api` (60/menit umum)
- [x] Exception handler global → selalu balas JSON konsisten untuk `/api/*`, tidak pernah bocorkan stack trace ke client saat production
- [x] `EnsureUserIsAdmin` middleware (alias `admin`) untuk proteksi rute admin nanti
- [x] CORS dibatasi ke domain frontend eksplisit (bukan wildcard `*`)
- [x] Seeder akun awal (admin & user demo)
- [x] Semua file PHP lolos `php -l` (syntax check)

**Catatan penting**: Composer tidak bisa dijalankan di lingkungan kerja saya (Packagist diblokir jaringan sandbox). Jalankan `composer install` di komputer Anda sendiri — lihat `backend/SETUP.md`.

## 🔲 Tahap 2 — Profil Pengguna & Pengaturan Simulasi
- [ ] Migrasi + endpoint untuk menyimpan `UserProfile` (age group, colorblind, service model, internet condition) per user
- [ ] Endpoint update profil

## 🔲 Tahap 3 — Modul Permohonan Izin (Apply)
- [ ] Migrasi: `applications`, `application_stages`, `application_files`, `drafts`
- [ ] Endpoint CRUD draft (menggantikan `localStorage` di frontend)
- [ ] Endpoint submit permohonan 5 langkah (SIP / OSS / SIMBG)
- [ ] Upload berkas PDF (validasi tipe MIME asli + ukuran, disimpan di disk `application_files` privat)

## 🔲 Tahap 4 — Tracking Status
- [ ] Endpoint lacak status by kode permohonan
- [ ] Riwayat tahapan (stages)

## 🔲 Tahap 5 — Admin Dashboard
- [ ] Endpoint statistik (monthlyApps, statusDist, processingTime, bottlenecks)
- [ ] Endpoint daftar permohonan + filter/search untuk admin
- [ ] Endpoint notifikasi admin
- [ ] Manajemen user (khusus admin)

## 🔲 Tahap 6 — Pengerasan Keamanan (Security Hardening Pass)
- [ ] Policy/Gate per resource (user hanya bisa akses permohonan miliknya)
- [ ] Audit logging aksi admin
- [ ] Header keamanan (HSTS, X-Frame-Options, dll via middleware)
- [ ] Review ulang seluruh validasi & rate limit

## 🔲 Tahap 7 — Integrasi Frontend
- [ ] Ganti `DEMO_ACCOUNTS`/mock di frontend dengan pemanggilan API sungguhan
- [ ] Ganti `localStorage` draft di `ApplyPage.tsx` dengan API
