import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import globals from 'globals';

export default [
  { ignores: ['dist/', 'coverage/'] },
  js.configs.recommended,
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
  },
  // Fichiers de configuration : exécutés par Node, pas dans le navigateur
  {
    files: ['vite.config.js'],
    languageOptions: { globals: globals.node },
  },
  reactHooks.configs.flat.recommended,
  reactRefresh.configs.vite,
  // Désactive les règles de mise en forme : c'est le rôle de Prettier
  prettier,
];
