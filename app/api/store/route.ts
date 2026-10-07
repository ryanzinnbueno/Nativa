import { createClient, adminClient } from "../../../lib/supabase/server";
import { reply, sameOrigin } from "../../../lib/supabase/http";
import { statuses } from "../../catalog";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    if (new URL(request.url).searchParams.get("scope") === "admin") {
      const client = await adminClient();
      if (!client)
        return reply(
          {
            error:
              "Entre com uma conta autorizada para acessar a área da Nativa.",
          },
          401,
        );
      const [orders, customers, settings] = await Promise.all([
        client
          .from("nativa_orders")
          .select("*")
          .order("created", { ascending: false })
          .limit(500),
        client
          .from("nativa_customers")
          .select("*")
          .order("created", { ascending: false })
          .limit(500),
        client.from("nativa_settings").select("phone").eq("id", 1).single(),
      ]);
      if (orders.error || customers.error || settings.error)
        throw new Error("Database read failed");
      return reply({
        orders: orders.data,
        customers: customers.data,
        phone: settings.data.phone,
      });
    }
    const client = await createClient();
    const [catalog, settings, banners, categories] = await Promise.all([
      client
        .from("nativa_products")
        .select(
          "id,name,subtitle,category,weight,price,sale_price,tag,image,description,ingredients",
        )
        .eq("active", true)
        .order("position"),
      client
        .from("nativa_settings")
        .select("phone,banner_seconds,banner_autoplay")
        .eq("id", 1)
        .single(),
      client
        .from("nativa_banners")
        .select("*")
        .eq("active", true)
        .order("position")
        .order("id"),
      client
        .from("nativa_categories")
        .select("id,name,position")
        .order("position")
        .order("name"),
    ]);
    if (catalog.error || settings.error || banners.error || categories.error)
      throw new Error("Database read failed");
    return reply({
      products: catalog.data,
      banners: banners.data,
      categories: categories.data,
      ...settings.data,
    });
  } catch {
    return reply(
      {
        error:
          "Não foi possível carregar a loja. Tente novamente em instantes.",
      },
      503,
    );
  }
}
export async function POST(request: Request) {
  if (!sameOrigin(request)) return reply({ error: "Origem inválida." }, 403);
  try {
    const text = await request.text();
    if (text.length > 12000)
      return reply({ error: "Pedido muito grande." }, 400);
    let body;
    try {
      body = JSON.parse(text);
    } catch {
      return reply({ error: "Dados inválidos." }, 400);
    }
    const client = await createClient();
    const { data, error } = await client.rpc("nativa_place_order", {
      payload: body,
    });
    if (error) {
      if (error.code === "22023") return reply({ error: error.message }, 400);
      if (error.code === "P0001") return reply({ error: error.message }, 429);
      throw error;
    }
    return reply(data, 201);
  } catch {
    return reply(
      {
        error:
          "Não foi possível registrar o pedido. Sua sacola foi mantida; tente novamente.",
      },
      503,
    );
  }
}
export async function PATCH(request: Request) {
  if (!sameOrigin(request)) return reply({ error: "Origem inválida." }, 403);
  try {
    const client = await adminClient();
    if (!client)
      return reply(
        {
          error:
            "Entre com uma conta autorizada para acessar a área da Nativa.",
        },
        401,
      );
    const b = await request.json();
    let result;
    if (
      b.type === "status" &&
      statuses.includes(b.status) &&
      typeof b.id === "string"
    ) {
      result = await client
        .from("nativa_orders")
        .update({ status: b.status })
        .eq("id", b.id)
        .select("id");
    } else if (
      b.type === "notes" &&
      typeof b.id === "string" &&
      typeof b.notes === "string" &&
      b.notes.length <= 3000
    ) {
      result = await client
        .from("nativa_customers")
        .update({ notes: b.notes })
        .eq("id", b.id)
        .select("id");
    } else if (
      b.type === "banner-settings" &&
      Number.isInteger(b.banner_seconds) &&
      b.banner_seconds >= 3 &&
      b.banner_seconds <= 20 &&
      typeof b.banner_autoplay === "boolean"
    ) {
      result = await client
        .from("nativa_settings")
        .update({
          banner_seconds: b.banner_seconds,
          banner_autoplay: b.banner_autoplay,
        })
        .eq("id", 1)
        .select("id");
    } else if (b.type === "settings" && typeof b.phone === "string") {
      const phone = b.phone.replace(/\D/g, "");
      if (phone && !/^55\d{10,11}$/.test(phone))
        return reply({ error: "Use 55 + DDD + número do WhatsApp." }, 400);
      result = await client
        .from("nativa_settings")
        .update({ phone })
        .eq("id", 1)
        .select("id");
    } else return reply({ error: "Dados inválidos." }, 400);
    if (result.error) throw result.error;
    if (!result.data?.length)
      return reply({ error: "Registro não encontrado." }, 404);
    return reply({ ok: true });
  } catch {
    return reply({ error: "Não foi possível salvar. Tente novamente." }, 503);
  }
}
