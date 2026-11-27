import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";

// Firebase sign-in loads Google's helper script and a frame from the project's auth domain.
const firebaseDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN;
const firebase = {
  script: firebaseDomain ? " https://apis.google.com" : "",
  connect: firebaseDomain ? " https://identitytoolkit.googleapis.com https://securetoken.googleapis.com" : "",
  frame: firebaseDomain ? [`frame-src 'self' https://${firebaseDomain}`] : [],
};

// Inline scripts stay allowed because prerendered pages can't carry a per-request nonce.
const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}${firebase.script}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://lh3.googleusercontent.com",
  "font-src 'self' data:",
  `connect-src 'self'${isDev ? " ws: wss:" : ""}${firebase.connect}`,
  ...firebase.frame,
  "media-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
];

const nextConfig: NextConfig = {
  serverExternalPackages: ["@google-cloud/firestore"],
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  async redirects() {
    return [
      // Pages that were renamed; keep old links working.
      { source: "/expenses", destination: "/transactions", permanent: false },
      // Privacy moved into Settings → Privacy; the same details are in the Terms.
      { source: "/privacy", destination: "/terms#your-data", permanent: false },
    ];
  },
  cacheComponents: true,
  partialPrefetching: true,
  experimental: {
    agentUpgrade: "security",
  },
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
