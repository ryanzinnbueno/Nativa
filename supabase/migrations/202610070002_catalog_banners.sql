begin;
grant insert on public.nativa_products to authenticated;
create policy admin_catalog_insert on public.nativa_products for insert to authenticated with check (public.nativa_is_admin());
alter table public.nativa_settings add column banner_seconds integer not null default 7 check (banner_seconds between 3 and 20);
alter table public.nativa_settings add column banner_autoplay boolean not null default true;
grant update(banner_seconds,banner_autoplay) on public.nativa_settings to authenticated;
create table public.nativa_banners (
 id text primary key, category text not null, tag text not null default '',
 title text not null default '', accent text not null default '',
 heading text not null, heading_accent text not null default '',
 description text not null default '', cta text not null, image text not null, alt text not null,
 active boolean not null default true, position integer not null default 0 check (position between 0 and 999)
);
alter table public.nativa_banners enable row level security;
revoke all on public.nativa_banners from anon,authenticated;
grant select on public.nativa_banners to anon,authenticated;
grant insert,update on public.nativa_banners to authenticated;
create policy public_banners on public.nativa_banners for select to anon,authenticated using (active or public.nativa_is_admin());
create policy admin_banners_insert on public.nativa_banners for insert to authenticated with check (public.nativa_is_admin());
create policy admin_banners_update on public.nativa_banners for update to authenticated using (public.nativa_is_admin()) with check (public.nativa_is_admin());
insert into public.nativa_banners(id,category,tag,title,accent,heading,heading_accent,description,cta,image,alt,position) values
 ('graos','Grãos e cereais','O NATURAL EM CADA ESCOLHA','Pequenos grãos.','Novas possibilidades.','Grãos','& cereais','Aveia, sementes e cereais para dar mais sabor às suas receitas do dia a dia.','Explorar grãos','/images/carousel-graos.webp','Aveia e sementes em uma tigela de cerâmica',0),
 ('castanhas','Castanhas','UMA PAUSA CHEIA DE SABOR','Uma porção de sabor.','Um momento seu.','Castanhas','& sabores','Castanhas, amêndoas e combinações para acompanhar as pequenas pausas da rotina.','Conhecer castanhas','/images/carousel-castanhas.webp','Castanhas e amêndoas em uma tigela',1),
 ('chas','Chás e ervas','RESPIRE. DESACELERE. SABOREIE.','O tempo de uma xícara.','O prazer de cuidar.','Chás','naturais','Ervas e infusões naturais para transformar um instante simples em um ritual gostoso.','Descobrir chás','/images/carousel-chas.webp','Xícara de chá com camomila e hibisco',2);
commit;
