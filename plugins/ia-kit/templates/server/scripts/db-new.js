// Crée une migration ou un seeder au format .cjs (sequelize-cli les génère en .js, ce qui plante ici).
// Usage : npm run db:new -- migration create-users
//         npm run db:new -- seed demo-users
import { writeFileSync } from 'node:fs';

const [type, name] = process.argv.slice(2);
const folders = { migration: 'src/database/migrations', seed: 'src/database/seeders' };

if (!folders[type] || !/^[a-z0-9-]+$/.test(name ?? '')) {
  console.error('Usage : npm run db:new -- <migration|seed> <nom-en-kebab-case>');
  process.exit(1);
}

const timestamp = new Date().toISOString().replace(/\D/g, '').slice(0, 14);
const file = `${folders[type]}/${timestamp}-${name}.cjs`;

const content = `'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // TODO
  },

  async down(queryInterface, Sequelize) {
    // TODO : annuler exactement ce que fait up
  },
};
`;

writeFileSync(file, content, { flag: 'wx' });
console.log(`Créé : ${file}`);
