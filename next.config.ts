import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  experimental: {
    optimizePackageImports: ["lucide-react", "recharts", "radix-ui"],
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "lh3.googleusercontent.com" },    // Google OAuth avatars
      { protocol: "https", hostname: "avatars.githubusercontent.com" }, // GitHub OAuth avatars
      { protocol: "https", hostname: "pub-0047fe05b86f46949b2dab328b219e47.r2.dev" }, // Cloudflare R2 (project bucket)
      { protocol: "https", hostname: "*.r2.dev" },                      // Cloudflare R2 (wildcard)
    ],
  },
};

export default nextConfig;
