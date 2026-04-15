import path from "path";

const BACKEND = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
// Strip trailing /api/v1 so rewrites work cleanly
const backendOrigin = BACKEND.replace(/\/api\/v1\/?$/, "");

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  turbopack: {
    root: process.cwd(),
    resolveAlias: {
      tailwindcss: path.join(process.cwd(), "node_modules", "tailwindcss"),
    },
  },
  async rewrites() {
    return [
      {
        source: "/api/proxy/:path*",
        destination: `${backendOrigin}/api/v1/:path*`,
      },
      // Proxy backend file-serving endpoint (avatars, logos, etc.) so
      // relative /api/v1/files/... URLs from make_file_url work in the browser.
      {
        source: "/api/v1/files/:path*",
        destination: `${backendOrigin}/api/v1/files/:path*`,
      },
      // Proxy backend-served static uploads so /uploads/... URLs resolve correctly.
      {
        source: "/uploads/:path*",
        destination: `${backendOrigin}/uploads/:path*`,
      },
    ];
  },
};

export default nextConfig;
