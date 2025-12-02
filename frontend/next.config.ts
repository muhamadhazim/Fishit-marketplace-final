import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '4000',
        pathname: '/uploads/**',
      },
      {
        protocol: 'https',
        hostname: '**.onrender.com', // Allow images from any Render backend
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com', // Allow images from Cloudinary
      },
    ],
  },
};

export default nextConfig;
