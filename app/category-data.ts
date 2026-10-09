export type Category = {
  id: string;
  name: string;
  position: number;
  featured?: boolean;
  story_image?: string;
  story_title?: string;
  story_description?: string;
  story_tag?: string;
};
export const defaultCategories: Category[] = [
  { id: "castanhas", name: "Castanhas", position: 0 },
  { id: "graos", name: "Grãos e cereais", position: 1 },
  { id: "chas", name: "Chás e ervas", position: 2 },
  { id: "frutas", name: "Frutas secas", position: 3 },
];
