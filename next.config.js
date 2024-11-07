/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {

      // Add HTML loader rule
      config.module.rules.push({
          test: /\.html$/i,
          loader: 'html-loader',
      });

      config.resolve.fallback = { fs: false, net: false, tls: false };

      return config;
  },
  transpilePackages: [
      "antd",
      "@ant-design/plots",
      "@ant-design/icons",
      "@ant-design/icons-svg",
      "@ant-design/pro-components",
      "@ant-design/pro-layout",
      "@ant-design/pro-list",
      "@ant-design/pro-descriptions",
      "@ant-design/pro-form",
      "@ant-design/pro-skeleton",
      "@ant-design/pro-field",
      "@ant-design/pro-utils",
      "@ant-design/pro-provider",
      "@ant-design/pro-card",
      "@ant-design/pro-table",
      "rc-pagination",
      "rc-picker",
      "rc-util",
      "rc-tree",
      "rc-tooltip",
      "rc-table",
      "next",
      "next-auth"
  ],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: process.env.NEXT_PUBLIC_PARSE_HOSTNAME,
        port: '',
        pathname: '/parse/files/**',
      },
      {
        hostname: 'localhost',
        port: '8337',
        pathname: '/parse/files/**',
      }
    ],
  },
};

module.exports = nextConfig
