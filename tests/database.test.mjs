import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";

let db;
const admin = "10000000-0000-4000-8000-000000000001";
const outsider = "10000000-0000-4000-8000-000000000002";
before(async () => {
  db = new PGlite();
  await db.exec(`create role anon; create role authenticated;
    create schema auth; create table auth.users(id uuid primary key);
    create function auth.uid() returns uuid language sql stable as
    $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid; $$;
    grant usage on schema auth to anon,authenticated;
    insert into auth.users(id) values ('${admin}'),('${outsider}');`);
  await db.exec(
    await readFile(
      new URL(
        "../supabase/migrations/202610070001_nativa.sql",
        import.meta.url,
      ),
      "utf8",
    ),
  );
  await db.exec(
    await readFile(new URL("../supabase/seed.sql", import.meta.url), "utf8"),
  );
  await db.query("insert into nativa_admins(user_id) values ($1)", [admin]);
  await db.exec(
    await readFile(
      new URL(
        "../supabase/migrations/202610070002_catalog_banners.sql",
        import.meta.url,
      ),
      "utf8",
    ),
  );
  await db.exec(
    await readFile(
      new URL(
        "../supabase/migrations/202610070003_categories_offers.sql",
        import.meta.url,
      ),
      "utf8",
    ),
  );
  // Supabase Storage's permission surface in this isolated database, never a live bucket.
  await db.exec(`create schema storage;
    create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
    create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text,name text);
    alter table storage.objects enable row level security;
    grant usage on schema storage to anon,authenticated;
    grant insert,select on storage.objects to authenticated;`);
  await db.exec(
    await readFile(
      new URL(
        "../supabase/migrations/202610070004_image_storage.sql",
        import.meta.url,
      ),
      "utf8",
    ),
  );
  await db.exec(
    await readFile(
      new URL(
        "../supabase/migrations/202610070005_trash_image_banners.sql",
        import.meta.url,
      ),
      "utf8",
    ),
  );
  await db.exec(
    await readFile(
      new URL(
        "../supabase/migrations/202610070006_banner_image_settings.sql",
        import.meta.url,
      ),
      "utf8",
    ),
  );
  await db.exec(
    await readFile(
      new URL(
        "../supabase/migrations/202610090007_promotions.sql",
        import.meta.url,
      ),
      "utf8",
    ),
  );
  await db.exec(
    await readFile(
      new URL(
        "../supabase/migrations/202610090008_product_details.sql",
        import.meta.url,
      ),
      "utf8",
    ),
  );
  await db.exec(
    await readFile(
      new URL(
        "../supabase/migrations/202610090009_customer_accounts.sql",
        import.meta.url,
      ),
      "utf8",
    ),
  );
});
after(async () => {
  await db?.close();
});

test("categories can be created only by admins; renaming updates product and banner selections together", async () => {
  const insert =
    "insert into nativa_categories(id,name,position) values ('flores','Flores',5)";
  await as("anon", null, () => assert.rejects(db.exec(insert)));
  await as("authenticated", outsider, () => assert.rejects(db.exec(insert)));
  await as("authenticated", admin, async () => {
    await db.exec(insert);
    await db.exec(
      "update nativa_categories set name='Nozes e castanhas' where name='Castanhas'",
    );
  });
  assert.equal(
    (
      await db.query(
        "select count(*)::int as count from nativa_products where category='Nozes e castanhas'",
      )
    ).rows[0].count,
    2,
  );
  assert.equal(
    (
      await db.query(
        "select count(*)::int as count from nativa_banners where category='Nozes e castanhas'",
      )
    ).rows[0].count,
    1,
  );
  await as("authenticated", outsider, async () => {
    assert.equal(
      (
        await db.query(
          "update nativa_categories set name='Outro nome' where id='flores' returning id",
        )
      ).rows.length,
      0,
    );
  });
  await db.exec(
    "update nativa_categories set name='Castanhas' where name='Nozes e castanhas'",
  );
  await assert.rejects(
    db.exec(
      "update nativa_products set category='Categoria inexistente' where id='caju'",
    ),
  );
});

