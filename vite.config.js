import { defineConfig } from 'vite';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

// Fonts: Fontsource splits each font into many small files by character range.
// We keep only the files that contain characters the game really uses (all text
// is in src/), and drop the old .woff fallbacks. Fewer, smaller downloads on school Wi-Fi.
function usedCodePoints(dir) {
  const set = new Set();
  const walk = (d) => readdirSync(d).forEach((f) => {
    const p = join(d, f);
    if (statSync(p).isDirectory()) walk(p);
    else if (/\.(js|html|css)$/.test(f)) for (const ch of readFileSync(p, 'utf8')) set.add(ch.codePointAt(0));
  });
  walk(dir);
  for (let c = 32; c < 127; c++) set.add(c); // all of basic Latin, always
  return set;
}
function rangeHits(range, used) {
  return range.split(',').some((part) => {
    const m = part.trim().replace(/^U\+/i, '').split('-');
    const lo = parseInt(m[0].replace(/\?/g, '0'), 16), hi = m[1] ? parseInt(m[1], 16) : parseInt(m[0].replace(/\?/g, 'f'), 16);
    for (const c of used) if (c >= lo && c <= hi) return true;
    return false;
  });
}
const trimFonts = () => {
  let used = null;
  return {
    name: 'trim-fonts',
    enforce: 'pre',
    buildStart() { used = usedCodePoints(new URL('./src', import.meta.url).pathname); },
    transform(code, id) {
      if (!id.includes('@fontsource') || !id.endsWith('.css')) return null;
      if (!used) used = usedCodePoints(new URL('./src', import.meta.url).pathname);
      code = code.replace(/,\s*url\([^)]*\.woff\)\s*format\(['"]woff['"]\)/g, '');
      return code.replace(/\/\*[^*]*\*\/\s*@font-face\s*{[^}]*}/g, (block) => {
        const m = block.match(/unicode-range:\s*([^;]+);/);
        return !m || rangeHits(m[1], used) ? block : '';
      });
    },
  };
};

// base './' makes the build work from any GitHub Pages sub-path.
export default defineConfig({
  base: './',
  plugins: [trimFonts()],
  build: { outDir: 'dist', assetsInlineLimit: 0, chunkSizeWarningLimit: 2000 },
});
