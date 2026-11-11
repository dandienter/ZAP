/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  experimental: {
    optimizePackageImports: ["framer-motion", "lucide-react"],
  },
  transpilePackages: ["katex", "react-katex", "three"],
  webpack: (config, { dev }) => {
    if (dev) {
      // Gunakan memory cache di mode dev pada Windows untuk mencegah
      // PackFileCacheStrategy ENOENT dan vendor-chunks module missing
      config.cache = {
        type: "memory",
      };
    }
    return config;
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            // CSP pragmatis untuk Next.js + Google Sign-In (GSI):
            // 'unsafe-inline' masih diperlukan untuk script/style inline
            // bawaan Next dan tombol GSI; frame hanya untuk accounts.google.com.
            key: "Content-Security-Policy",
            value:
              "default-src 'self'; script-src 'self' 'unsafe-inline' https://accounts.google.com; style-src 'self' 'unsafe-inline' https://accounts.google.com; img-src 'self' data: blob: https:; connect-src 'self' https:; font-src 'self' data: https://fonts.gstatic.com; frame-src https://accounts.google.com",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
