begin;
alter table public.nativa_products add column image_settings jsonb;
alter table public.nativa_products add constraint nativa_product_image_settings check (
 image_settings is null or (
  jsonb_typeof(image_settings) = 'object'
  and image_settings ?& array['fit','zoom','x','y']
  and image_settings->>'fit' in ('contain','cover')
  and jsonb_typeof(image_settings->'zoom') = 'number'
  and (image_settings->>'zoom')::numeric between 100 and 250
  and mod((image_settings->>'zoom')::numeric,1)=0
  and jsonb_typeof(image_settings->'x') = 'number'
  and (image_settings->>'x')::numeric between 0 and 100
  and mod((image_settings->>'x')::numeric,1)=0
  and jsonb_typeof(image_settings->'y') = 'number'
  and (image_settings->>'y')::numeric between 0 and 100
  and mod((image_settings->>'y')::numeric,1)=0
 )
);
alter table public.nativa_products add constraint nativa_product_image_fit_type check (
 image_settings is null or jsonb_typeof(image_settings->'fit') = 'string'
);
commit;