test("marketing uploads allow admins only and do not permit overwrites or customer-document paths", async () => {
  const insert =
    "insert into storage.objects(bucket_id,name) values ('nativa-images','product/foto.webp')";
  await as("anon", null, () => assert.rejects(db.exec(insert)));
  await as("authenticated", outsider, () => assert.rejects(db.exec(insert)));
  await as("authenticated", admin, async () => {
    await db.exec(insert);
    await assert.rejects(
      db.exec(
        "insert into storage.objects(bucket_id,name) values ('nativa-images','private/document.webp')",
      ),
    );
    await assert.rejects(
      db.exec(
        "insert into storage.objects(bucket_id,name) values ('another-bucket','product/foto.webp')",
      ),
    );
    await assert.rejects(
      db.exec("update storage.objects set name='product/overwrite.webp'"),
    );
  });
  assert.equal(
    (
      await db.query(
        "select public from storage.buckets where id='nativa-images'",
      )
    ).rows[0].public,
    true,
  );
});

test("only authorized admins register products and banners; guests see active entries only", async () => {
  const insertProduct =
    "insert into nativa_products(id,name,subtitle,category,weight,price,tag,image,description,ingredients,active) values ('novo','Novo item','','Castanhas','100 g',1000,'','/images/caju.jpg','','',false)";
  const insertBanner =
    "insert into nativa_banners(id,category,heading,cta,image,alt,active,position) values ('novo-banner','Castanhas','Novo','Ver','/images/carousel-castanhas.webp','Castanhas',false,5)";
  await as("anon", null, async () => {
    await assert.rejects(db.exec(insertProduct));
    await assert.rejects(db.exec(insertBanner));
  });
  await as("authenticated", outsider, async () => {
    await assert.rejects(db.exec(insertProduct));
    await assert.rejects(db.exec(insertBanner));
    assert.equal(
      (
        await db.query(
          "update nativa_settings set banner_seconds=8 returning id",
        )
      ).rows.length,
      0,
    );
  });
  await as("authenticated", admin, async () => {
    await db.exec(insertProduct);
    await db.exec(insertBanner);
    await db.exec(
      "update nativa_settings set banner_seconds=8,banner_autoplay=false where id=1",
    );
  });
  await as("anon", null, async () => {
    assert.equal(
      (await db.query("select * from nativa_products where id='novo'")).rows
        .length,
      0,
    );
    assert.equal(
      (await db.query("select * from nativa_banners where id='novo-banner'"))
        .rows.length,
      0,
    );
  });
  await as("authenticated", outsider, async () => {
    assert.equal(
      (
        await db.query(
          "update nativa_banners set active=true where id='novo-banner' returning id",
        )
      ).rows.length,
      0,
    );
  });
  await as("authenticated", admin, async () => {
    await db.exec(
      "update nativa_products set active=true where id='novo';update nativa_banners set active=true,position=1 where id='novo-banner'",
    );
  });
  await as("anon", null, async () => {
    assert.equal(
      (await db.query("select * from nativa_products where id='novo'")).rows
        .length,
      1,
    );
    assert.equal(
      (await db.query("select * from nativa_banners where id='novo-banner'"))
        .rows.length,
      1,
    );
  });
  // Isolated fixture removed as owner; application users have no deletion permission.
  await db.exec(
    "delete from nativa_products where id='novo';delete from nativa_banners where id='novo-banner';update nativa_settings set banner_seconds=7,banner_autoplay=true where id=1",
  );
});
async function as(role, user, fn) {
  await db.query("select set_config('request.jwt.claim.sub',$1,false)", [
    user || "",
  ]);
  await db.exec(`set role ${role}`);
  try {
    return await fn();
  } finally {
    await db.exec("reset role");
  }
}
const order = (key, extra = {}) => ({
  name: "Cliente de teste",
  phone: "11999990000",
  delivery: "Retirada",
  payment: "A combinar",
  channel: "Site",
  items: [{ id: "caju", qty: 2, price: 1 }],
  requestKey: key,
  ...extra,
});
async function place(payload) {
  return (
    await db.query("select public.nativa_place_order($1::jsonb) as result", [
      JSON.stringify(payload),
    ])
  ).rows[0].result;
}

