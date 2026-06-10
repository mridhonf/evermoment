-- EVERMOMENT SEED DATA
-- Jalankan setelah 01_schema.sql.

insert into public.site_settings (brand_name, tagline, whatsapp_number, logo_url, favicon_url)
select 'Evermoment', 'Photo · Video · Story', '6281234567890', '/default-logo.svg', '/favicon.svg'
where not exists (select 1 from public.site_settings);

insert into public.packages (name, category, price, description, features, sort_order, is_active)
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
