import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  turbopack: {
    root: process.cwd(),
    resolveAlias: {
      tailwindcss: path.join(process.cwd(), "node_modules", "tailwindcss"),
    },
  },
};

export default nextConfig;
