import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts')

/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  async redirects() {
    return [
      {
        source: '/:path*',
        has: [
          {
            type: 'host',
            value: 'luxique.nl',
          },
        ],
        destination: 'https://www.luxique.nl/:path*',
        permanent: true,
      },
    ]
  },
};

export default withNextIntl(nextConfig);
