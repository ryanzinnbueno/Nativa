import { adminClient } from "../../../../lib/supabase/server";
import { reply, sameOrigin } from "../../../../lib/supabase/http";
import { imageAddress } from "../../../../lib/catalog-validation";
export const dynamic = "force-dynamic";
export async function GET() {
  try {
    const c = await adminClient();
    if (!c) return reply({ error: "Entre com uma conta autorizada." }, 401);
    const { data, error } = await c
      .from("nativa_settings")
      .select("promotion")
      .eq("id", 1)
      .single();
    if (error) throw error;
    return reply(data);
  } catch {
    return reply({ error: "Não foi possível carregar as promoções." }, 503);
  }
}
export async function PATCH(r: Request) {
  if (!sameOrigin(r)) return reply({ error: "Origem inválida." }, 403);
  try {
    const c = await adminClient();
    if (!c) return reply({ error: "Entre com uma conta autorizada." }, 401);
    const raw = await r.text();
    if (raw.length > 3000)
      return reply({ error: "Confira os textos da promoção." }, 400);
    let promotion;
    try {
      const b = JSON.parse(raw);
      if (
        typeof b.enabled !== "boolean" ||
        typeof b.title !== "string" ||
        !b.title.trim() ||
        b.title.length > 100 ||
        typeof b.message !== "string" ||
        b.message.length > 400 ||
        typeof b.cta !== "string" ||
        !b.cta.trim() ||
        b.cta.length > 60 ||
        typeof b.image !== "string"
      )
        throw new Error("Confira os textos da promoção.");
      promotion = {
        enabled: b.enabled,
        title: b.title.trim(),
        message: b.message.trim(),
        cta: b.cta.trim(),
        image: b.image ? imageAddress(b.image) : "",
      };
    } catch (e) {
      return reply({ error: (e as Error).message }, 400);
    }
    const { data, error } = await c
      .from("nativa_settings")
      .update({ promotion })
      .eq("id", 1)
      .select("id");
    if (error || !data?.length) throw error;
    return reply({ ok: true });
  } catch {
    return reply({ error: "Não foi possível salvar a promoção." }, 503);
  }
}
