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
});
after(async () => {
  await db?.close();
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
