import type { NextConfig } from "next";

// GIFs are loaded straight from the provider CDNs by <img>/<video>, so those
// hosts have to be allowed explicitly. Everything else is same-origin.
const MEDIA_HOSTS = "https://*.giphy.com https://static.klipy.com";

// 'unsafe-inline' is required for scripts: layout.tsx sets the theme from an
// inline <script> before paint to avoid a flash, and Next inlines its own
// bootstrap. Tightening this needs a nonce threaded through the document.
const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob: ${MEDIA_HOSTS}`,
  `media-src 'self' blob: ${MEDIA_HOSTS}`,
  "font-src 'self' data:",
  "connect-src 'self'",
  "frame-ancestors 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join("; ");

const nextConfig: NextConfig = {
  output: "standalone",

  // Applied by the Next server itself, so self-hosted deployments get them
  // whether or not there's a reverse proxy in front.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: CSP },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
