import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import {
  isSiteAccessEnabled,
  isSiteAccessExemptPath,
  isValidSiteAccessCookie,
  safeSiteAccessReturnTo,
  SITE_ACCESS_COOKIE,
} from "@/lib/site-access";

async function enforceSiteAccess(request: NextRequest): Promise<NextResponse | null> {
  if (!isSiteAccessEnabled()) return null;

  const pathname = request.nextUrl.pathname;
  if (isSiteAccessExemptPath(pathname)) return null;

  const cookie = request.cookies.get(SITE_ACCESS_COOKIE)?.value;
  if (await isValidSiteAccessCookie(cookie)) return null;

  const url = new URL("/site-access", request.url);
  const returnTo = `${pathname}${request.nextUrl.search}`;
  url.searchParams.set("returnTo", safeSiteAccessReturnTo(returnTo));
  return NextResponse.redirect(url);
}

export async function middleware(request: NextRequest) {
  const siteGate = await enforceSiteAccess(request);
  if (siteGate) return siteGate;

  let response = NextResponse.next({ request });

  const pathname = request.nextUrl.pathname;
  const isAdminRoute =
    pathname.startsWith("/admin") && pathname !== "/admin/login";

  if (!isAdminRoute && pathname !== "/admin/login") {
    return response;
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    if (isAdminRoute) {
      return NextResponse.redirect(
        new URL("/admin/login?setup=1", request.url)
      );
    }
    return response;
  }

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (isAdminRoute && !user) {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }

  if (isAdminRoute && user) {
    const { data: admin } = await supabase
      .from("admins")
      .select("user_id")
      .eq("user_id", user.id)
      .maybeSingle();
    if (!admin) {
      await supabase.auth.signOut();
      return NextResponse.redirect(
        new URL(
          "/admin/login?error=" +
            encodeURIComponent("Not authorized for admin access"),
          request.url
        )
      );
    }
  }

  if (pathname === "/admin/login" && user) {
    const { data: admin } = await supabase
      .from("admins")
      .select("user_id")
      .eq("user_id", user.id)
      .maybeSingle();
    if (admin) {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
