import { adminClient } from "../../../../lib/supabase/server";
import { reply, sameOrigin } from "../../../../lib/supabase/http";
import {
  validateProduct,
  validateBanner,
  validateCategory,
} from "../../../../lib/catalog-validation";
export const dynamic = "force-dynamic";
export async function GET() {
  try {
    const client = await adminClient();
    if (!client)
      return reply({ error: "Entre com uma conta autorizada." }, 401);
    const [products, banners, settings, categories] = await Promise.all([
      client.from("nativa_products").select("*").order("position").order("id"),
      client.from("nativa_banners").select("*").order("position").order("id"),
      client
        .from("nativa_settings")
        .select("phone,banner_seconds,banner_autoplay")
        .eq("id", 1)
        .single(),
      client
        .from("nativa_categories")
        .select("*")
        .order("position")
        .order("name"),
    ]);
    if (products.error || banners.error || settings.error || categories.error)
      throw new Error();
    return reply({
      products: products.data,
      banners: banners.data,
      settings: settings.data,
      categories: categories.data,
    });
  } catch {
    return reply(
      {
        error:
          "Não foi possível carregar os produtos e banners. Confira se a atualização da loja foi aplicada.",
      },
      503,
    );
  }
}
async function save(request: Request, insert: boolean) {
  if (!sameOrigin(request)) return reply({ error: "Origem inválida." }, 403);
  try {
    const client = await adminClient();
    if (!client)
      return reply({ error: "Entre com uma conta autorizada." }, 401);
    const raw = await request.text();
    if (raw.length > 12000)
      return reply({ error: "Conteúdo muito grande." }, 400);
    let data: Record<string, string | number | boolean | null>, table: string;
    try {
      const body = JSON.parse(raw);
      if (
        !body ||
        !body.item ||
        !["product", "banner", "category"].includes(body.kind)
      )
        throw new Error("Dados inválidos.");
      data =
        body.kind === "product"
          ? validateProduct(body.item)
          : body.kind === "banner"
            ? validateBanner(body.item)
            : validateCategory(body.item);
      table =
        body.kind === "product"
          ? "nativa_products"
          : body.kind === "banner"
            ? "nativa_banners"
            : "nativa_categories";
    } catch (e) {
      return reply(
        { error: e instanceof Error ? e.message : "Dados inválidos." },
        400,
      );
    }
    const result = insert
      ? await client.from(table).insert(data).select("id")
      : await client.from(table).update(data).eq("id", data.id).select("id");
    if (result.error?.code === "23505")
      return reply(
        {
          error:
            "Já existe uma categoria ou item com esse nome. Escolha outro nome.",
        },
        409,
      );
    if (result.error?.code === "23503")
      return reply({ error: "Escolha uma categoria cadastrada na loja." }, 400);
    if (result.error?.code === "23514")
      return reply(
        { error: "Confira os preços e os campos preenchidos." },
        400,
      );
    if (result.error) throw result.error;
    if (!result.data?.length)
      return reply({ error: "Item não encontrado." }, 404);
    return reply({ ok: true }, insert ? 201 : 200);
  } catch {
    return reply({ error: "Não foi possível salvar. Tente novamente." }, 503);
  }
}
export async function POST(request: Request) {
  return save(request, true);
}
export async function PATCH(request: Request) {
  return save(request, false);
}
