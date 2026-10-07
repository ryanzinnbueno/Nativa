import { test } from "node:test";
import assert from "node:assert/strict";
import {
  bannerShowsText,
  bannerNeedsText,
} from "../lib/banner-presentation.ts";
test("per-screen text choices override the legacy format independently", () => {
  for (const image_only of [true, false]) {
    assert.equal(bannerShowsText({ image_only }, "mobile"), !image_only);
    assert.equal(bannerShowsText({ image_only }, "desktop"), !image_only);
    for (const desktop of [true, false])
      for (const mobile of [true, false]) {
        const b = {
          image_only,
          image_settings: {
            desktop: { show_text: desktop },
            mobile: { show_text: mobile },
          },
        };
        assert.equal(bannerShowsText(b, "desktop"), desktop);
        assert.equal(bannerShowsText(b, "mobile"), mobile);
        assert.equal(bannerNeedsText(b), desktop || mobile);
      }
  }
});
