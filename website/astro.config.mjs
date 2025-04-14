import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://solarbot-trading.windsurf.build',
  outDir: './dist',
  publicDir: './public',
  build: {
    assets: '_assets'
  },
  server: {
    port: 3000
  }
});
