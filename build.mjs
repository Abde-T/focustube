import * as esbuild from 'esbuild';
import { copyFileSync, mkdirSync, existsSync, readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load .env file manually since this is a simple script
let envConfig = {};
try {
  const envFile = readFileSync(resolve(__dirname, '.env'), 'utf-8');
  envFile.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      envConfig[match[1]] = match[2].replace(/(^['"]|['"]$)/g, '').trim();
    }
  });
} catch (e) {
  console.log('No .env file found or error reading it.');
}
const isWatch = process.argv.includes('--watch');

const distDir = resolve(__dirname, 'dist');
if (!existsSync(distDir)) {
  mkdirSync(distDir, { recursive: true });
}

/** @type {import('esbuild').BuildOptions} */
const commonConfig = {
  bundle: true,
  format: 'iife',
  target: ['chrome120'],
  sourcemap: true,
  minify: false, // Keep readable for development
  define: {
    // Environment variables can be added here
  },
};

/**
 * Copy static files to dist.
 */
function copyStaticFiles() {
  copyFileSync(
    resolve(__dirname, 'manifest.json'),
    resolve(distDir, 'manifest.json')
  );
  copyFileSync(
    resolve(__dirname, 'src/popup/popup.html'),
    resolve(distDir, 'popup.html')
  );
  copyFileSync(
    resolve(__dirname, 'icon.png'),
    resolve(distDir, 'icon.png')
  );
}

async function build() {
  // Build content script
  await esbuild.build({
    ...commonConfig,
    entryPoints: [resolve(__dirname, 'src/content/index.ts')],
    outfile: resolve(distDir, 'content.js'),
  });

  // Build background service worker
  await esbuild.build({
    ...commonConfig,
    entryPoints: [resolve(__dirname, 'src/background/serviceWorker.ts')],
    outfile: resolve(distDir, 'background.js'),
  });

  // Build popup script
  await esbuild.build({
    ...commonConfig,
    entryPoints: [resolve(__dirname, 'src/popup/popup.ts')],
    outfile: resolve(distDir, 'popup.js'),
  });

  copyStaticFiles();
}

if (isWatch) {
  const contexts = await Promise.all([
    esbuild.context({
      ...commonConfig,
      entryPoints: [resolve(__dirname, 'src/content/index.ts')],
      outfile: resolve(distDir, 'content.js'),
    }),
    esbuild.context({
      ...commonConfig,
      entryPoints: [resolve(__dirname, 'src/background/serviceWorker.ts')],
      outfile: resolve(distDir, 'background.js'),
    }),
    esbuild.context({
      ...commonConfig,
      entryPoints: [resolve(__dirname, 'src/popup/popup.ts')],
      outfile: resolve(distDir, 'popup.js'),
    }),
  ]);

  copyStaticFiles();
  await Promise.all(contexts.map(ctx => ctx.watch()));
} else {
  await build();
}
