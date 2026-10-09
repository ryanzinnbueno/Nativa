import { test } from "node:test";
import assert from "node:assert/strict";
import { cartKey, optionProduct } from "../lib/product-options.ts";
import { validatePhotos, validateVariants } from "../lib/catalog-validation.ts";
test("options preserve product identity and keep different packs separate", () => {
  const p = {
    id: "caju",
    weight: "100 g",
    price: 1000,
    variants: [{ id: "500g", weight: "500 g", price: 4000, sale_price: 3500 }],
  };
  assert.notEqual(
    cartKey({ id: "caju" }),
    cartKey({ id: "caju", variant: "500g" }),
  );
  assert.equal(optionProduct(p, "500g").id, "caju");
  assert.equal(optionProduct(p, "500g").sale_price, 3500);
  assert.equal(optionProduct(p).price, 1000);
});
test("gallery and options reject invalid uploads and prices", () => {
  assert.throws(() => validatePhotos(["javascript:alert(1)"]));
  assert.throws(() => validatePhotos(Array(8).fill("/images/caju.jpg")));
  assert.throws(() =>
    validateVariants([
      { id: "x", weight: "100g", price: 1000, sale_price: 1100 },
    ]),
  );
  assert.throws(() =>
    validateVariants([{ id: "x", weight: "100g", price: 0 }]),
  );
  assert.equal(
    validateVariants([{ id: "x", weight: "100g", price: 1000 }])[0].sale_price,
    null,
  );
});