test("guests can read the catalog, but cannot read or directly insert customers/orders", async () => {
  await as("anon", null, async () => {
    assert.equal(
      (await db.query("select * from nativa_products")).rows.length,
      6,
    );
    for (const table of [
      "nativa_orders",
      "nativa_customers",
      "nativa_admins",
    ]) {
      await assert.rejects(
        db.query(`select * from ${table}`),
        /permission denied/,
      );
    }
    await assert.rejects(
      db.query(
        "insert into nativa_customers(name,phone) values ('Visitante','11999998888')",
      ),
      /permission denied/,
    );
  });
});
test("guest checkout prices on the database, stores the snapshot and retries only once", async () => {
  const payload = order("checkout-idempotency-001");
  const first = await as("anon", null, () => place(payload));
  assert.equal(first.total, 4580);
  assert.equal(first.items[0].price, 2290);
  const retry = await as("anon", null, () => place(payload));
  assert.equal(first.id, retry.id);
  assert.equal(
    (await db.query("select count(*)::int as count from nativa_orders")).rows[0]
      .count,
    1,
  );
  await as("anon", null, () =>
    assert.rejects(
      place({ ...payload, items: [{ id: "caju", qty: 3 }] }),
      /pedido mudou/,
    ),
  );
});
test("invalid orders roll back, including duplicate products and fractional quantities", async () => {
  const bad = [
    { items: [{ id: "missing", qty: 1 }] },
    {
      items: [
        { id: "caju", qty: 1 },
        { id: "caju", qty: 2 },
      ],
    },
    { items: [{ id: "caju", qty: 1.2 }] },
    { items: [{ id: "caju", qty: 0 }] },
    { items: [{ id: "caju", qty: 100 }] },
    { items: [] },
    { items: null },
    { phone: "123" },
    { delivery: "Entrega", address: "Rua" },
    { channel: "WhatsApp" },
  ];
  for (const [i, extra] of bad.entries())
    await as("anon", null, () =>
      assert.rejects(place(order("invalid-checkout-" + i, extra))),
    );
  assert.equal(
    (await db.query("select count(*)::int as count from nativa_orders")).rows[0]
      .count,
    1,
  );
});
test("an authenticated account without membership sees no CRM rows and cannot grant itself access", async () => {
  await as("authenticated", outsider, async () => {
    assert.equal(
      (await db.query("select nativa_is_admin() as allowed")).rows[0].allowed,
      false,
    );
    assert.equal(
      (await db.query("select * from nativa_orders")).rows.length,
      0,
    );
    assert.equal(
      (await db.query("select * from nativa_customers")).rows.length,
      0,
    );
    assert.equal(
      (
        await db.query(
          "update nativa_orders set status='Concluído' returning id",
        )
      ).rows.length,
      0,
    );
    await assert.rejects(
      db.query("insert into nativa_admins(user_id) values ($1)", [outsider]),
      /permission denied/,
    );
  });
});
test("authorized administrators can manage status, notes and WhatsApp, but cannot rewrite order totals", async () => {
  await as("authenticated", admin, async () => {
    assert.equal(
      (await db.query("select nativa_is_admin() as allowed")).rows[0].allowed,
      true,
    );
    assert.equal(
      (await db.query("select * from nativa_orders")).rows.length,
      1,
    );
    await db.query("update nativa_orders set status='Em preparo'");
    await db.query("update nativa_customers set notes='Prefere retirada'");
    await db.query(
      "update nativa_settings set phone='5511999990000' where id=1",
    );
    await assert.rejects(
      db.query("update nativa_orders set total=1"),
      /permission denied/,
    );
  });
  assert.equal(
    (await db.query("select status from nativa_orders")).rows[0].status,
    "Em preparo",
  );
});
test("repeated checkout is limited per phone and creates no partial record when rejected", async () => {
  for (let i = 0; i < 5; i++)
    await as("anon", null, () => place(order("rate-limit-checkout-" + i)));
  await as("anon", null, () =>
    assert.rejects(
      place(order("rate-limit-checkout-blocked")),
      /Muitos pedidos/,
    ),
  );
  assert.equal(
    (await db.query("select count(*)::int as count from nativa_orders")).rows[0]
      .count,
    6,
  );
});

