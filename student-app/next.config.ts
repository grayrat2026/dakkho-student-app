import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // NOTE: Do NOT use output: "export" — it prevents SSR catch-all routing.
  // We deploy via opennextjs-cloudflare which provides SSR on Cloudflare Workers.
  // This allows the [[...slug]] catch-all to handle all paths (fixes 404 on refresh).
  images: {
    unoptimized: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
};

export default nextConfig;
