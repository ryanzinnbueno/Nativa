export type ProductOption = {
  id: string;
  weight: string;
  price: number;
  sale_price: number | null;
};
export type ProductExtras = { images?: string[]; variants?: ProductOption[] };
export function cartKey(item: { id: string; variant?: string }) {
  return JSON.stringify([item.id, item.variant || ""]);
}
export function optionProduct<
  T extends {
    weight: string;
    price: number;
    sale_price?: number | null;
  } & ProductExtras,
>(product: T, id?: string): T {
  const option = product.variants?.find((v) => v.id === id);
  return option
    ? { ...product, ...option, id: (product as T & { id: string }).id }
    : product;
}
