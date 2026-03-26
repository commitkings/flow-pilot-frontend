import path from "path";

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  turbopack: {
    root: process.cwd(),
    resolveAlias: {
      tailwindcss: path.join(process.cwd(), "node_modules", "tailwindcss"),
    },
  },
};

export default nextConfig;
