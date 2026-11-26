import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

if (process.env.NODE_ENV === "development") {
  initOpenNextCloudflareForDev();
}

const nextConfig: NextConfig = {
  reactCompiler: true,
  poweredByHeader: false,
  // Cloudflare edge already handles Brotli/gzip compression; skipping Node zlib saves Worker CPU.
  compress: false,
  images: {
    unoptimized: true,
  },
  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "@tabler/icons-react",
      "@radix-ui/react-icons",
      "@hugeicons/core-free-icons",
      "@tiptap/react",
      "@tiptap/starter-kit",
      "motion",
    ],
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
