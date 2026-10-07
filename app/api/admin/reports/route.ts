import { adminClient } from "../../../../lib/supabase/server";
import { reply } from "../../../../lib/supabase/http";
import { statuses } from "../../../catalog";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  try {
    const client = await adminClient();
    if (!client)
      return reply({ error: "Entre com uma conta autorizada." }, 401);
    const params = new URL(request.url).searchParams;
    const start = params.get("start") || "",
      end = params.get("end") || "",
      status = params.get("status") || "Todos";
    const valid = (s: string) =>
      /^\d{4}-\d{2}-\d{2}$/.test(s) &&
      !Number.isNaN(Date.parse(s)) &&
      new Date(s).toISOString().slice(0, 10) === s;
    if (
      !valid(start) ||
      !valid(end) ||
      start > end ||
      !["Todos", ...statuses].includes(status)
    )
      return reply(
        { error: "Confira o período e a situação dos pedidos." },
        400,
      );
    const until = new Date(end + "T00:00:00-03:00");
    until.setUTCDate(until.getUTCDate() + 1);
    const orders = [];
    for (let offset = 0; offset <= 5000; offset += 500) {
      let query = client
        .from("nativa_orders")
        .select(
          "id,total,status,channel,delivery,payment,created,nativa_customers(name,phone)",
        )
        .is("deleted_at", null)
        .gte("created", start + "T00:00:00-03:00")
        .lt("created", until.toISOString())
        .order("created", { ascending: false })
        .order("id")
        .range(offset, offset + 499);
      if (status !== "Todos") query = query.eq("status", status);
      const { data, error } = await query;
      if (error) throw error;
      if (offset === 5000 && data.length)
        return reply(
          {
            error:
              "Há muitos pedidos neste período. Escolha um intervalo menor.",
          },
          400,
        );
      orders.push(...data);
      if (data.length < 500) break;
    }
    return reply({ orders, start, end, status });
  } catch {
    return reply(
      { error: "Não foi possível preparar o relatório. Tente novamente." },
      503,
    );
  }
}
