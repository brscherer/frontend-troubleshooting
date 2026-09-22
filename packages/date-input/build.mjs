import { build } from 'esbuild';

const common = {
  entryPoints: ['src/index.tsx'],
  bundle: true,
  format: 'esm',
  jsx: 'automatic',
  minify: true,
  sourcemap: false,
  define: { 'process.env.NODE_ENV': '"production"' },
  logLevel: 'info',
};

// For apps: React is a peer dependency.
await build({ ...common, outfile: 'dist/index.js', external: ['react', 'react/jsx-runtime'] });

// For partner sites that embed the widget without a bundler: React is inlined.
await build({ ...common, outfile: 'dist/standalone.js' });
