import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { execSync } from 'node:child_process';

// Version affichée dans « Mon compte » : le commit construit et l'heure de construction,
// pour vérifier sur un téléphone que la dernière mise à jour est bien arrivée.
function buildVersion() {
  let commit = 'dev';
  try {
    commit = execSync('git rev-parse --short HEAD', { stdio: ['ignore', 'pipe', 'ignore'] })
      .toString()
      .trim();
  } catch {
    // Pas de git (archive) : version « dev »
  }
  const date = new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'short',
    timeStyle: 'short',
    timeZone: 'Europe/Paris',
  }).format(new Date());
  return `${commit} · ${date}`;
}

export default defineConfig({
  define: { 'import.meta.env.VITE_APP_VERSION': JSON.stringify(buildVersion()) },
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
