import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "2ch.hk",
      },
      {
        protocol: "https",
        hostname: "2ch.org",
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: "/api/proxy/:path*",
        destination: "https://2ch.org/:path*",
      },
    ];
  },
};

export default nextConfig;
