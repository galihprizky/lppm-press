import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/lppm/:path*",
        destination: "https://aplikasilaundryonline.com/lppm-press/:path*",
      },
    ];
  },
};

export default nextConfig;
