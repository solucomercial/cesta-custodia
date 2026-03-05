/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  env: {
    NEXT_PUBLIC_API_PUBLIC_ORIGIN: process.env.API_PUBLIC_ORIGIN,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
