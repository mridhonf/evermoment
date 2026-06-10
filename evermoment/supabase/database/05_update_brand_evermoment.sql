-- OPTIONAL MIGRATION: ganti brand existing dari Aruna Visual ke Evermoment.
-- Jalankan ini kalau database Supabase kamu sudah terlanjur berisi seed lama "Aruna Visual".

update public.site_settings
set
  brand_name = 'Evermoment',
  tagline = coalesce(nullif(tagline, ''), 'Photo · Video · Story'),
  updated_at = now()
where brand_name = 'Aruna Visual' or brand_name is null;
