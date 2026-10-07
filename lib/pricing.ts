export function sellingPrice(product: {
  price: number;
  sale_price?: number | null;
}) {
  return product.sale_price ?? product.price;
}
