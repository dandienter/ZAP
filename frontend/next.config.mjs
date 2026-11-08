/** @type {import('next').NextConfig} */
const nextConfig = {
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
};

export default nextConfig;
