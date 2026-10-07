export type Banner = {
  id: string;
  image_only?: boolean;
  category: string;
  tag: string;
  title: string;
  accent: string;
  heading: string;
  heading_accent: string;
  description: string;
  cta: string;
  image: string;
  alt: string;
  active: boolean;
  position: number;
};
export const defaultBanners: Banner[] = [
  {
    id: "graos",
    category: "Grãos e cereais",
    tag: "O NATURAL EM CADA ESCOLHA",
    title: "Pequenos grãos.",
    accent: "Novas possibilidades.",
    heading: "Grãos",
    heading_accent: "& cereais",
    description:
      "Aveia, sementes e cereais para dar mais sabor às suas receitas do dia a dia.",
    cta: "Explorar grãos",
    image: "/images/carousel-graos.webp",
    alt: "Aveia e sementes em uma tigela de cerâmica",
    active: true,
    position: 0,
  },
  {
    id: "castanhas",
    category: "Castanhas",
    tag: "UMA PAUSA CHEIA DE SABOR",
    title: "Uma porção de sabor.",
    accent: "Um momento seu.",
    heading: "Castanhas",
    heading_accent: "& sabores",
    description:
      "Castanhas, amêndoas e combinações para acompanhar as pequenas pausas da rotina.",
    cta: "Conhecer castanhas",
    image: "/images/carousel-castanhas.webp",
    alt: "Castanhas e amêndoas em uma tigela",
    active: true,
    position: 1,
  },
  {
    id: "chas",
    category: "Chás e ervas",
    tag: "RESPIRE. DESACELERE. SABOREIE.",
    title: "O tempo de uma xícara.",
    accent: "O prazer de cuidar.",
    heading: "Chás",
    heading_accent: "naturais",
    description:
      "Ervas e infusões naturais para transformar um instante simples em um ritual gostoso.",
    cta: "Descobrir chás",
    image: "/images/carousel-chas.webp",
    alt: "Xícara de chá com camomila e hibisco",
    active: true,
    position: 2,
  },
];
