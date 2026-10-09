begin;
alter table public.nativa_products
  add column if not exists highlights text not null default '',
  add column if not exists usage text not null default '';
alter table public.nativa_products
  add constraint nativa_product_highlights_length check (char_length(highlights) <= 1000),
  add constraint nativa_product_usage_length check (char_length(usage) <= 1200);
commit;
