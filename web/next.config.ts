import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  ...(process.env.EHIS_STATIC_EXPORT === 'true' ? { output: 'export' as const, distDir: '.next-cloud' } : {
    async redirects() { return [
      { source: '/c/:cardId', destination: '/card?id=:cardId', permanent: false },
      { source: '/report/:incidentId', destination: '/report?id=:incidentId', permanent: false },
    ]; },
  }),
  turbopack: { root: process.cwd() },
};

export default nextConfig;
