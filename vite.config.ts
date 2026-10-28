import { defineConfig, loadEnv, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import basicSsl from '@vitejs/plugin-basic-ssl';

/** Serves the /api functions during `npm run dev`, reading secrets (SMTP_PASS, GEMINI_API_KEY ...) from .env. */
function devApi(): Plugin {
  return {
    name: 'smarak-dev-api',
    configureServer(server) {
      Object.assign(process.env, loadEnv(server.config.mode, process.cwd(), ''));
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith('/api/')) return next();
        const name = req.url.slice(5).split('?')[0].replace(/[^a-z-]/g, '');
        const send = (code: number, body: unknown) => { res.statusCode = code; res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(body)); };
        try {
          const mod = await server.ssrLoadModule(`/api/${name}.ts`);
          let raw = '';
          for await (const chunk of req) raw += chunk;
          (req as any).body = raw ? JSON.parse(raw) : {};
          const r: any = res;
          r.status = (c: number) => { res.statusCode = c; return r; };
          r.json = (o: unknown) => { res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(o)); return r; };
          await mod.default(req, r);
        } catch (e) { send(500, { error: 'dev api error' }); }
      });
    },
  };
}

// HTTPS=1 npm run dev  ->  needed to test the camera on a phone over Wi-Fi.
export default defineConfig({
  plugins: [
    react(),
    devApi(),
    process.env.HTTPS ? basicSsl() : null,
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['logo.png', 'icon-192.png'],
      manifest: {
        name: 'SMARAK Mewar', short_name: 'SMARAK', description: 'Offline AR heritage companion for Udaipur, Chittorgarh and Mewar',
        theme_color: '#ee5a30', background_color: '#fdf6e6', display: 'standalone', orientation: 'portrait',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
      },
      workbox: { globPatterns: ['**/*.{js,css,html,svg,png,jpg,glb,woff2}'], maximumFileSizeToCacheInBytes: 25 * 1024 * 1024 },
    }),
  ],
});
