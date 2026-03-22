/** @type {import('next').NextConfig} */
const nextConfig = {
  // Required for the production Docker image (Dockerfile stage 3)
  output: 'standalone',
  experimental: {
    serverComponentsExternalPackages: ['mongoose']
  }
}

export default nextConfig
