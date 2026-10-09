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
    ...(b.highlights !== undefined
      ? { highlights: text(b.highlights, 1000) }
      : {}),
    ...(b.usage !== undefined ? { usage: text(b.usage, 1200) } : {}),
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
  if (b.featured !== undefined && typeof b.featured !== "boolean")
    throw new Error("Confira a seleção de destaque.");
  return {
    id: text(b.id, 80, true),
    name,
    position: b.position as number,
    ...(b.featured !== undefined ? { featured: b.featured } : {}),
    ...(b.story_image !== undefined
      ? { story_image: b.story_image ? imageAddress(b.story_image) : "" }
      : {}),
    ...(b.story_title !== undefined
      ? { story_title: text(b.story_title, 60) }
      : {}),
    ...(b.story_description !== undefined
      ? { story_description: text(b.story_description, 160) }
      : {}),
    ...(b.story_tag !== undefined ? { story_tag: text(b.story_tag, 40) } : {}),
  };
}
export function validateBanner(b: Record<string, unknown>) {
  if (b.image_only !== undefined && typeof b.image_only !== "boolean")
    throw new Error("Escolha o formato do banner.");
  const image_only = b.image_only === true;
  const image_settings =
    b.image_settings !== undefined
      ? validateImageSettings(b.image_settings)
      : undefined;
  return {
    ...base(b),
    category: text(b.category, 60, true),
    tag: text(b.tag, 80),
    title: text(b.title, 100),
    accent: text(b.accent, 100),
    image_only,
    ...(image_settings !== undefined ? { image_settings } : {}),
    heading: text(
      b.heading,
      40,
      (image_settings?.desktop.show_text ?? !image_only) ||
        (image_settings?.mobile.show_text ?? !image_only),
    ),
    heading_accent: text(b.heading_accent, 40),
    description: text(b.description, 250),
    cta: text(b.cta, 60, true),
    image: imageAddress(b.image),
    alt: text(b.alt, 180, true),
  };
}

function validateImageSettings(value: unknown) {
  if (value === null) return null;
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error("Confira o enquadramento da imagem.");
  const settings = value as Record<string, unknown>;
  const frame = (value: unknown) => {
    if (!value || typeof value !== "object" || Array.isArray(value))
      throw new Error("Confira o enquadramento da imagem.");
    const f = value as Record<string, unknown>;
    if (f.show_text !== undefined && typeof f.show_text !== "boolean")
      throw new Error("Escolha o formato para cada tela.");
    if (
      !["contain", "cover"].includes(f.fit as string) ||
      !Number.isInteger(f.zoom) ||
      (f.zoom as number) < 100 ||
      (f.zoom as number) > 200 ||
      !Number.isInteger(f.x) ||
      (f.x as number) < 0 ||
      (f.x as number) > 100 ||
      !Number.isInteger(f.y) ||
      (f.y as number) < 0 ||
      (f.y as number) > 100
    )
      throw new Error("Confira o enquadramento da imagem.");
    return {
      fit: f.fit as string,
      zoom: f.zoom as number,
      x: f.x as number,
      y: f.y as number,
      ...(f.show_text !== undefined
        ? { show_text: f.show_text as boolean }
        : {}),
    };
  };
  return {
    desktop: frame(settings.desktop),
    mobile: frame(settings.mobile),
    ...(settings.mobile_image
      ? { mobile_image: imageAddress(settings.mobile_image) }
      : {}),
  };
}
