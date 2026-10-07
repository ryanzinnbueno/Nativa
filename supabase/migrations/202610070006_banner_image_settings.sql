begin;
-- Independent framing and optional mobile artwork. Existing banners keep their current appearance.
alter table public.nativa_banners add column if not exists image_settings jsonb;
alter table public.nativa_banners add constraint nativa_banner_image_settings_object check (image_settings is null or jsonb_typeof(image_settings) = 'object');
commit;
