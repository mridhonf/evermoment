-- FIX OWNER ACCESS DASHBOARD
-- 1) Buka Supabase > Authentication > Users
-- 2) Copy User UID akun owner
-- 3) Ganti UUID di bawah dengan User UID tersebut
-- 4) Jalankan file ini di SQL Editor

-- Untuk database project terbaru:
insert into public.admin_users (id)
values ('00000000-0000-0000-0000-000000000000')
on conflict (id) do nothing;

-- Kalau setup database kamu memakai table app_admins dari versi awal,
-- aktifkan baris di bawah ini dengan mengganti UUID yang sama:
-- insert into public.app_admins (user_id, role)
-- values ('00000000-0000-0000-0000-000000000000', 'owner')
-- on conflict (user_id) do update set role = 'owner';
