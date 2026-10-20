# **NOM_PROJET** — client

React + Vite + Tailwind CSS, navigation avec React Router.

## Lancer

```bash
npm install
npm run dev            # http://localhost:5173 (les appels /api partent vers le serveur local)
```

## Scripts

| Script                  | Rôle                                                  |
| ----------------------- | ----------------------------------------------------- |
| `npm run dev`           | Serveur de développement                              |
| `npm run build`         | Version de production dans `dist/`                    |
| `npm test`              | Tests (Vitest + Testing Library)                      |
| `npm run test:coverage` | Tests + rapport de couverture (lignes jamais testées) |
| `npm run lint`          | Vérifie le code (ESLint)                              |

## Organisation (`src/`)

Le code est rangé **par type, puis par domaine** (un domaine = un sujet métier : `users`, `orders`…) :

| Dossier                 | Rôle                                                          |
| ----------------------- | ------------------------------------------------------------- |
| `pages/<domaine>/`      | Une page = un écran, branché dans `router.jsx`                |
| `components/<domaine>/` | Morceaux d'interface réutilisables (`layout/` = cadre commun) |
| `hooks/<domaine>/`      | Logique React réutilisable (chargement de données, état)      |
| `services/<domaine>/`   | Appels à l'API, toujours via `services/api.js`                |
| `utils/`                | Petits outils partagés (`errorMessage.js`)                    |
| `test/`                 | Configuration des tests                                       |

Les tests sont à côté du fichier testé : `HomePage.jsx` → `HomePage.test.jsx`.

## Règles

- Les composants n'appellent jamais `fetch` directement : page → hook → service → `apiFetch`.
- Chaque couche a un seul rôle : **services** = appels à l'API, **hooks** = état (`useState`), chargement et erreurs, **composants et pages** = affichage.
- Chaque page a un test d'accessibilité : `expectNoA11yViolations(container)` (`src/test/axe.js`).
- Une erreur ne s'affiche jamais telle quelle : `getErrorMessage(error)` donne une phrase claire, `getFieldErrors(error)` les messages sous chaque champ.
- Les variables `VITE_*` sont visibles par tout le monde dans le navigateur : aucun secret dedans.
- Le style se fait avec les classes Tailwind, pas de fichiers CSS par composant.