test("promotional prices are validated on the database and preserve previous orders and retries", async () => {
  await as("authenticated", outsider, async () => {
    assert.equal(
      (
        await db.query(
          "update nativa_products set sale_price=1800 where id='caju' returning id",
        )
      ).rows.length,
      0,
    );
  });
  await as("authenticated", admin, async () => {
    for (const price of [0, -1, 2290, 3000])
      await assert.rejects(
        db.query("update nativa_products set sale_price=$1 where id='caju'", [
          price,
        ]),
      );
    await db.exec("update nativa_products set sale_price=1800 where id='caju'");
  });
  const payload = order("promotion-order-001", { phone: "11999992222" });
  const first = await as("anon", null, () => place(payload));
  assert.equal(first.total, 3600);
  assert.equal(first.items[0].price, 1800);
  assert.equal(
    (
      await db.query(
        "select total from nativa_orders where request_key='checkout-idempotency-001'",
      )
    ).rows[0].total,
    4580,
  );
  await as("authenticated", admin, () =>
    db.exec("update nativa_products set sale_price=null where id='caju'"),
  );
  const retry = await as("anon", null, () => place(payload));
  assert.equal(retry.id, first.id);
  assert.equal(retry.total, 3600);
  const normal = await as("anon", null, () =>
    place({ ...payload, requestKey: "promotion-order-002" }),
  );
  assert.equal(normal.total, 4580);
});

test("trash is admin-only, deleted products cannot be ordered, and restoring preserves order amounts", async () => {
  await as("authenticated", outsider, async () => {
    assert.equal(
      (
        await db.query(
          "update nativa_products set deleted_at=now() where id='caju' returning id",
        )
      ).rows.length,
      0,
    );
    assert.equal(
      (await db.query("update nativa_orders set deleted_at=now() returning id"))
        .rows.length,
      0,
    );
  });
  await as("anon", null, () =>
    assert.rejects(db.exec("update nativa_orders set deleted_at=now()")),
  );
  const old = (
    await db.query(
      "select id,total,items from nativa_orders order by created limit 1",
    )
  ).rows[0];
  await as("authenticated", admin, () =>
    db.query("update nativa_orders set deleted_at=now() where id=$1", [old.id]),
  );
  assert.equal(
    (
      await db.query(
        "select id from nativa_orders where id=$1 and deleted_at is null",
        [old.id],
      )
    ).rows.length,
    0,
  );
  await as("authenticated", admin, () =>
    db.query("update nativa_orders set deleted_at=null where id=$1", [old.id]),
  );
  const restored = (
    await db.query("select total,items from nativa_orders where id=$1", [
      old.id,
    ])
  ).rows[0];
  assert.equal(restored.total, old.total);
  assert.deepEqual(restored.items, old.items);
  await as("authenticated", admin, () =>
    db.exec(
      "update nativa_products set deleted_at=now(),active=true where id='caju'",
    ),
  );
  await as("anon", null, async () => {
    assert.equal(
      (await db.query("select id from nativa_products where id='caju'")).rows
        .length,
      0,
    );
    await assert.rejects(
      db.query("select nativa_place_order($1::jsonb)", [
        JSON.stringify({
          name: "Cliente teste",
          phone: "71912348888",
          requestKey: "trash-reject-0001",
          delivery: "Retirada",
          channel: "Site",
          payment: "Pix",
          items: [{ id: "caju", qty: 1 }],
        }),
      ]),
    );
  });
  await as("authenticated", admin, () =>
    db.exec(
      "update nativa_products set deleted_at=null,active=false where id='caju'",
    ),
  );
  await as("anon", null, async () =>
    assert.equal(
      (await db.query("select id from nativa_products where id='caju'")).rows
        .length,
      0,
    ),
  );
  await db.exec("update nativa_products set active=true where id='caju'");
});

test("banner framing persists for admins and is publicly readable without granting edit access", async () => {
  const settings = {
    desktop: { fit: "contain", zoom: 100, x: 50, y: 50 },
    mobile: { fit: "cover", zoom: 130, x: 40, y: 60 },
  };
  const id = (await db.query("select id from nativa_banners limit 1")).rows[0]
    .id;
  await as("authenticated", admin, () =>
    db.query("update nativa_banners set image_settings=$1::jsonb where id=$2", [
      JSON.stringify(settings),
      id,
    ]),
  );
  await as("anon", null, async () =>
    assert.deepEqual(
      (
        await db.query(
          "select image_settings from nativa_banners where id=$1",
          [id],
        )
      ).rows[0].image_settings,
      settings,
    ),
  );
  await as("authenticated", outsider, () =>
    db.query("update nativa_banners set image_settings=null where id=$1", [id]),
  );
  assert.deepEqual(
    (
      await db.query("select image_settings from nativa_banners where id=$1", [
        id,
      ])
    ).rows[0].image_settings,
    settings,
  );
});

