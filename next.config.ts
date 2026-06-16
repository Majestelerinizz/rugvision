import type { NextConfig } from "next";

// Tum yanitlara uygulanan temel guvenlik basliklari.
const BASE_SECURITY_HEADERS = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-DNS-Prefetch-Control", value: "off" },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(self), microphone=(), geolocation=(), browsing-topics=()",
  },
];

const nextConfig: NextConfig = {
  // Localtunnel/ngrok gibi tunnel adresleri uzerinden dev test icin.
  allowedDevOrigins: ["*.loca.lt", "rugvision-demo.loca.lt"],

  async headers() {
    return [
      // AR goruntuleyici musteri sitelerine iframe ile gomulebildigi icin
      // framing'e izin veririz (frame-ancestors *), X-Frame-Options koymayiz.
      {
        source: "/odamda-gor/:path*",
        headers: [
          ...BASE_SECURITY_HEADERS,
          { key: "Content-Security-Policy", value: "frame-ancestors *" },
        ],
      },
      // Diger tum yollar: clickjacking'e karsi framing tamamen kapali.
      {
        source: "/:path((?!odamda-gor).*)",
        headers: [
          ...BASE_SECURITY_HEADERS,
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
        ],
      },
    ];
  },
};

export default nextConfig;
