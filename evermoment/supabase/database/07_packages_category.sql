alter table if exists public.packages
add column if not exists category text default 'Lainnya';

update public.packages
set category = case
  when lower(coalesce(name, '')) like '%foto%' then 'Foto'
  when lower(coalesce(name, '')) like '%video%' then 'Video'
  else coalesce(category, 'Lainnya')
end
where category is null or category = '';
