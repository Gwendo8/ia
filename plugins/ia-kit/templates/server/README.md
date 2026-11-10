# **NOM_PROJET** — server

API Node.js + Express 5, base PostgreSQL via Sequelize.

## Lancer

```bash
cp .env.example .env   # puis remplir les valeurs
npm install
npm run dev            # http://localhost:3000/api/health
```

Les tests (`npm test`) utilisent une base séparée, configurée dans `.env.test` (copie de `.env.test.example`), dont le nom finit par `_test`.
| `npm run test:coverage` | Tests + rapport de couverture (lignes jamais testées) |

```bash
cp .env.test.example .env.test
```

## Scripts

| Script                                     | Rôle                                        |
| ------------------------------------------ | ------------------------------------------- |
| `npm run dev`                              | Serveur avec redémarrage automatique        |
| `npm test`                                 | Tests (Vitest + Supertest)                  |
| `npm run lint`                             | Vérifie le code (ESLint)                    |
| `npm run db:migrate`                       | Applique les migrations                     |
| `npm run db:migrate:undo`                  | Annule la dernière migration                |
| `npm run db:migrate:test`                  | Applique les migrations sur la base de test |
| `npm run db:seed`                          | Insère les données de départ                |
| `npm run db:new -- migration create-users` | Crée une migration (`seed` pour un seeder)  |

## Organisation (`src/`)

Une requête traverse les couches dans cet ordre :

```
routes → middlewares (validate) → controllers → services → repositories → models
```

| Dossier                | Rôle                                                                          |
| ---------------------- | ----------------------------------------------------------------------------- |
| `routes/`              | Associe une URL à un controller (un fichier par domaine : `users.routes.js`)  |
| `middlewares/`         | Traitements communs : validation Zod, erreurs, 404                            |
| `controllers/`         | Lit la requête, appelle le service, renvoie la réponse. Pas de logique métier |
| `services/`            | Logique métier (règles, calculs). Ne connaît ni Express ni SQL                |
| `repositories/`        | Accès aux données via les modèles Sequelize                                   |
| `models/`              | Modèles Sequelize (`index.js` = connexion)                                    |
| `database/migrations/` | Changements de structure de la base, dans l'ordre                             |
| `database/seeders/`    | Données de départ                                                             |
| `config/`              | Variables d'environnement vérifiées, config sequelize-cli                     |
| `utils/`               | Petits outils partagés (`HttpError`)                                          |

## Règles

- La structure de la base change **uniquement par une migration**, jamais avec `sequelize.sync()`.
- Migrations et seeders sont en `.cjs` (ancienne syntaxe `require`) : sequelize-cli ne comprend pas `import`.
  Toujours les créer avec `npm run db:new`, jamais avec `sequelize-cli migration:generate` (qui produit du `.js`).
- Les erreurs se lancent avec `throw new HttpError(status, message)` : le middleware `errorHandler` répond en JSON.
- Les données entrantes sont toujours vérifiées avec `validate({ body, query, params })` et des schémas Zod.
- Les tests tournent sur la base de test (`.env.test`, nom en `_test`), jamais sur la vraie base. `npm test` applique d'abord à la base de test les migrations qui lui manquent (script `pretest`, `scripts/db-migrate-test.js`) ; à la main : `npm run db:migrate:test`.
