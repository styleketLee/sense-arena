import { defineConfig } from '@apps-in-toss/web-framework/config';

export default defineConfig({
  appName: 'kamkak',
  brand: {
    displayName: '감각측정소',
    primaryColor: '#3182F6',
    icon: 'https://static.toss.im/appsintoss/29389/b8287db9-db5d-427c-bf80-6f9a256e5006.png',
  },
  web: {
    host: 'localhost',
    port: 5173,
    commands: {
      dev: 'vite',
      build: 'tsc -b && vite build',
    },
  },
  permissions: [],
  outdir: 'dist',
  webViewProps: {
    type: 'partner',
  },
});
