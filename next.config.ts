import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  serverExternalPackages: ["square"],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        // Optional: If you want to restrict the path further
        // pathname: '/dw8qj9eum/image/upload/**', 
      },
    ],
  },
};



export default nextConfig;
