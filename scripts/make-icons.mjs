// Renders icons/*.svg to the PNG sizes the PWA manifest and iOS need.
// Usage: node scripts/make-icons.mjs   (requires playwright / chromium)
import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'icons');
const jobs = [
  ['icon.svg', 'icon-192.png', 192], ['icon.svg', 'icon-512.png', 512],
  ['maskable.svg', 'maskable-512.png', 512], ['maskable.svg', 'apple-touch-icon.png', 180],
];
const browser = await chromium.launch(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {});
const page = await browser.newPage();
for (const [src, out, size] of jobs) {
  const svg = readFileSync(path.join(dir, src), 'utf8');
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(`<style>html,body{margin:0;background:transparent}svg{width:${size}px;height:${size}px;display:block}</style>${svg}`);
  await page.screenshot({ path: path.join(dir, out), omitBackground: true });
  console.log('wrote', out);
}
await browser.close();
