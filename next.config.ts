import type { NextConfig } from "next";
import { LEGACY_ADMIN_PANEL_PATHS } from "./src/lib/admin-routes";

const legacyAdminRedirects = LEGACY_ADMIN_PANEL_PATHS.flatMap((segment) => [
  {
    source: `/admin/${segment}`,
    destination: `/admin/national-competitions/${segment}`,
    permanent: false,
  },
  {
    source: `/admin/${segment}/:path*`,
    destination: `/admin/national-competitions/${segment}/:path*`,
    permanent: false,
  },
]);

const nextConfig: NextConfig = {
  async redirects() {
    return legacyAdminRedirects;
  },
  images: {
    // Next.js 16: local /api branding URLs use ?v= cache-bust (see branding-storage.ts)
    localPatterns: [
      {
        pathname: "/api/branding/storage/**",
      },
    ],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      {
        protocol: "http",
        hostname: "127.0.0.1",
        port: "54321",
        pathname: "/storage/v1/object/public/**",
      },
      {
        protocol: "http",
        hostname: "localhost",
        port: "54321",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

export default nextConfig;
