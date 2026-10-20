// Config lue par sequelize-cli (migrations, seeders). Ancienne syntaxe imposée par l'outil.
// NODE_ENV=test (npm run db:migrate:test) : on vise la base de test via .env.test.
try {
  process.loadEnvFile(process.env.NODE_ENV === 'test' ? '.env.test' : '.env');
} catch {
  // Pas de fichier : on garde les variables déjà définies
}

const config = {
  use_env_variable: 'DATABASE_URL',
  dialect: 'postgres',
  define: { underscored: true },
};

module.exports = {
  development: config,
  test: config,
  production: config,
};
