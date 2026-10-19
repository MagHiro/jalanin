/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  output: "standalone",
  experimental: {
    serverActions: {
      bodySizeLimit: "6mb",
    },
  },
};

export default nextConfig;
