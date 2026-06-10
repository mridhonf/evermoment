# Evermoment — Vite + Supabase Portfolio

Project ini sudah diubah ke **Vite** dan siap deploy ke **Vercel**. Backend memakai **Supabase** untuk:

- login dashboard owner,
- database paket harga,
- database foto/video,
- upload foto portfolio,
- upload video,
- upload thumbnail video,
- upload logo dan favicon/tab browser.

## 1. Jalankan lokal

```bash
npm install
npm run dev
```

Buka:

```txt
http://localhost:5173
http://localhost:5173/dashboard.html
```

## 2. Setup environment

Copy file `.env.example` menjadi `.env.local`.

```bash
cp .env.example .env.local
```

Isi dengan data Supabase:

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

Ambil dari Supabase:

```txt
Project Settings > API > Project URL
Project Settings > API > anon public key
```

Jangan pernah taruh `service_role key` di frontend.

## 3. Setup database Supabase

Masuk ke Supabase Dashboard > SQL Editor.

Jalankan berurutan:

```txt
supabase/database/01_schema.sql
supabase/database/02_seed.sql
supabase/database/03_policies.sql
```

Atau copy isi:

```txt
supabase/database/all_in_one.sql
```

lalu jalankan di SQL Editor.

## 4. Buat akun owner dashboard

Masuk ke:

```txt
Supabase Dashboard > Authentication > Users > Add user
```

Buat akun owner, contoh:

```txt
Email: owner@email.com
Password: password-yang-aman
```

Setelah user dibuat, copy **User UID**-nya.

Lalu buka file:

```txt
supabase/database/04_add_owner_template.sql
```

Ganti:

```sql
'00000000-0000-0000-0000-000000000000'
```

dengan UID owner dari Supabase Auth.

Contoh:

```sql
insert into public.admin_users (id)
values ('11111111-2222-3333-4444-555555555555')
on conflict (id) do nothing;
```

Jalankan SQL itu di Supabase SQL Editor.


## Catatan revisi brand

Kalau kamu sudah menjalankan seed database versi lama dan website masih menampilkan `Aruna Visual`, itu berarti data `site_settings` di Supabase masih menyimpan nama lama. Jalankan file ini di Supabase SQL Editor:

```txt
supabase/database/05_update_brand_evermoment.sql
```

Atau ubah langsung dari dashboard owner pada menu **Brand, logo, dan WhatsApp**.

## 5. Storage buckets

Bucket sudah dibuat otomatis oleh `01_schema.sql`:

```txt
logos
photos
videos
video-thumbnails
```

Semua bucket dibuat public agar file bisa tampil langsung di website.

## 6. Deploy ke Vercel

Push project ke GitHub:

```bash
git init
git add .
git commit -m "Initial Evermoment Vite Supabase project"
git branch -M main
git remote add origin https://github.com/username/evermoment.git
git push -u origin main
```

Di Vercel:

```txt
Add New Project
Import GitHub repository
Framework Preset: Vite
Build Command: npm run build
Output Directory: dist
```

Tambahkan Environment Variables di Vercel:

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

Deploy.

Domain gratis awal akan menjadi seperti:

```txt
evermoment.vercel.app
```

## 7. Cara pakai dashboard

Buka:

```txt
https://nama-project.vercel.app/dashboard.html
```

Login pakai akun owner Supabase Auth.

Dari dashboard owner bisa:

- ubah nama brand,
- ubah tagline,
- ubah nomor WhatsApp,
- upload logo halaman,
- upload favicon/tab browser,
- tambah/edit/hapus paket harga,
- upload foto portfolio,
- upload video,
- upload thumbnail video.

## 8. Catatan video

Untuk video durasi panjang, lebih baik pakai link YouTube/Vimeo agar website tetap ringan. Kalau tetap upload file video langsung ke Supabase, kompres dulu agar tidak berat saat dibuka dari HP.

## 9. Struktur folder

```txt
evermoment-vite/
├─ index.html
├─ dashboard.html
├─ package.json
├─ vite.config.js
├─ .env.example
├─ public/
│  ├─ favicon.svg
│  └─ default-logo.svg
├─ src/
│  ├─ css/
│  │  └─ style.css
│  └─ js/
│     ├─ supabaseClient.js
│     ├─ app.js
│     └─ dashboard.js
└─ supabase/
   └─ database/
      ├─ 01_schema.sql
      ├─ 02_seed.sql
      ├─ 03_policies.sql
      ├─ 04_add_owner_template.sql
      ├─ 05_update_brand_evermoment.sql
      └─ all_in_one.sql
```

## 10. Checklist setelah deploy

- Home tampil rapi di HP.
- Logo muncul di header.
- Favicon muncul di tab browser.
- Galeri foto muncul.
- Filter foto jalan.
- Klik foto/video membuka preview smooth.
- Paket harga muncul dari Supabase.
- Tombol WhatsApp mengarah ke nomor yang benar.
- Dashboard bisa login.
- Upload foto tidak gepeng.
- Upload video punya thumbnail sendiri.
- Data dashboard tampil di website utama setelah refresh.
