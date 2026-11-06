import { defineConfig } from 'vite';

// Fontsource lists a .woff fallback after every .woff2; every browser we target
// reads woff2, so drop the fallback and halve the number of font files.
const woff2Only = {
  name: 'woff2-only',
  enforce: 'pre',
  transform(code, id) {
    if (!id.includes('@fontsource') || !id.endsWith('.css')) return null;
    return code.replace(/,\s*url\([^)]*\.woff\)\s*format\(['"]woff['"]\)/g, '');
  },
};

// base './' makes the build work from any GitHub Pages sub-path.
export default defineConfig({
  base: './',
  plugins: [woff2Only],
  build: { outDir: 'dist', assetsInlineLimit: 0, chunkSizeWarningLimit: 2000 },
});
