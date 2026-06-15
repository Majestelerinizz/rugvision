import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Localtunnel/ngrok gibi tunnel adresleri uzerinden dev test icin.
  allowedDevOrigins: ["*.loca.lt", "rugvision-demo.loca.lt"],
};

export default nextConfig;
