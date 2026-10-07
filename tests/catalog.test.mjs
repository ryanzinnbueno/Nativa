import { test } from "node:test";
import assert from "node:assert/strict";
import {
  validateProduct,
  validateBanner,
  imageAddress,
} from "../lib/catalog-validation.ts";
test("catalog input restricts prices, visibility, order and image protocols", () => {
  const p = {
    id: "new",
    name: "Aveia",
    subtitle: "",
    category: "Cereais",
    weight: "200 g",
    price: 1250,
    tag: "",
    image: "/images/aveia.jpg",
    description: "",
    ingredients: "",
    active: true,
    position: 0,
  };
  assert.equal(validateProduct({ ...p, unknown: "ignored" }).price, 1250);
  for (const price of [0, -1, 1.5, 1000001, "100"])
    assert.throws(() => validateProduct({ ...p, price }));
  for (const image of [
    "javascript:alert(1)",
    "//evil.example/test.jpg",
    "/images/../secret",
    "http://example.com/image.jpg",
    "data:image/svg+xml,test",
  ])
    assert.throws(() => imageAddress(image));
  assert.equal(
    imageAddress("https://example.com/photo.jpg"),
    "https://example.com/photo.jpg",
  );
  assert.throws(() => validateProduct({ ...p, active: "true" }));
  assert.throws(() => validateProduct({ ...p, position: -1 }));
  assert.throws(() =>
    validateBanner({
      ...p,
      heading: "",
      heading_accent: "",
      cta: "Ver",
      alt: "Foto",
      title: "",
      accent: "",
    }),
  );
});
