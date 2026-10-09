import { test } from "node:test";
import assert from "node:assert/strict";
import { categoryStories } from "../lib/category-stories.ts";
import { validateCategory } from "../lib/catalog-validation.ts";
import { customerAuthError } from "../lib/customer-auth-errors.ts";
test("selected category IDs produce only chosen cards with saved names, ordering and photos", () => {
  const categories = [1, 2, 3, 4, 5, 6].map((i) => ({
    id: String(i),
    name: "Categoria " + i,
    position: i,
    featured: [1, 3, 4, 6].includes(i),
    story_image: i === 6 ? "/images/six.webp" : "",
  }));
  const cards = categoryStories(categories, [
    { category: "Categoria 3", image: "/images/three.webp" },
  ]);
  assert.deepEqual(
    cards.map((c) => c.id),
    ["1", "3", "4", "6"],
  );
  assert.equal(cards[1].image, "/images/three.webp");
  assert.equal(cards[3].image, "/images/six.webp");
  assert.equal(
    categoryStories(
      categories.map((c) => ({ ...c, featured: false })),
      [],
    ).length,
    0,
  );
  assert.equal(
    categoryStories(
      [{ id: "1", name: "Castanhas", position: 1, featured: false }],
      [],
    ).length,
    0,
  );
});
test("category editing validates highlight fields without overwriting unspecified legacy settings", () => {
  const c = { id: "1", name: "Categoria nova", position: 0 };
  assert.equal(validateCategory(c).featured, undefined);
  assert.equal(
    validateCategory({ ...c, featured: true, story_image: "/images/test.webp" })
      .featured,
    true,
  );
  assert.throws(() => validateCategory({ ...c, featured: "true" }));
  assert.throws(() =>
    validateCategory({ ...c, story_image: "javascript:alert(1)" }),
  );
  assert.throws(() =>
    validateCategory({ ...c, story_description: "a".repeat(161) }),
  );
});
test("disabled phone registration reports unavailable access, not an existing account", () => {
  const d = customerAuthError(
    { code: "phone_provider_disabled", status: 400 },
    true,
  );
  assert.equal(d.status, 503);
  assert.match(d.message, /ainda não está disponível/);
  assert.equal(customerAuthError({ status: 429 }, true).status, 429);
  assert.equal(
    customerAuthError({ code: "invalid_credentials" }, false).message,
    "Telefone ou senha incorretos.",
  );
});
