import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/docs",
        destination: "http://localhost:5000/api/docs",
      },
      {
        source: "/api/docs/:path*",
        destination: "http://localhost:5000/api/docs/:path*",
      },
      {
        source: "/api/v1/:path*",
        destination: "http://localhost:5000/api/v1/:path*",
      },
    ];
  },
};

export default nextConfig;
