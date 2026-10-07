import sharp from "sharp";
export const MAX_IMAGE_BYTES = 4 * 1024 * 1024;
export async function prepareImage(buffer: Buffer, mime: string) {
  if (
    !["image/jpeg", "image/png", "image/webp"].includes(mime) ||
    !buffer.length ||
    buffer.length > MAX_IMAGE_BYTES
  )
    throw new Error("Escolha uma foto JPG, PNG ou WebP de até 4 MB.");
  try {
    const image = sharp(buffer, {
      limitInputPixels: 20000000,
      animated: false,
    });
    const metadata = await image.metadata();
    const expected: Record<string, string> = {
      "image/jpeg": "jpeg",
      "image/png": "png",
      "image/webp": "webp",
    };
    if (
      metadata.format !== expected[mime] ||
      !metadata.width ||
      !metadata.height ||
      (metadata.pages ?? 1) > 1
    )
      throw new Error();
    // Re-encode pixels, strip camera metadata and keep mobile images reasonably sized.
    return await image
      .rotate()
      .resize({
        width: 1920,
        height: 1920,
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality: 85 })
      .toBuffer();
  } catch {
    throw new Error(
      "Não foi possível abrir essa foto. Escolha outra imagem JPG, PNG ou WebP.",
    );
  }
}
export async function readUpload(request: Request) {
  const limit = MAX_IMAGE_BYTES + 64 * 1024;
  if (Number(request.headers.get("content-length")) > limit)
    throw new Error("A imagem deve ter até 4 MB.");
  const reader = request.body?.getReader();
  if (!reader) throw new Error("Escolha uma imagem.");
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.length;
      if (size > limit) {
        await reader.cancel();
        throw new Error("A imagem deve ter até 4 MB.");
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const body = Buffer.concat(chunks);
  return new Response(body, {
    headers: { "content-type": request.headers.get("content-type") || "" },
  }).formData();
}
