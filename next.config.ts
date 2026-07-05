import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "lh3.googleusercontent.com" },    // Google OAuth avatars
      { protocol: "https", hostname: "avatars.githubusercontent.com" }, // GitHub OAuth avatars
      { protocol: "https", hostname: "utfs.io" },                       // UploadThing CDN (legacy)
      { protocol: "https", hostname: "*.ufs.sh" },                      // UploadThing CDN (v7+)
      { protocol: "https", hostname: "ufs.uploadthing.com" },           // UploadThing CDN (alt)
      { protocol: "https", hostname: "*.r2.cloudflarestorage.com" },    // Cloudflare R2
      { protocol: "https", hostname: "pub-*.r2.dev" },                  // Cloudflare R2 public buckets
    ],
  },
};

export default nextConfig;
