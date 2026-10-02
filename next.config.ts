import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allows stable macOS Bonjour hostnames during LAN development.
  allowedDevOrigins: ["*.local"],
  async headers() {
    return [
      {
        source: "/",
        headers: [
          {
            key: "Cache-Control",
            value: "no-store, max-age=0, must-revalidate",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
