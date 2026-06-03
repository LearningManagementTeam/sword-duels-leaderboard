import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
