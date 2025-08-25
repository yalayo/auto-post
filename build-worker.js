#!/usr/bin/env node

import { build } from 'esbuild';
import { execSync } from 'child_process';

console.log('Building frontend...');
try {
  execSync('npx vite build', { stdio: 'inherit' });
  console.log('✓ Frontend build complete');
} catch (error) {
  console.error('Frontend build failed:', error.message);
  process.exit(1);
}

console.log('Building worker...');

// Build the Cloudflare Worker
await build({
  entryPoints: ['src/index.ts'],
  bundle: true,
  format: 'esm',
  target: 'es2022',
  platform: 'browser', // Workers use browser platform
  outfile: 'dist/worker.js',
  external: [],
  minify: true,
  sourcemap: false,
  define: {
    'process.env.NODE_ENV': '"production"'
  },
  // Exclude problematic dependencies
  conditions: ['worker', 'browser'],
  mainFields: ['worker', 'browser', 'main', 'module'],
}).catch(() => process.exit(1));

console.log('✓ Worker build complete');