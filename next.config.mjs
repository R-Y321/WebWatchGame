/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    appDir: true,
  },
}

export default nextConfig;  // ← module.exports ではなく export default
