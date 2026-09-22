// @ts-check
const path = require('path');
const { NextFederationPlugin } = require('@module-federation/nextjs-mf');

const INTAKE_URL = process.env.NEXT_PUBLIC_INTAKE_URL ?? 'http://localhost:3101';
const OFFERS_URL = process.env.NEXT_PUBLIC_OFFERS_URL ?? 'http://localhost:3102';
const GRAPH_URL = process.env.GRAPH_URL ?? 'http://localhost:4000';

/** @type {import('next').NextConfig} */
module.exports = {
  reactStrictMode: true,
  transpilePackages: ['@acme/sdui-context', '@acme/bugs'],
  async rewrites() {
    return [{ source: '/api/graph/:path*', destination: `${GRAPH_URL}/:path*` }];
  },
  webpack(config, { isServer }) {
    const entry = (base) => `${base}/_next/static/${isServer ? 'ssr' : 'chunks'}/remoteEntry.js`;
    config.plugins.push(
      new NextFederationPlugin({
        name: 'host',
        filename: 'static/chunks/remoteEntry.js',
        remotes: {
          intake: `intake@${entry(INTAKE_URL)}`,
          offers: `offers@${entry(OFFERS_URL)}`,
        },
        shared: {
          '@acme/sdui-context': { singleton: true, requiredVersion: '^2.0.0', strictVersion: true },
        },
        runtimePlugins: [path.resolve(__dirname, 'mf/bug-variant-plugin.js')],
      }),
    );
    return config;
  },
};
