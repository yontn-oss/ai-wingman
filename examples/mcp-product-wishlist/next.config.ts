import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  headers: async () => [
    {
      source: '/mcp-apps/:path*',
      headers: [{ key: 'Access-Control-Allow-Origin', value: '*' }],
    },
  ],
};

export default nextConfig;
