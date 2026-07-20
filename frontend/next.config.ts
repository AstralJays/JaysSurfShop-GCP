import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    unoptimized: true,
  },
  async redirects() {
    return [
      { source: "/security", destination: "/labs", permanent: false },
      { source: "/security/:path*", destination: "/labs", permanent: false },
    ];
  },
};

export default nextConfig;
