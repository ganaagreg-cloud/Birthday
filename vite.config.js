import { defineConfig } from 'vite';

// Minimal config — Vite serves /public statically and bundles /src.
export default defineConfig({
  server: {
    host: true, // expose on LAN so you can test on your phone
    port: 3003,
    strictPort: true,
    open: true,
  },
  build: {
    target: 'es2018',
  },
});
