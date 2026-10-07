export const reply = (value: unknown, status = 200) =>
  Response.json(value, {
    status,
    headers: { "Cache-Control": "private, no-store" },
  });
// Netlify forwards Next.js requests through an internal function URL.
// Use the public site URL; never trust client-supplied proxy headers.
export function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  const configured = process.env.NEXT_PUBLIC_SITE_URL || "https://nativa-bem-viver.netlify.app";
  try {
    if (origin === new URL(configured).origin) return true;
    const target = new URL(request.url);
    return process.env.NODE_ENV !== "production"
      && ["localhost", "127.0.0.1", "[::1]"].includes(target.hostname)
      && origin === target.origin;
  } catch {
    return false;
  }
}
