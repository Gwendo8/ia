# **NOM_PROJET** — client

React + Vite + Tailwind CSS, navigation avec React Router.

## Lancer

```bash
npm install
npm run dev            # http://localhost:5173 (les appels /api partent vers le serveur local)
```

## Scripts

| Script          | Rôle                               |
| --------------- | ---------------------------------- |
| `npm run dev`   | Serveur de développement           |
| `npm run build` | Version de production dans `dist/` |
| `npm test`      | Tests (Vitest + Testing Library)   |
| `npm run lint`  | Vérifie le code (ESLint)           |

## Organisation (`src/`)

Le code est rangé **par type, puis par domaine** (un domaine = un sujet métier : `users`, `orders`…) :

| Dossier                 | Rôle                                                          |
| ----------------------- | ------------------------------------------------------------- |
| `pages/<domaine>/`      | Une page = un écran, branché dans `router.jsx`                |
| `components/<domaine>/` | Morceaux d'interface réutilisables (`layout/` = cadre commun) |
| `hooks/<domaine>/`      | Logique React réutilisable (chargement de données, état)      |
| `services/<domaine>/`   | Appels à l'API, toujours via `services/api.js`                |
| `test/`                 | Configuration des tests                                       |

Les tests sont à côté du fichier testé : `HomePage.jsx` → `HomePage.test.jsx`.

## Règles

- Les composants n'appellent jamais `fetch` directement : page → hook → service → `apiFetch`.
- Les variables `VITE_*` sont visibles par tout le monde dans le navigateur : aucun secret dedans.
- Le style se fait avec les classes Tailwind, pas de fichiers CSS par composant.
