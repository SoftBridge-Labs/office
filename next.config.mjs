/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',

  /**
   * Proxy all requests from /api-proxy/* to the backend server (PWS-Servers).
   * This avoids CORS issues in development and keeps the API base consistent.
   * In production, configure your reverse proxy (nginx / Vercel rewrites) to do this.
   */
  async rewrites() {
    return [
      {
        source: '/api-proxy/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/:path*`,
      },
    ];
  },
};

export default nextConfig;
