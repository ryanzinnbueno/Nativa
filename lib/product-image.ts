export type ProductImageSettings = {
  fit: "contain" | "cover";
  zoom: number;
  x: number;
  y: number;
};
export const fullProductImage: ProductImageSettings = {
  fit: "cover",
  zoom: 100,
  x: 50,
  y: 50,
};
export function productImageFrame(
  settings?: ProductImageSettings | null,
): ProductImageSettings {
  return settings || { fit: "contain", zoom: 100, x: 50, y: 50 };
}
