import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Next.js 16: paquetes nativos que tienen que quedar como external en server.
  serverExternalPackages: ["sharp"],
};

export default nextConfig;
