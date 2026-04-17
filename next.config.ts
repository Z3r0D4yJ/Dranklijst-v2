import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: false,
  experimental: {
    ppr: false,
  },
}

export default nextConfig
