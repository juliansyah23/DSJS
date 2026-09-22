# Setup Backend DSJ (Laravel 12 + MySQL)

## Prasyarat
- PHP >= 8.2 (dengan extension: mbstring, xml, curl, zip, pdo_mysql)
- Composer 2.x
- MySQL 8.x (atau MariaDB 10.6+)

## Langkah instalasi

```bash
cd backend

# 1. Install dependency PHP (mengambil framework Laravel + Sanctum dari Packagist)
composer install

# 2. Salin file environment
cp .env.example .env

# 3. Generate APP_KEY
php artisan key:generate

# 4. Buat database MySQL kosong terlebih dahulu, lalu sesuaikan .env:
#    DB_DATABASE=dsj_db
#    DB_USERNAME=root
#    DB_PASSWORD=isi_password_anda

# 5. Jalankan migrasi
php artisan migrate

# 6. (Opsional) Isi akun demo awal
php artisan db:seed

# 7. Jalankan server dev
php artisan serve
# API tersedia di http://localhost:8000/api
```

## Menguji cepat dengan curl

```bash
# Register
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Budi Santoso","email":"budi@example.com","phone":"081234567890","password":"Password123","password_confirmation":"Password123"}'

# Cek kode OTP di storage/logs/laravel.log (karena MAIL_MAILER belum diarahkan ke SMTP asli)
tail -f storage/logs/laravel.log

# Verifikasi OTP
curl -X POST http://localhost:8000/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"email":"budi@example.com","code":"123456","purpose":"register"}'
```

## Menghubungkan ke frontend (Vite)
Di `.env` backend:
```
FRONTEND_URL=http://localhost:5173
SANCTUM_STATEFUL_DOMAINS=localhost:5173
```
Frontend cukup memanggil `http://localhost:8000/api/...` dan menyimpan `token` dari response login/verify-otp, lalu mengirimkannya sebagai header `Authorization: Bearer <token>` di setiap request selanjutnya.

## Catatan produksi
- Ganti `APP_DEBUG=false` dan `APP_ENV=production`
- Set `MAIL_MAILER` ke SMTP sungguhan agar OTP benar-benar terkirim (bukan hanya tercatat di log)
- Ganti password akun seeder (`ChangeMe#2024`) segera setelah seed pertama
- Pastikan HTTPS aktif di depan aplikasi (reverse proxy / load balancer)
