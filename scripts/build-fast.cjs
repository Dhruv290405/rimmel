#!/usr/bin/env node
const { build } = require('esbuild');
const { mkdirSync } = require('fs');
try { mkdirSync('dist/esm', { recursive: true }); } catch(e) {}
try { mkdirSync('dist/cjs', { recursive: true }); } catch(e) {}

(async () => {
  try {
    console.log('esbuild: bundling ESM -> dist/esm/index.js');
    await build({
      entryPoints: ['src/index.ts'],
      bundle: true,
      sourcemap: true,
      format: 'esm',
      platform: 'browser',
      target: ['es2020'],
      external: ['rxjs'],
      outfile: 'dist/esm/index.js',
      logLevel: 'info',
    });

    console.log('esbuild: bundling CJS -> dist/cjs/index.cjs');
    await build({
      entryPoints: ['src/index.ts'],
      bundle: true,
      sourcemap: true,
      format: 'cjs',
      platform: 'node',
      target: ['es2020'],
      external: ['rxjs'],
      outfile: 'dist/cjs/index.cjs',
      logLevel: 'info',
    });

    console.log('esbuild: fast build complete');
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
