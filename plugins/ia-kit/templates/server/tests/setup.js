// Charge .env.test pour les tests : ils utilisent une base séparée, jamais la vraie.
try {
  process.loadEnvFile('.env.test');
} catch {
  throw new Error('Fichier .env.test manquant : copier .env.test.example en .env.test');
}

// Sécurité : les tests vident les tables, on refuse donc toute base dont le nom ne finit pas par _test.
const dbName = new URL(process.env.DATABASE_URL).pathname.slice(1);
if (!dbName.endsWith('_test')) {
  throw new Error(
    `Les tests refusent de tourner sur la base « ${dbName} » : son nom doit finir par _test`,
  );
}
