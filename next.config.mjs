/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "inaturalist-open-data.s3.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "*.inaturalist.org",
      },
      {
        protocol: "https",
        hostname: "api.gbif.org",
      },
    ],
    // static export requires unoptimized images
    unoptimized: true,
  },
};

export default nextConfig;
