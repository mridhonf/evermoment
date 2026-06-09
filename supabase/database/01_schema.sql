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
