/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "via.placeholder.com",
      },
      {
        protocol: "https",
        hostname: "cdnjs.cloudflare.com",
      },
    ],
    unoptimized: true,
  },
  // Netlify specific configuration
  output: "export",
  distDir: "out",
  // Disable server API routes for static export
  rewrites: () => [],
};

export default nextConfig;
