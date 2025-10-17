const { i18n } = require('./next-i18next.config');

/** @type {import('next').NextConfig} */
const nextConfig = {
  i18n,
  /* config options here */
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
