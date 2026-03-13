import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable static export for Capacitor native builds: NEXT_OUTPUT=export npm run build
  ...(process.env.NEXT_OUTPUT === 'export' ? { output: 'export' } : {}),
  async headers() {
    return [{
      source: '/(.*)',
      headers: [
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'X-Frame-Options', value: 'DENY' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
      ],
    }];
  },
};

export default nextConfig;
