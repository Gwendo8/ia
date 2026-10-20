import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // En développement, les appels à /api partent vers le serveur Express local.
    // API_PROXY_TARGET permet de viser un autre serveur (ex. celui des tests de bout en bout, branché sur la base de test).
    proxy: { '/api': process.env.API_PROXY_TARGET ?? 'http://localhost:3000' },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.js'],
    // npm run test:coverage : quelles lignes de src/ les tests parcourent, et lesquelles jamais
    coverage: { include: ['src/**'], exclude: ['src/test/**', 'src/main.jsx'] },
  },
});
