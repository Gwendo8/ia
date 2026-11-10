// Lancé tout seul avant « npm test » (script « pretest ») : applique à la base de test les migrations qui lui
// manquent. Sans ça, une migration passée seulement sur la base de dev fait échouer les tests avec des erreurs
// du genre « column … does not exist ». Ne dit rien quand la base de test est déjà à jour.
import { execSync } from 'node:child_process';
import { readdirSync } from 'node:fs';

// Projet tout neuf, sans migration : pas besoin de base de test pour l'instant
const hasMigrations = readdirSync('src/database/migrations').some((file) => file.endsWith('.cjs'));
if (!hasMigrations) process.exit(0);

try {
  const output = execSync('npx sequelize-cli db:migrate', {
    env: { ...process.env, NODE_ENV: 'test' },
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  const applied = output.split('\n').filter((line) => line.includes(': migrated'));
  if (applied.length) console.log(`Base de test mise à jour :\n${applied.join('\n')}`);
} catch (err) {
  console.error(`${err.stdout ?? ''}${err.stderr ?? ''}`);
  console.error('✖ Impossible de mettre la base de test à jour (existe-t-elle ? voir .env.test).');
  process.exit(1);
}
