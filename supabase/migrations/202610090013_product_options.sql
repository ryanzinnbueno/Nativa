begin;
alter table public.nativa_products add column if not exists images jsonb not null default '[]'::jsonb;
alter table public.nativa_products add column if not exists variants jsonb not null default '[]'::jsonb;
create or replace function public.nativa_valid_options(options jsonb) returns boolean
language plpgsql immutable set search_path='' as $$
declare v jsonb; seen text[] := array[]::text[];
begin
 if jsonb_typeof(options) is distinct from 'array' then return false; end if;
 if jsonb_array_length(options)>19 then return false; end if;
 for v in select value from jsonb_array_elements(options) loop
  if jsonb_typeof(v) is distinct from 'object' or jsonb_typeof(v->'id') is distinct from 'string' or char_length(v->>'id') not between 1 and 80 or v->>'id'=any(seen)
   or jsonb_typeof(v->'weight') is distinct from 'string' or char_length(btrim(v->>'weight')) not between 1 and 60
   or jsonb_typeof(v->'price') is distinct from 'number' or coalesce(v->>'price','') !~ '^[0-9]+$' then return false; end if;
  if (v->>'price')::numeric not between 1 and 1000000 then return false; end if;
  if v->'sale_price' is not null and v->'sale_price'<>'null'::jsonb then
   if jsonb_typeof(v->'sale_price') is distinct from 'number' or coalesce(v->>'sale_price','') !~ '^[0-9]+$' then return false; end if;
   if (v->>'sale_price')::numeric <1 or (v->>'sale_price')::numeric >= (v->>'price')::numeric then return false; end if;
  end if;
  seen:=array_append(seen,v->>'id');
 end loop;
 return true;
end; $$;
alter table public.nativa_products add constraint nativa_valid_product_options check(public.nativa_valid_options(variants));
alter table public.nativa_products add constraint nativa_product_gallery check(jsonb_typeof(images)='array' and jsonb_array_length(images)<=7);
create or replace function public.nativa_place_order(payload jsonb) returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare
  account_uuid uuid := auth.uid();
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
  variant jsonb;
  variant_id text;
  item_key text;
  item_weight text;
  item_price integer;
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
    if existing.account_id is distinct from account_uuid or existing.request_hash is distinct from request_fingerprint then
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
    if jsonb_typeof(item) is distinct from 'object' or jsonb_typeof(item->'qty') is distinct from 'number' or coalesce(item->>'qty','') !~ '^([1-9]|[1-9][0-9])$' or jsonb_build_array(item->>'id',coalesce(item->>'variant',''))::text=any(seen) then
      raise exception using errcode='22023', message='Confira os produtos e as quantidades da sacola.';
    end if;
    quantity := (item->>'qty')::integer;
    select * into product from public.nativa_products where id=item->>'id' and active and deleted_at is null for share;
    if not found then
      raise exception using errcode='22023', message='Um produto não está disponível. Atualize a página e confira sua sacola.';
    end if;
    variant_id := coalesce(item->>'variant','');
    item_key := jsonb_build_array(product.id,variant_id)::text;
    item_weight := product.weight;
    item_price := coalesce(product.sale_price,product.price);
    if variant_id <> '' then
      select value into variant from jsonb_array_elements(product.variants) where value->>'id'=variant_id;
      if not found then
        raise exception using errcode='22023', message='Esta opção não está disponível. Confira sua sacola.';
      end if;
      item_weight := variant->>'weight';
      item_price := coalesce((variant->>'sale_price')::integer,(variant->>'price')::integer);
    end if;
    seen := array_append(seen,item_key);
    subtotal := subtotal + item_price*quantity;
    snapshot := snapshot || jsonb_build_array(jsonb_build_object('id',product.id,'name',product.name,'weight',item_weight,'price',item_price,'variant',nullif(variant_id,''),'qty',quantity));
  end loop;
  insert into public.nativa_customers(name,phone) values(buyer_name,buyer_phone)
    on conflict(phone) do update set name=excluded.name returning id into customer_uuid;
  insert into public.nativa_orders(account_id,customer_id,items,total,channel,delivery,address,payment,notes,request_key,request_hash)
    values(account_uuid,customer_uuid,snapshot,subtotal,channel_name,shipping,shipping_address,payment_name,order_notes,request_id,request_fingerprint)
    returning id into order_uuid;
  return jsonb_build_object('id',order_uuid,'total',subtotal,'items',snapshot);
end;
$$;

commit;
