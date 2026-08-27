/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // Strict type checking during builds
    ignoreBuildErrors: false,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
};

export default nextConfig;
