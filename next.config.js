/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  eslint: {
    // Disable ESLint during production builds for faster builds
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig; 