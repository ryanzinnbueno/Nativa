export const reply = (value: unknown, status = 200) =>
  Response.json(value, {
    status,
    headers: { "Cache-Control": "private, no-store" },
  });
export function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  return !origin || origin === new URL(request.url).origin;
}
