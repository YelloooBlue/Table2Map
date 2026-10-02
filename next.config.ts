import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allows stable macOS Bonjour hostnames during LAN development.
  allowedDevOrigins: ["*.local"],
};

export default nextConfig;
