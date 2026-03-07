#!/usr/bin/env node
/**
 * Copy non-TypeScript assets (CSS, SVG, PNG) from src/ to dist/
 * preserving directory structure. These files are consumed as-is
 * by the Vite bundler in the consumer project.
 */
import { cpSync, readdirSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';

const ASSET_EXTENSIONS = new Set(['.css', '.svg', '.png']);
const SRC = 'src';
const DIST = 'dist';

function copyAssets(dir) {
  for (const entry of readdirSync(join(SRC, dir), { withFileTypes: true })) {
    const rel = join(dir, entry.name);
    if (entry.isDirectory()) {
      copyAssets(rel);
    } else if (ASSET_EXTENSIONS.has(extname(entry.name))) {
      cpSync(join(SRC, rel), join(DIST, rel));
      console.log(`  copied ${rel}`);
    }
  }
}

console.log('Copying assets from src/ to dist/...');
copyAssets('');
console.log('Done.');
