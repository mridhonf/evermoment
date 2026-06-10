alter table if exists public.packages
add column if not exists category text default 'Lainnya';

update public.packages
set category = 'Foto'
where lower(coalesce(name, '')) like '%foto%'
   or lower(coalesce(name, '')) like '%photo%';

update public.packages
set category = 'Video'
where lower(coalesce(name, '')) like '%video%';

update public.packages
set category = 'Lainnya'
where category is null or category = '';

-- Kalau semua paket kamu masih masuk Lainnya, edit manual dari Dashboard Owner:
-- Dashboard Owner -> Paket Booking -> Kategori tampil -> pilih Foto/Video/Lainnya -> Simpan Paket.
