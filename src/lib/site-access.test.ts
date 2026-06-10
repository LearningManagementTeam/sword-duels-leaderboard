import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  isSiteAccessEnabled,
  safeSiteAccessReturnTo,
  siteAccessTokenForPassword,
} from "./site-access";

describe("site-access", () => {
  it("safeSiteAccessReturnTo blocks open redirects", () => {
    assert.equal(safeSiteAccessReturnTo("/june/luzon"), "/june/luzon");
    assert.equal(safeSiteAccessReturnTo("https://evil.com"), "/");
    assert.equal(safeSiteAccessReturnTo("//evil.com"), "/");
    assert.equal(safeSiteAccessReturnTo("/site-access"), "/");
    assert.equal(safeSiteAccessReturnTo(undefined), "/");
  });

  it("is disabled when SITE_ACCESS_PASSWORD is unset", () => {
    const prev = process.env.SITE_ACCESS_PASSWORD;
    delete process.env.SITE_ACCESS_PASSWORD;
    assert.equal(isSiteAccessEnabled(), false);
    if (prev !== undefined) process.env.SITE_ACCESS_PASSWORD = prev;
  });

  it("derives stable cookie tokens from password", async () => {
    const a = await siteAccessTokenForPassword("test-password-123");
    const b = await siteAccessTokenForPassword("test-password-123");
    const c = await siteAccessTokenForPassword("other-password-456");
    assert.equal(a, b);
    assert.notEqual(a, c);
  });
});
