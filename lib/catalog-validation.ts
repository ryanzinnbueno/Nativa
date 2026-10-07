const text = (v: unknown, max: number, required = false): string => {
  if (typeof v !== "string" || v.trim().length > max || (required && !v.trim()))
    throw new Error("Confira os campos preenchidos.");
  return v.trim();
};
export function imageAddress(v: unknown) {
  const value = text(v, 1500, true);
  if (/^\/images\/[a-zA-Z0-9_./?=&%-]+$/.test(value) && !value.includes(".."))
    return value;
  try {
    const url = new URL(value);
    if (url.protocol === "https:" && !url.username && !url.password)
      return value;
  } catch {}
  throw new Error(
    "Use uma imagem da loja ou um endereço de imagem começando com https://.",
  );
}
function base(b: Record<string, unknown>) {
  if (
    typeof b.active !== "boolean" ||
    !Number.isInteger(b.position) ||
    (b.position as number) < 0 ||
    (b.position as number) > 999
  )
    throw new Error("Confira a ordem e a visibilidade.");
  return {
    id: text(b.id, 80, true),
    active: b.active,
    position: b.position as number,
  };
}
export function validateProduct(b: Record<string, unknown>) {
  const sale_price = b.sale_price ?? null;
  if (
    sale_price !== null &&
    (!Number.isInteger(sale_price) ||
      (sale_price as number) < 1 ||
      (sale_price as number) >= (b.price as number))
  )
    throw new Error(
      "O preço promocional deve ser maior que zero e menor que o preço original.",
    );
  if (
    !Number.isInteger(b.price) ||
    (b.price as number) < 1 ||
    (b.price as number) > 1000000
  )
    throw new Error("Informe um preço entre R$ 0,01 e R$ 10.000,00.");
  return {
    ...base(b),
    name: text(b.name, 100, true),
    subtitle: text(b.subtitle, 150),
    category: text(b.category, 60, true),
    weight: text(b.weight, 60, true),
    price: b.price as number,
    sale_price: sale_price as number | null,
    tag: text(b.tag, 60),
    image: imageAddress(b.image),
    description: text(b.description, 2000),
    ingredients: text(b.ingredients, 2000),
  };
}
export function validateCategory(b: Record<string, unknown>) {
  const name = text(b.name, 60, true);
  if (name.toLocaleLowerCase("pt-BR") === "todos")
    throw new Error("Escolha outro nome para a categoria.");
  if (
    !Number.isInteger(b.position) ||
    (b.position as number) < 0 ||
    (b.position as number) > 999
  )
    throw new Error("Confira a ordem de exibição.");
  return { id: text(b.id, 80, true), name, position: b.position as number };
}
export function validateBanner(b: Record<string, unknown>) {
  return {
    ...base(b),
    category: text(b.category, 60, true),
    tag: text(b.tag, 80),
    title: text(b.title, 100),
    accent: text(b.accent, 100),
    heading: text(b.heading, 40, true),
    heading_accent: text(b.heading_accent, 40),
    description: text(b.description, 250),
    cta: text(b.cta, 60, true),
    image: imageAddress(b.image),
    alt: text(b.alt, 180, true),
  };
}
