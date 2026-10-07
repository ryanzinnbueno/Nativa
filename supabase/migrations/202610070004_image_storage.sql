begin;
-- Public marketing images only; no customer files or private documents belong here.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values ('nativa-images','nativa-images',true,4194304,array['image/webp'])
on conflict (id) do nothing;
create policy nativa_images_admin_upload on storage.objects for insert to authenticated
with check (bucket_id='nativa-images' and public.nativa_is_admin() and (name like 'product/%' or name like 'banner/%'));
-- No overwrite or deletion permissions. Each upload has a new generated filename.
commit;
