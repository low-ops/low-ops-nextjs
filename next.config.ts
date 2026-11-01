import type { NextConfig } from "next";

import {
  getSecurityHeaders,
  NO_CACHE_HEADERS,
} from "./src/lib/security-headers";

const nextConfig: NextConfig = {
  output: "standalone",
  headers: async () => [
    {
      source: "/:path*",
      headers: [
        ...Object.entries(NO_CACHE_HEADERS).map(([key, value]) => ({
          key,
          value,
        })),
        ...Object.entries(getSecurityHeaders()).map(([key, value]) => ({
          key,
          value,
        })),
      ],
    },
  ],
};

export default nextConfig;
