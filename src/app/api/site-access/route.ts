import { NextResponse } from "next/server";
import {
  getSiteAccessPassword,
  isSiteAccessEnabled,
  passwordsMatch,
  safeSiteAccessReturnTo,
  SITE_ACCESS_COOKIE,
  siteAccessTokenForPassword,
} from "@/lib/site-access";
import { enforceSiteAccessRateLimit } from "@/lib/rate-limit";

export async function POST(request: Request) {
  if (!isSiteAccessEnabled()) {
    return NextResponse.json(
      { ok: false, error: "Site access lock is not configured." },
      { status: 503 }
    );
  }

  const rateLimited = await enforceSiteAccessRateLimit(request);
  if (rateLimited) {
    const url = new URL("/site-access", request.url);
    url.searchParams.set("error", "rate_limit");
    return NextResponse.redirect(url, {
      headers: { "Retry-After": String(rateLimited.retryAfterSeconds) },
    });
  }

  const expected = getSiteAccessPassword()!;
  let password = "";
  let returnTo = "/";

  const contentType = request.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    const body = (await request.json()) as {
      password?: string;
      returnTo?: string;
    };
    password = body.password?.trim() ?? "";
    returnTo = safeSiteAccessReturnTo(body.returnTo);
  } else {
    const form = await request.formData();
    password = String(form.get("password") ?? "").trim();
    returnTo = safeSiteAccessReturnTo(String(form.get("returnTo") ?? "/"));
  }

  if (!passwordsMatch(password, expected)) {
    const url = new URL("/site-access", request.url);
    url.searchParams.set("returnTo", returnTo);
    url.searchParams.set("error", "incorrect");
    return NextResponse.redirect(url);
  }

  const token = await siteAccessTokenForPassword(expected);
  const response = NextResponse.redirect(new URL(returnTo, request.url));
  response.cookies.set(SITE_ACCESS_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });
  return response;
}
