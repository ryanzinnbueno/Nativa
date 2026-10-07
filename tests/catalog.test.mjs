import { test } from "node:test";
import assert from "node:assert/strict";
import { sellingPrice } from "../lib/pricing.ts";
import { validateCategory } from "../lib/catalog-validation.ts";
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

test("category names and promotional amounts are validated, with regular-price fallback", () => {
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
  assert.equal(sellingPrice(p), 1250);
  assert.equal(sellingPrice({ ...p, sale_price: 1000 }), 1000);
  assert.equal(validateProduct({ ...p, sale_price: 1000 }).sale_price, 1000);
  assert.equal(validateProduct({ ...p, sale_price: null }).sale_price, null);
  for (const sale_price of [0, -1, 1250, 2000, 1.5, "1000"])
    assert.throws(() => validateProduct({ ...p, sale_price }));
  assert.equal(
    validateCategory({ id: "new", name: " Flores ", position: 3 }).name,
    "Flores",
  );
  for (const name of ["", "Todos", "todos"])
    assert.throws(() => validateCategory({ id: "new", name, position: 0 }));
});

test("image-only banners allow an empty title and reject an invalid format", () => {
  const banner = {
    id: "image-banner",
    active: true,
    position: 0,
    category: "Castanhas",
    tag: "",
    title: "",
    accent: "",
    heading: "",
    heading_accent: "",
    description: "",
    cta: "Explorar",
    image: "https://example.com/banner.webp",
    alt: "Foto de castanhas",
    image_only: true,
  };
  assert.equal(validateBanner(banner).image_only, true);
  assert.throws(() => validateBanner({ ...banner, image_only: false }));
  assert.throws(() => validateBanner({ ...banner, image_only: "yes" }));
});

test("banner framing accepts independent screens and rejects invalid dimensions and image URLs", () => {
  const banner = {
    id: "framed",
    active: true,
    position: 0,
    category: "Castanhas",
    tag: "",
    title: "",
    accent: "",
    image_only: true,
    heading: "",
    heading_accent: "",
    description: "",
    cta: "Ver",
    alt: "Castanhas",
    image: "/images/caju.jpg",
  };
  const frame = { fit: "contain", zoom: 100, x: 50, y: 50 };
  const settings = {
    desktop: frame,
    mobile: { fit: "cover", zoom: 140, x: 25, y: 60 },
    mobile_image: "https://example.com/mobile.webp",
  };
  assert.deepEqual(
    validateBanner({ ...banner, image_settings: settings }).image_settings,
    settings,
  );
  assert.equal(Object.hasOwn(validateBanner(banner), "image_settings"), false);
  for (const change of [
    { fit: "stretch" },
    { zoom: 99 },
    { zoom: 201 },
    { zoom: "120" },
    { x: -1 },
    { y: 101 },
    { x: NaN },
  ])
    assert.throws(() =>
      validateBanner({
        ...banner,
        image_settings: { desktop: { ...frame, ...change }, mobile: frame },
      }),
    );
  assert.throws(() =>
    validateBanner({
      ...banner,
      image_settings: { ...settings, mobile_image: "javascript:alert(1)" },
    }),
  );
});
