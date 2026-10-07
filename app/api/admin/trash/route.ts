import { adminClient } from "../../../../lib/supabase/server";
import { reply, sameOrigin } from "../../../../lib/supabase/http";
export const dynamic = "force-dynamic";
export async function GET() {
  try {
    const client = await adminClient();
    if (!client)
      return reply({ error: "Entre com uma conta autorizada." }, 401);
    const [products, orders] = await Promise.all([
      client
        .from("nativa_products")
        .select("id,name,deleted_at")
        .not("deleted_at", "is", null)
        .order("deleted_at", { ascending: false })
        .limit(500),
      client
        .from("nativa_orders")
        .select("id,total,deleted_at,nativa_customers(name)")
        .not("deleted_at", "is", null)
        .order("deleted_at", { ascending: false })
        .limit(500),
    ]);
    if (products.error || orders.error) throw new Error();
    return reply({ products: products.data, orders: orders.data });
  } catch {
    return reply({ error: "Não foi possível carregar a lixeira." }, 503);
  }
}
export async function POST(request: Request) {
  if (!sameOrigin(request)) return reply({ error: "Origem inválida." }, 403);
  try {
    const client = await adminClient();
    if (!client)
      return reply({ error: "Entre com uma conta autorizada." }, 401);
    const raw = await request.text();
    if (raw.length > 1000) return reply({ error: "Dados inválidos." }, 400);
    let b;
    try {
      b = JSON.parse(raw);
    } catch {
      return reply({ error: "Dados inválidos." }, 400);
    }
    if (
      !b ||
      !["product", "order"].includes(b.kind) ||
      !["delete", "restore"].includes(b.action) ||
      typeof b.id !== "string" ||
      !b.id.length ||
      b.id.length > 80
    )
      return reply({ error: "Dados inválidos." }, 400);
    const restoring = b.action === "restore";
    let query = client
      .from(b.kind === "product" ? "nativa_products" : "nativa_orders")
      .update({
        deleted_at: restoring ? null : new Date().toISOString(),
        ...(b.kind === "product" ? { active: false } : {}),
      })
      .eq("id", b.id);
    query = restoring
      ? query.not("deleted_at", "is", null)
      : query.is("deleted_at", null);
    const { data, error } = await query.select("id");
    if (error) throw error;
    if (!data?.length)
      return reply(
        { error: "Este item não foi encontrado ou já foi atualizado." },
        404,
      );
    return reply({ ok: true });
  } catch {
    return reply(
      { error: "Não foi possível atualizar este item. Tente novamente." },
      503,
    );
  }
}
