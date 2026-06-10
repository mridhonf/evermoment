alter table if exists public.packages
add column if not exists category text default 'Lainnya';

update public.packages
set category = 'Photo'
where lower(coalesce(category, '')) in ('foto', 'photo', 'photography')
   or lower(coalesce(name, '')) like '%foto%'
   or lower(coalesce(name, '')) like '%photo%';

update public.packages
set category = 'Video'
where lower(coalesce(category, '')) in ('video', 'videography', 'videografi')
   or lower(coalesce(name, '')) like '%video%';

update public.packages
set category = 'Lainnya'
where category is null or category = '';
