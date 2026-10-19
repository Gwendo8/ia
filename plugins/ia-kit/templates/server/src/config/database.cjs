// Config lue par sequelize-cli (migrations, seeders). Ancienne syntaxe imposée par l'outil.
try {
  process.loadEnvFile();
} catch {
  // Pas de .env : on garde les variables déjà définies
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
