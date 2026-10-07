begin;
create table public.nativa_categories (
 id text primary key, name text not null unique check (char_length(name) between 1 and 60),
 position integer not null default 0 check (position between 0 and 999)
);
alter table public.nativa_categories enable row level security;
revoke all on public.nativa_categories from anon,authenticated;
grant select on public.nativa_categories to anon,authenticated;
grant insert,update on public.nativa_categories to authenticated;
create policy public_categories on public.nativa_categories for select to anon,authenticated using (true);
create policy admin_categories_insert on public.nativa_categories for insert to authenticated with check (public.nativa_is_admin());
create policy admin_categories_update on public.nativa_categories for update to authenticated using (public.nativa_is_admin()) with check (public.nativa_is_admin());
-- Preserve every existing category, including categories added in the previous editor.
insert into public.nativa_categories(id,name,position)
select gen_random_uuid()::text,name,case name when 'Castanhas' then 0 when 'Grãos e cereais' then 1 when 'Chás e ervas' then 2 when 'Frutas secas' then 3 else 4 end
from (select category as name from public.nativa_products union select category from public.nativa_banners
 union select unnest(array['Castanhas','Grãos e cereais','Chás e ervas','Frutas secas'])) names;
alter table public.nativa_products add constraint nativa_product_category foreign key(category) references public.nativa_categories(name) on update cascade;
alter table public.nativa_banners add constraint nativa_banner_category foreign key(category) references public.nativa_categories(name) on update cascade;
alter table public.nativa_products add column sale_price integer;
alter table public.nativa_products add constraint nativa_sale_price check (sale_price is null or (sale_price >= 1 and sale_price < price));
create or replace function public.nativa_place_order(payload jsonb) returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare
  buyer_name text := btrim(coalesce(payload->>'name',''));
  buyer_phone text := regexp_replace(coalesce(payload->>'phone',''),'[^0-9]','','g');
  request_id text := coalesce(payload->>'requestKey','');
  request_fingerprint text := md5((payload - 'requestKey')::text);
  shipping text := coalesce(payload->>'delivery','');
  channel_name text := coalesce(payload->>'channel','');
  payment_name text := coalesce(payload->>'payment','');
  shipping_address text := btrim(coalesce(payload->>'address',''));
  order_notes text := coalesce(payload->>'notes','');
  existing public.nativa_orders%rowtype;
  product public.nativa_products%rowtype;
  item jsonb;
  snapshot jsonb := '[]'::jsonb;
  seen text[] := array[]::text[];
  quantity integer;
  subtotal integer := 0;
  customer_uuid uuid;
  order_uuid uuid;
begin
  if payload is null or jsonb_typeof(payload) <> 'object' or octet_length(payload::text) > 12000 then
    raise exception using errcode='22023', message='Dados do pedido inválidos.';
  end if;
  if char_length(buyer_name) not between 2 and 100 or buyer_phone !~ '^[0-9]{10,11}$' or request_id !~ '^[-a-zA-Z0-9]{10,80}$' then
    raise exception using errcode='22023', message='Confira seu nome e um telefone com DDD.';
  end if;
  if shipping not in ('Retirada','Entrega') or channel_name not in ('Site','WhatsApp') or payment_name not in ('Pix','Cartão na retirada','A combinar') then
    raise exception using errcode='22023', message='Confira a forma de entrega e pagamento.';
  end if;
  if char_length(shipping_address)>400 or (shipping='Entrega' and char_length(shipping_address)<8) or char_length(order_notes)>1000 then
    raise exception using errcode='22023', message='Confira o endereço e as observações.';
  end if;
  if jsonb_typeof(payload->'items') is distinct from 'array' then
    raise exception using errcode='22023', message='Sua sacola está vazia ou contém itens inválidos.';
  end if;
  if jsonb_array_length(payload->'items') not between 1 and 50 then
    raise exception using errcode='22023', message='Sua sacola está vazia ou contém itens inválidos.';
  end if;
  if channel_name='WhatsApp' and not exists(select 1 from public.nativa_settings where id=1 and phone<>'') then
    raise exception using errcode='22023', message='O WhatsApp da loja ainda não está configurado.';
  end if;

  -- Concurrent retries of one request cannot create duplicate orders.
  perform pg_advisory_xact_lock(hashtextextended('request:'||request_id,0));
  select * into existing from public.nativa_orders where request_key=request_id;
  if found then
    if existing.request_hash is distinct from request_fingerprint then
      raise exception using errcode='22023', message='Este pedido mudou. Reabra a sacola para finalizar novamente.';
    end if;
    return jsonb_build_object('id',existing.id,'total',existing.total,'items',existing.items);
  end if;

  perform pg_advisory_xact_lock(hashtextextended('phone:'||buyer_phone,0));
  if (select count(*) from public.nativa_orders o join public.nativa_customers c on c.id=o.customer_id
      where c.phone=buyer_phone and o.created>now()-interval '15 minutes') >= 6 then
    raise exception using errcode='P0001', message='Muitos pedidos em sequência. Aguarde alguns minutos e tente novamente.';
  end if;
  for item in select value from jsonb_array_elements(payload->'items') loop
    if jsonb_typeof(item) is distinct from 'object' or jsonb_typeof(item->'qty') is distinct from 'number' or coalesce(item->>'qty','') !~ '^([1-9]|[1-9][0-9])$' or coalesce(item->>'id','')=any(seen) then
      raise exception using errcode='22023', message='Confira os produtos e as quantidades da sacola.';
    end if;
    quantity := (item->>'qty')::integer;
    select * into product from public.nativa_products where id=item->>'id' and active for share;
    if not found then
      raise exception using errcode='22023', message='Um produto não está disponível. Atualize a página e confira sua sacola.';
    end if;
    seen := array_append(seen,product.id);
    subtotal := subtotal + coalesce(product.sale_price,product.price)*quantity;
    snapshot := snapshot || jsonb_build_array(jsonb_build_object('id',product.id,'name',product.name,'weight',product.weight,'price',coalesce(product.sale_price,product.price),'qty',quantity));
  end loop;
  insert into public.nativa_customers(name,phone) values(buyer_name,buyer_phone)
    on conflict(phone) do update set name=excluded.name returning id into customer_uuid;
  insert into public.nativa_orders(customer_id,items,total,channel,delivery,address,payment,notes,request_key,request_hash)
    values(customer_uuid,snapshot,subtotal,channel_name,shipping,shipping_address,payment_name,order_notes,request_id,request_fingerprint)
    returning id into order_uuid;
  return jsonb_build_object('id',order_uuid,'total',subtotal,'items',snapshot);
end;
$$;

commit;
