import type { NextConfig } from "next";

// import względny, nie przez alias @/ — next.config jest ładowany zanim
// zadziałają ścieżki z tsconfig
import { remotePatterns } from "./src/lib/image-hosts";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  experimental: {
    optimizePackageImports: ["lucide-react", "recharts", "radix-ui"],
  },
  images: {
    // lista hostów żyje w src/lib/image-hosts.ts, bo tę samą listę
    // musi znać walidacja URL-i w akcjach serwerowych
    remotePatterns,
  },
};

export default nextConfig;
