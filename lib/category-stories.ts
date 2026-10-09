type StoryCategory = {
  id: string;
  name: string;
  position: number;
  featured?: boolean;
  story_image?: string;
  story_title?: string;
  story_description?: string;
  story_tag?: string;
};
const legacy: Record<
  string,
  { title: string; description: string; image: string; eyebrow: string }
> = {
  Castanhas: {
    title: "Castanhas e sabores",
    description: "Uma pausa com mais sabor.",
    image: "/images/category-castanhas.webp?v=1",
    eyebrow: "PARA SUA PAUSA",
  },
  "Chás e ervas": {
    title: "Chás e infusões",
    description: "Desacelere. Saboreie o momento.",
    image: "/images/category-chas.webp?v=1",
    eyebrow: "PARA O SEU RITUAL",
  },
  "Grãos e cereais": {
    title: "Grãos e cereais",
    description: "O simples que faz parte do dia.",
    image: "/images/category-graos.webp?v=1",
    eyebrow: "PARA SUA ROTINA",
  },
};
export function categoryStories(
  categories: StoryCategory[],
  products: { category: string; image: string }[],
) {
  return [...categories]
    .filter((c) => c.featured ?? !!legacy[c.name])
    .sort(
      (a, b) =>
        a.position - b.position || a.name.localeCompare(b.name, "pt-BR"),
    )
    .map((c) => ({
      id: c.id,
      category: c.name,
      title: c.story_title || legacy[c.name]?.title || c.name,
      description:
        c.story_description ||
        legacy[c.name]?.description ||
        "Descubra nossa seleção.",
      eyebrow: c.story_tag || legacy[c.name]?.eyebrow || "PARA O SEU DIA",
      image:
        c.story_image ||
        legacy[c.name]?.image ||
        products.find((p) => p.category === c.name)?.image ||
        "/images/category-graos.webp?v=1",
    }));
}
