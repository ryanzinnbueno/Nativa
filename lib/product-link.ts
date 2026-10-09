export function productPath(id: string) {
  return `/produto/${encodeURIComponent(id)}`;
}
export function productLink(origin: string, id: string) {
  return new URL(productPath(id), origin).href;
}
