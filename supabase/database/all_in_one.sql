-- EVERMOMENT DATABASE SCHEMA
-- Jalankan file ini di Supabase SQL Editor terlebih dahulu.

create extension if not exists "pgcrypto";

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.site_settings (
  id uuid primary key default gen_random_uuid(),
  brand_name text not null default 'Evermoment',
  tagline text not null default 'Photo · Video · Story',
  whatsapp_number text default '6281234567890',
  logo_url text,
  favicon_url text,
  updated_at timestamptz not null default now()
);

create table if not exists public.packages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  price text not null,
  description text,
  features text[] default '{}',
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.photos (
  id uuid primary key default gen_random_uuid(),
  title text,
  category text,
  image_url text not null,
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.videos (
  id uuid primary key default gen_random_uuid(),
  title text,
  category text,
  video_url text not null,
  thumbnail_url text,
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Daftar akun owner/admin. Setelah membuat user Auth, masukkan user_id ke table ini.
create table if not exists public.admin_users (
  id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create trigger set_updated_at_site_settings
before update on public.site_settings
for each row execute function public.set_updated_at();

create trigger set_updated_at_packages
before update on public.packages
for each row execute function public.set_updated_at();

create trigger set_updated_at_photos
before update on public.photos
for each row execute function public.set_updated_at();

create trigger set_updated_at_videos
before update on public.videos
for each row execute function public.set_updated_at();

-- Storage buckets untuk upload media.
insert into storage.buckets (id, name, public)
values
  ('logos', 'logos', true),
  ('photos', 'photos', true),
  ('videos', 'videos', true),
  ('video-thumbnails', 'video-thumbnails', true)
on conflict (id) do update set public = excluded.public;
-- EVERMOMENT SEED DATA
-- Jalankan setelah 01_schema.sql.

insert into public.site_settings (brand_name, tagline, whatsapp_number, logo_url, favicon_url)
select 'Evermoment', 'Photo · Video · Story', '6281234567890', '/default-logo.svg', '/favicon.svg'
where not exists (select 1 from public.site_settings);

insert into public.packages (name, price, description, features, sort_order, is_active)
values
  (
    'Basic',
    'Rp 750.000',
    'Untuk dokumentasi singkat dan kebutuhan personal.',
    array['1 fotografer', '2 jam sesi', '30 foto edit', 'Online gallery'],
    1,
    true
  ),
  (
    'Signature',
    'Rp 1.500.000',
    'Paket favorit untuk event dan prewedding simple.',
    array['1 fotografer + 1 videografer', '4 jam coverage', '80 foto edit', 'Highlight video 1 menit'],
    2,
    true
  ),
  (
    'Premium',
    'Rp 2.800.000',
    'Untuk dokumentasi lengkap dengan output foto dan video.',
    array['Full day coverage', '150 foto edit', 'Cinematic video 3-5 menit', 'Thumbnail & preview cepat'],
    3,
    true
  )
on conflict do nothing;

-- Data foto/video sample memakai URL eksternal agar tampilan awal tidak kosong.
-- Nanti bisa dihapus dari dashboard setelah owner upload foto/video asli.
insert into public.photos (title, category, image_url, sort_order, is_active)
values
  ('Elegant Wedding Detail', 'Wedding', 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1000&q=80', 1, true),
  ('Prewedding Outdoor', 'Prewedding', 'https://images.unsplash.com/photo-1523438885200-e635ba2c371e?auto=format&fit=crop&w=1000&q=80', 2, true),
  ('Commercial Product Shoot', 'Commercial', 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1000&q=80', 3, true),
  ('Event Documentation', 'Event', 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=1000&q=80', 4, true)
on conflict do nothing;

insert into public.videos (title, category, thumbnail_url, video_url, sort_order, is_active)
values
  ('Wedding Highlight', 'Wedding', 'https://images.unsplash.com/photo-1502635385003-ee1e6a1a742d?auto=format&fit=crop&w=1000&q=80', 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4', 1, true),
  ('Brand Story Film', 'Commercial', 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1000&q=80', 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4', 2, true)
on conflict do nothing;
-- EVERMOMENT RLS & STORAGE POLICIES
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
