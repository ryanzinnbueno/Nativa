import { adminClient } from "../../../../lib/supabase/server";
import { reply, sameOrigin } from "../../../../lib/supabase/http";
import {
  prepareImage,
  readUpload,
  MAX_IMAGE_BYTES,
} from "../../../../lib/upload-image";
export const runtime = "nodejs";
export async function POST(request: Request) {
  if (!sameOrigin(request)) return reply({ error: "Origem inválida." }, 403);
  try {
    const client = await adminClient();
    if (!client)
      return reply({ error: "Entre com uma conta autorizada." }, 401);
    let image: Buffer, kind: string;
    try {
      const form = await readUpload(request),
        file = form.get("image");
      kind = String(form.get("kind"));
      if (
        !(file instanceof File) ||
        !["product", "banner"].includes(kind) ||
        file.size > MAX_IMAGE_BYTES
      )
        throw new Error("Escolha uma foto de até 4 MB.");
      image = await prepareImage(
        Buffer.from(await file.arrayBuffer()),
        file.type,
      );
    } catch (e) {
      return reply(
        { error: e instanceof Error ? e.message : "Imagem inválida." },
        400,
      );
    }
    const path = `${kind}/${crypto.randomUUID()}.webp`;
    const { error } = await client.storage
      .from("nativa-images")
      .upload(path, image, {
        contentType: "image/webp",
        cacheControl: "31536000",
        upsert: false,
      });
    if (error) throw error;
    const { data } = client.storage.from("nativa-images").getPublicUrl(path);
    return reply({ url: data.publicUrl }, 201);
  } catch {
    return reply(
      { error: "Não foi possível enviar a imagem. Tente novamente." },
      503,
    );
  }
}
