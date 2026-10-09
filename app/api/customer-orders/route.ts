import { createClient } from "../../../lib/supabase/server";
import { reply } from "../../../lib/supabase/http";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  try {
    const offset = Number(
      new URL(request.url).searchParams.get("offset") || "0",
    );
    if (!Number.isInteger(offset) || offset < 0 || offset > 100000)
      return reply({ error: "Página inválida." }, 400);
    const client = await createClient();
    const {
      data: { user },
      error: authError,
    } = await client.auth.getUser();
    if (authError || !user?.phone)
      return reply({ error: "Entre para ver seus pedidos." }, 401);
    const { data, error } = await client
      .from("nativa_orders")
      .select(
        "id,items,total,status,channel,delivery,address,payment,notes,created",
      )
      .eq("account_id", user.id)
      .is("deleted_at", null)
      .order("created", { ascending: false })
      .order("id")
      .range(offset, offset + 20);
    if (error) throw error;
    return reply({ orders: data.slice(0, 20), hasMore: data.length > 20 });
  } catch {
    return reply(
      { error: "Não foi possível carregar os pedidos. Tente novamente." },
      503,
    );
  }
}
