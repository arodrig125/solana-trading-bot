import { defineConfig } from 'astro/config';

export default defineConfig({
  // Your configuration options here
  outDir: './dist',
  publicDir: './public',
  build: {
    format: 'file'
  }
});
