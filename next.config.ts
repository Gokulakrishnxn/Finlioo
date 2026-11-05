import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      // No landing page: the app opens on the dashboard.
      { source: "/", destination: "/dashboard", permanent: false },
      // Pages that were renamed; keep old links working.
      { source: "/expenses", destination: "/transactions", permanent: false },
      // Privacy moved into Settings → Privacy; the same details are in the Terms.
      { source: "/privacy", destination: "/terms#your-data", permanent: false },
    ];
  },
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      // Only the Tailwind entry file: running it on every *.css would break CSS modules.
      "*.css": {
        condition: { path: /app\/globals\.css$/ },
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
