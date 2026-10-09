import { test } from "node:test";
import assert from "node:assert/strict";
import { isOffer, searchMatches, brazilPhone } from "../lib/shop-features.ts";
test("offers exclude absent, invalid and non-discounted prices", () => {
  for (const sale_price of [undefined, null, 0, -1, 1000, 1100])
    assert.equal(isOffer({ price: 1000, sale_price }), false);
  assert.equal(isOffer({ price: 1000, sale_price: 900 }), true);
});
test("search handles accents, category terms and multiword phrases", () => {
  const p = {
    name: "Chá de hibisco",
    subtitle: "Flores desidratadas",
    category: "Chás e ervas",
  };
  assert.equal(searchMatches(p, "cha ervas"), true);
  assert.equal(searchMatches(p, "HIBISCO"), true);
  assert.equal(searchMatches(p, "granola"), false);
});
test("quick registration accepts local and country-coded numbers, rejects incomplete input", () => {
  assert.equal(brazilPhone("(71) 91234-5678"), "+5571912345678");
  assert.equal(brazilPhone("+55 71 91234-5678"), "+5571912345678");
  assert.equal(brazilPhone("7132345678"), "+557132345678");
  for (const p of [
    "",
    null,
    "123",
    "00123456789",
    "999999999999999999999999999999999",
  ])
    assert.throws(() => brazilPhone(p));
});

test("offers include a promotional weight even when the main pack has no discount",()=>{
 assert.equal(isOffer({price:1000,variants:[{price:2500,sale_price:2200}]}),true);
 assert.equal(isOffer({price:1000,variants:[{price:2500,sale_price:3000}]}),false);
});
