// Charge le .env pour les tests (comme --env-file pour le serveur).
try {
  process.loadEnvFile();
} catch {
  // Pas de .env : on garde les variables déjà définies
}
