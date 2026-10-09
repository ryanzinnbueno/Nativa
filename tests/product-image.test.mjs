import { validateProductImage } from "../lib/catalog-validation.ts";
import { test } from "node:test";
import assert from "node:assert/strict";
import { productImageFrame, fullProductImage } from "../lib/product-image.ts";
test("photo framing accepts both fitting modes and validates all persisted crop controls", () => {
  assert.equal(productImageFrame(null).fit, "contain");
  assert.equal(fullProductImage.fit, "cover");
  assert.deepEqual(
    validateProductImage({
      ...fullProductImage,
      zoom: 190,
      x: 25,
      y: 75,
      untrusted: "discard",
    }),
    { fit: "cover", zoom: 190, x: 25, y: 75 },
  );
  for (const invalid of [
    { ...fullProductImage, zoom: 251 },
    { ...fullProductImage, zoom: 99 },
    { ...fullProductImage, x: 101 },
    { ...fullProductImage, y: -1 },
    { ...fullProductImage, x: "50" },
    { ...fullProductImage, zoom: 100.5 },
    { ...fullProductImage, fit: "stretch" },
    {},
  ])
    assert.throws(() => validateProductImage(invalid));
});
