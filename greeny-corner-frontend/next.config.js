/** @type {import('next').NextConfig} */
const nextConfig = {
  // Self-contained server bundle for the Docker image (ignored by Vercel).
  output: 'standalone',
  /* config options here */
  // Note: i18n config removed as it conflicts with App Router
  // Translations are handled client-side via react-i18next
  async redirects() {
    return [
      {
        source: '/:path*',
        has: [
          {
            type: 'host',
            value: 'greenycorner.ae',
          },
        ],
        destination: 'https://www.greenycorner.ae/:path*',
        permanent: true,
      },
    ];
  },
};

module.exports = nextConfig;
