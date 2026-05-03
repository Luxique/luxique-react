/** @type {import('next').NextConfig} */
const nextConfig = {
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

export default nextConfig;
