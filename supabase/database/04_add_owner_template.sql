-- TEMPLATE TAMBAH OWNER
-- Setelah membuat user di Supabase Auth, copy User UID-nya.
-- Ganti UUID di bawah dengan User UID owner, lalu jalankan.

insert into public.admin_users (id)
values ('00000000-0000-0000-0000-000000000000')
on conflict (id) do nothing;
