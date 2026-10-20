import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  allowedDevOrigins: ["localhost", "127.0.0.1"],
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async redirects() {
    return [
      { source: "/calendar", destination: "/kalender", permanent: true },
      { source: "/notes", destination: "/catatan", permanent: true },
      { source: "/stats", destination: "/statistik", permanent: true },
      { source: "/pricing", destination: "/upgrade", permanent: true },
      { source: "/pro", destination: "/upgrade", permanent: true },
    ];
  },
};

export default nextConfig;
