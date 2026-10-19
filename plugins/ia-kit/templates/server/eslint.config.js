import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import globals from 'globals';

export default [
  { ignores: ['node_modules/', 'coverage/'] },
  js.configs.recommended,
  {
    files: ['**/*.js'],
    languageOptions: { globals: globals.node, sourceType: 'module' },
  },
  // Migrations, seeders et config sequelize-cli : ancienne syntaxe (require), imposée par l'outil
  {
    files: ['**/*.cjs', '.sequelizerc'],
    languageOptions: { globals: globals.node, sourceType: 'commonjs' },
  },
  // up/down reçoivent toujours (queryInterface, Sequelize), même quand l'un des deux ne sert pas
  {
    files: ['src/database/**'],
    rules: { 'no-unused-vars': ['error', { args: 'none' }] },
  },
  {
    files: ['tests/**/*.js'],
    languageOptions: { globals: globals.vitest },
  },
  // Désactive les règles de mise en forme : c'est le rôle de Prettier
  prettier,
];
