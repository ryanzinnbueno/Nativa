begin;
alter table public.nativa_settings add column if not exists promotion jsonb not null default '{"enabled":true,"title":"Uma seleção especial para você","message":"Veja os produtos em oferta e escolha seus favoritos.","cta":"Ver ofertas","image":""}'::jsonb;
alter table public.nativa_settings add constraint nativa_promotion_object check (jsonb_typeof(promotion)='object');
grant update(promotion) on public.nativa_settings to authenticated;
-- Existing RLS limits changes to authorized administrators. No customer permissions change.
commit;
