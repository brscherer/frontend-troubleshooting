// @ts-check
const { NextFederationPlugin } = require('@module-federation/nextjs-mf');

// `MF_VARIANT=buggy` produces the build served on :3111 (see the `two-reacts` bug).
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
    if (buggy) {
      // "Bundle size fix" from PR #377: import the 9kb standalone build instead of the package.
      config.resolve.alias['@acme/date-input$'] = require.resolve('@acme/date-input/standalone');
    }
    config.plugins.push(
      new NextFederationPlugin({
        name: 'intake',
        filename: 'static/chunks/remoteEntry.js',
        exposes: {
          './ApplicantForm': './components/ApplicantForm.tsx',
          './EmploymentForm': './components/EmploymentForm.tsx',
          './DocumentsForm': './components/DocumentsForm.tsx',
          './IncomeForm': './components/IncomeForm.tsx',
          './CoSignerForm': './components/CoSignerForm.tsx',
        },
        shared: {
          '@acme/sdui-context': { singleton: true, requiredVersion: '^2.0.0', strictVersion: true },
        },
      }),
    );
    return config;
  },
};
