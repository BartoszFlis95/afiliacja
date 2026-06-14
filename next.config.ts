import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      // Awatary / media influencerów i marek z zewnętrznych źródeł.
      // Dodawaj kolejne hosty w miarę potrzeb (np. CDN, S3, Cloudinary).
      { protocol: "https", hostname: "lh3.googleusercontent.com" }, // Google OAuth avatars
      { protocol: "https", hostname: "avatars.githubusercontent.com" }, // GitHub OAuth avatars
    ],
  },
};

export default nextConfig;
