export type Category = { id: string; name: string; position: number };
export const defaultCategories: Category[] = [
  { id: "castanhas", name: "Castanhas", position: 0 },
  { id: "graos", name: "Grãos e cereais", position: 1 },
  { id: "chas", name: "Chás e ervas", position: 2 },
  { id: "frutas", name: "Frutas secas", position: 3 },
];
