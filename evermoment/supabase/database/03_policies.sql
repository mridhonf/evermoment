-- ARUNA VISUAL RLS & STORAGE POLICIES
-- Jalankan setelah 01_schema.sql dan setelah kamu membuat akun owner di Supabase Auth.
-- Lalu masukkan USER ID owner ke public.admin_users.

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admin_users
    where id = auth.uid()
  );
$$;

alter table public.site_settings enable row level security;
alter table public.packages enable row level security;
alter table public.photos enable row level security;
alter table public.videos enable row level security;
alter table public.admin_users enable row level security;

-- Hindari error kalau policy dijalankan ulang.
drop policy if exists "Public can read site settings" on public.site_settings;
drop policy if exists "Admin can manage site settings" on public.site_settings;
drop policy if exists "Public can read active packages" on public.packages;
drop policy if exists "Admin can manage packages" on public.packages;
drop policy if exists "Public can read active photos" on public.photos;
drop policy if exists "Admin can manage photos" on public.photos;
drop policy if exists "Public can read active videos" on public.videos;
drop policy if exists "Admin can manage videos" on public.videos;
drop policy if exists "Admin can read admin users" on public.admin_users;

create policy "Public can read site settings"
on public.site_settings
for select
to anon, authenticated
using (true);

create policy "Admin can manage site settings"
on public.site_settings
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "Public can read active packages"
on public.packages
for select
to anon, authenticated
using (is_active = true or public.is_admin());

create policy "Admin can manage packages"
on public.packages
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "Public can read active photos"
on public.photos
for select
to anon, authenticated
using (is_active = true or public.is_admin());

create policy "Admin can manage photos"
on public.photos
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "Public can read active videos"
on public.videos
for select
to anon, authenticated
using (is_active = true or public.is_admin());

create policy "Admin can manage videos"
on public.videos
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "Admin can read admin users"
on public.admin_users
for select
to authenticated
using (public.is_admin());

-- Storage policies
-- Bucket public tetap bisa dibaca publik, tapi upload/update/delete hanya untuk admin.
drop policy if exists "Public can read aruna visual storage" on storage.objects;
drop policy if exists "Admin can upload aruna visual storage" on storage.objects;
drop policy if exists "Admin can update aruna visual storage" on storage.objects;
drop policy if exists "Admin can delete aruna visual storage" on storage.objects;

create policy "Public can read aruna visual storage"
on storage.objects
for select
to anon, authenticated
using (bucket_id in ('logos', 'photos', 'videos', 'video-thumbnails'));

create policy "Admin can upload aruna visual storage"
on storage.objects
for insert
to authenticated
with check (
  bucket_id in ('logos', 'photos', 'videos', 'video-thumbnails')
  and public.is_admin()
);

create policy "Admin can update aruna visual storage"
on storage.objects
for update
to authenticated
using (
  bucket_id in ('logos', 'photos', 'videos', 'video-thumbnails')
  and public.is_admin()
)
with check (
  bucket_id in ('logos', 'photos', 'videos', 'video-thumbnails')
  and public.is_admin()
);

create policy "Admin can delete aruna visual storage"
on storage.objects
for delete
to authenticated
using (
  bucket_id in ('logos', 'photos', 'videos', 'video-thumbnails')
  and public.is_admin()
);
