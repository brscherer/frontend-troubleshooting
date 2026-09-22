// @ts-check
const { NextFederationPlugin } = require('@module-federation/nextjs-mf');

// `MF_VARIANT=buggy` produces the build served on :3112 (see the `singleton-split` bug).
const buggy = process.env.MF_VARIANT === 'buggy';

/** @type {import('next').NextConfig} */
module.exports = {
  reactStrictMode: true,
  distDir: buggy ? '.next-buggy' : '.next',
  transpilePackages: ['@acme/sdui-context', '@acme/bugs'],
  webpack(config, { dev, isServer }) {
    if (!dev && !isServer) {
      // Maps are generated for the error tracker but not referenced from the bundles.
      config.devtool = 'hidden-source-map';
    }
    config.plugins.push(
      new NextFederationPlugin({
        name: 'offers',
        filename: 'static/chunks/remoteEntry.js',
        exposes: {
          './OfferNode': './components/OfferNode.tsx',
          './ReviewNode': './components/ReviewNode.tsx',
        },
        shared: {
          // Must match the host: a second copy means a second createContext() and silent defaults.
          '@acme/sdui-context': { singleton: true, requiredVersion: '^2.0.0', strictVersion: true },
        },
      }),
    );
    return config;
  },
};
