import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    setupFiles: ['./tests/setup.js'],
    // Les fichiers de test partagent la même base de test : on les lance l'un après l'autre
    fileParallelism: false,
    // npm run test:coverage : quelles lignes de src/ les tests parcourent, et lesquelles jamais
    coverage: { include: ['src/**'], exclude: ['src/server.js', 'src/database/**'] },
  },
});
