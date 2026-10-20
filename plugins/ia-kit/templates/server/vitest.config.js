import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    setupFiles: ['./tests/setup.js'],
    // Les fichiers de test partagent la même base de test : on les lance l'un après l'autre
    fileParallelism: false,
  },
});
