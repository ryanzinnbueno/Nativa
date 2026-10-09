export const defaultPromotion = {
  enabled: true,
  title: "Uma seleção especial para você",
  message: "Veja os produtos em oferta e escolha seus favoritos.",
  cta: "Ver ofertas",
  image: "",
};
export type Promotion = typeof defaultPromotion;
export function isOffer(p: { price: number; sale_price?: number | null }) {
  return (
    typeof p.sale_price === "number" &&
    p.sale_price > 0 &&
    p.sale_price < p.price
  );
}
export function searchMatches(
  p: { name: string; subtitle: string; category: string },
  value: string,
) {
  const normalize = (s: string) =>
    s
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLocaleLowerCase("pt-BR");
  const haystack = normalize(`${p.name} ${p.subtitle} ${p.category}`);
  return normalize(value)
    .trim()
    .split(/\s+/)
    .every((word) => haystack.includes(word));
}
export function brazilPhone(value: unknown) {
  if (typeof value !== "string" || value.length > 30)
    throw new Error("Informe seu celular com DDD.");
  let digits = value.replace(/\D/g, "");
  if ([12, 13].includes(digits.length) && digits.startsWith("55"))
    digits = digits.slice(2);
  if (!/^[1-9][0-9](?:9[0-9]{8}|[2-5][0-9]{7})$/.test(digits))
    throw new Error(
      "Informe seu telefone com DDD, por exemplo (71) 91234-5678.",
    );
  return "+55" + digits;
}