test("promotion settings are public, while updates stay restricted to administrators", async () => {
  const original = (
    await db.query("select promotion from nativa_settings where id=1")
  ).rows[0].promotion;
  await as("anon", null, async () => {
    assert.deepEqual(
      (await db.query("select promotion from nativa_settings where id=1"))
        .rows[0].promotion,
      original,
    );
    await assert.rejects(
      db.exec("update nativa_settings set promotion='{}'::jsonb where id=1"),
    );
  });
  await as("authenticated", outsider, () =>
    db.exec("update nativa_settings set promotion='{}'::jsonb where id=1"),
  );
  assert.deepEqual(
    (await db.query("select promotion from nativa_settings where id=1")).rows[0]
      .promotion,
    original,
  );
  await as("authenticated", admin, () =>
    db.query("update nativa_settings set promotion=$1::jsonb where id=1", [
      JSON.stringify({ ...original, enabled: false }),
    ]),
  );
  assert.equal(
    (await db.query("select promotion from nativa_settings where id=1")).rows[0]
      .promotion.enabled,
    false,
  );
});

test("product details preserve admin-only editing and reject excessive content", async () => {
  await as("authenticated", admin, () =>
    db.query(
      "update nativa_products set highlights=$1,usage=$2 where id='caju'",
      ["Torrada\nSem sal", "Sugestão de uso informada pela loja"],
    ),
  );
  await as("authenticated", outsider, () =>
    db.exec("update nativa_products set highlights='alterado' where id='caju'"),
  );
  await as("anon", null, async () => {
    const row = (
      await db.query(
        "select highlights,usage from nativa_products where id='caju'",
      )
    ).rows[0];
    assert.equal(row.highlights, "Torrada\nSem sal");
    assert.equal(row.usage, "Sugestão de uso informada pela loja");
  });
  await as("authenticated", admin, () =>
    assert.rejects(
      db.query("update nativa_products set highlights=$1 where id='caju'", [
        "x".repeat(1001),
      ]),
    ),
  );
});

test("customer sessions see only their own orders, never guest history for the same phone", async () => {
  const other = "10000000-0000-4000-8000-000000000003";
  await db.query("insert into auth.users(id) values($1)", [other]);
  const buyer = order("account-order-001", {
    phone: "71999990001",
    account_id: other,
  });
  const own = await as("authenticated", outsider, () => place(buyer));
  const guest = await as("anon", null, () =>
    place(order("account-guest-001", { phone: "71999990001" })),
  );
  const second = await as("authenticated", other, () =>
    place(order("account-order-002", { phone: "71999990001" })),
  );
  assert.equal(
    (
      await db.query("select account_id from nativa_orders where id=$1", [
        own.id,
      ])
    ).rows[0].account_id,
    outsider,
  );
  await as("authenticated", outsider, async () => {
    const rows = (await db.query("select id from nativa_orders")).rows.map(
      (r) => r.id,
    );
    assert.deepEqual(rows, [own.id]);
    assert.equal(
      (await db.query("select id from nativa_customers")).rows.length,
      0,
    );
    await db.query("update nativa_orders set status='Cancelado' where id=$1", [
      own.id,
    ]);
  });
  assert.equal(
    (await db.query("select status from nativa_orders where id=$1", [own.id]))
      .rows[0].status,
    "Novo",
  );
  await as("authenticated", other, async () =>
    assert.deepEqual(
      (await db.query("select id from nativa_orders")).rows.map((r) => r.id),
      [second.id],
    ),
  );
  await as("anon", null, () => assert.rejects(db.query("select id from nativa_orders"), /permission denied/));
  await as("authenticated", other, () =>
    assert.rejects(place(buyer), /pedido mudou/),
  );
  await db.query("update nativa_orders set deleted_at=now() where id=$1", [
    own.id,
  ]);
  await as("authenticated", outsider, async () =>
    assert.equal(
      (await db.query("select id from nativa_orders")).rows.length,
      0,
    ),
  );
  assert.equal(
    (
      await db.query("select account_id from nativa_orders where id=$1", [
        guest.id,
      ])
    ).rows[0].account_id,
    null,
  );
});
