import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { version } from './package.json';
import { VitePWA } from 'vite-plugin-pwa';

const buildDate = new Date().toISOString();

export default defineConfig(({ mode }) => {
  const isProduction = mode === 'production';

  return {
    plugins: [
      react(),
      {
        name: 'inject-client-tags',
        enforce: 'post',
        transformIndexHtml(html) {
          return html
            .replace(
              '</head>',
              `  <link rel="stylesheet" href="/client/style.css?v=${buildDate}">\n</head>`
            );
          /*.replace(/<link\s+rel="manifest"[^>]*>/i,
            `<link rel="manifest" href="/manifest.json?v=${version}">`);*/
        },
      },
      VitePWA({
        registerType: 'prompt',
        filename: `sw.js`,
        manifestFilename: 'manifest.json',
        //includeAssets: ['favicon.svg', 'favicon.png', 'config.json', 'client/config.json', 'client/logo-dark.svg', 'client/logo-light.svg', 'assets/logo-dark.svg', 'assets/logo-light.svg', 'assets/info-dark.jpg', 'assets/info-light.jpg', 'locales/en/translation.json', 'locales/es/translation.json'],
        manifest: {
          name: 'Smart PWA',
          short_name: 'Smart PWA',
          description: 'Smart PWA - eSafety Systems',
          theme_color: '#000000',
          icons: [
            {
              src: '/icon/pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png',
            },
            {
              src: '/icon/pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
            },
            {
              src: '/icon/pwa-1024x1024.png',
              sizes: '1024x1024',
              type: 'image/png',
            }
          ]
        },
        workbox: {
          cacheId: `smart-pwa-v${version}`,
          cleanupOutdatedCaches: true,
          sourcemap: true,
          globPatterns: ['**/*.{js,css,html,ico,png,svg,jpg,gif,json}'],
          navigateFallback: '/index.html',
          navigateFallbackDenylist: [
            /^\/api\//,
            /^\/app(\/|$)/,
            /^\/web(\/|$)/,
            /^\/Files(\/|$)/,
            /^\/files(\/|$)/
          ],
        },
      }),
    ],
    define: {
      __APP_VERSION__: JSON.stringify(version),
      __APP_ENV__: JSON.stringify(isProduction ? 'PROD' : 'DEV'),
      __BUILD_TIMESTAMP__: JSON.stringify(buildDate),
      global: {},
    },
    server: {
      host: "140.smart.my",
      port: 3010,
    },
    /*optimizeDeps: {
      disabled: true,
    },*/
    build: {
      outDir: 'dist', //isProduction ? 'dist/prod' : 'dist/dev',
      rollupOptions: {
        output: {
          /*manualChunks(id) {
            if (id.includes('node_modules')) {
              if (id.includes('react') || id.includes('react-dom') || id.includes('react-router-dom')) {
                return 'vendor_react';
              }
              if (id.includes('i18')) {
                return 'vendor_i18n';
              }
              if (id.includes('heic2any')) {
                return 'vendor_heic2any';
              }
              if (id.includes('amazon-cognito-identity-js')) {
                return 'vendor_cognito';
              }
              return 'vendor';
            }
        },*/
        },
      },
      chunkSizeWarningLimit: 1500
    },
  };
});
