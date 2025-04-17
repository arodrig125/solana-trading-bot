import { defineConfig } from 'astro/config';
import staticAdapter from '@astrojs/adapter-static';

export default defineConfig({
  site: 'https://starfish-app-98xta.ondigitalocean.app',
  outDir: './dist',
  publicDir: './public',
  build: {
    assets: '_assets'
  },
  server: {
    port: 3000
  },
  adapter: staticAdapter(),
  // Add environment variables to handle localhost references during build
  vite: {
    define: {
      'process.env.IS_PRODUCTION': 'true',
      'process.env.API_ENDPOINT': '"https://starfish-app-98xta.ondigitalocean.app/api"',
      'process.env.WS_ENDPOINT': '"wss://starfish-app-98xta.ondigitalocean.app"'
    }
  }
});
