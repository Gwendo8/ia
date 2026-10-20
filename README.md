# ia-kit

Mon plugin Claude Code : skills, commandes, agents et hooks réutilisables d'un projet à l'autre.

## Utilisation

### Installer (une fois par ordinateur, Mac comme Windows)

Dans un terminal :

```bash
claude plugin marketplace add Gwendo8/ia
claude plugin install ia-kit@gwendo8
```

> ⚠️ `/plugin` ne marche pas dans l'extension VS Code : toujours passer par `claude plugin ...` dans un terminal.

Prérequis : **Node.js 22.13 ou plus** (le MCP pgadmin en a besoin) et, pour ce MCP, **pgAdmin** installé avec ses serveurs enregistrés.

Mettre à jour après un push, puis relancer Claude Code :

```bash
claude plugin marketplace update gwendo8
```

### Contenu du plugin

| Élément | Type | À quoi ça sert |
| --- | --- | --- |
| `/chef` | commande | Chef de projet : cadre un nouveau projet, découpe le travail et dirige les agents spécialistes. |
| `/squelette-client` | commande | Crée le squelette du client (React + Vite + Tailwind). Arguments : `[nom-du-projet] [mono\|separe]`. |
| `/squelette-server` | commande | Crée le squelette du serveur (Node.js + Express + Sequelize). Mêmes arguments. |
| `/bdd` | commande | Lance le spécialiste base de données directement dans la conversation. |
| `/back` | commande | Lance le spécialiste API directement dans la conversation. |
| `bdd` | agent | Conçoit le schéma avec toi, puis crée la base, les migrations et les modèles (PostgreSQL + Sequelize). |
| `back` | agent | Définit le contrat de l'API avec toi, puis code les routes, la logique et les tests. |
| `pgadmin` | MCP | Lit les bases PostgreSQL à partir des serveurs de pgAdmin (voir ci-dessous). |
| Hooks | — | Aucun pour l'instant. |
| Skills | — | Aucun pour l'instant (on préfère les commandes, qui ne se déclenchent pas toutes seules). |

**Commande ou agent ?** La commande (`/bdd`) fait travailler la conversation en cours, en dialogue direct avec toi. L'agent (`bdd`) est appelé par `/chef` et travaille dans son coin, puis lui rend compte. C'est le même fichier d'instructions dans les deux cas.

**Le MCP pgadmin** donne à Claude quatre outils : `lister_serveurs`, `lister_bases`, `decrire_base` et `requete`.

- Il lit la liste des serveurs dans pgAdmin (sans jamais la modifier ni lire les mots de passe).
- Les mots de passe viennent du fichier standard de PostgreSQL : `~/.pgpass` (Mac) ou `%APPDATA%\postgresql\pgpass.conf` (Windows). En local, souvent inutile.
- **Lecture seule partout**, sauf sur une base de test : nom en `_test` **et** serveur local.
- Si pgAdmin est rangé ailleurs que d'habitude, indiquer le chemin de `pgadmin4.db` dans la variable d'environnement `PGADMIN_DB`.

## Compléments à installer (une fois par ordinateur)

L'agent `design` utilise ces skills s'ils sont installés, et fait sans sinon. Ils s'installent sur la machine, pas sur le compte : à refaire sur chaque poste.

Dans Claude Code, lancé depuis le terminal (choisir la portée **user**) :

```
/plugin marketplace add anthropics/claude-code
/plugin install frontend-design@claude-code-plugins
/plugin marketplace add pbakaus/impeccable
/plugin install impeccable@impeccable
```

Dans le terminal (skill de Vercel, un seul fichier qui télécharge ses règles à jour à chaque usage) :

```bash
mkdir -p ~/.claude/skills/web-design-guidelines && curl -fsSL https://raw.githubusercontent.com/vercel-labs/agent-skills/main/skills/web-design-guidelines/SKILL.md -o ~/.claude/skills/web-design-guidelines/SKILL.md
```

## Structure

```
.claude-plugin/marketplace.json   # déclare les plugins du dépôt
plugins/ia-kit/
├── .claude-plugin/plugin.json    # infos du plugin (nom, version…)
├── skills/<nom>/SKILL.md         # skills, utilisés automatiquement par Claude
├── commands/<nom>.md             # commandes /slash
├── agents/<nom>.md               # sous-agents
├── templates/                    # modèles copiés par /squelette-client et /squelette-server
├── .mcp.json                     # déclare les serveurs MCP du plugin
├── mcp/pgadmin/                  # code du MCP pgadmin (dist/ = version compilée, commitée)
└── hooks/hooks.json              # hooks (actions automatiques)
```

## Développer

- **Activer les hooks git** (une fois par poste où on développe) :

  ```bash
  git config core.hooksPath .githooks
  ```

  Le hook `pre-commit` fait alors deux choses avant chaque commit :
  - il **bloque** le commit si un nouvel élément du plugin (commande, agent, skill, hook, MCP) n'a pas été ajouté au README ;
  - si le code du MCP pgadmin a changé, il **relance la compilation** (`npm run build`) et ajoute `dist/` au commit.

- **Pourquoi compiler le MCP** : le plugin installé ne fait pas de `npm install`. Il lance directement `dist/pgadmin-mcp.js`, un fichier unique qui contient le code et toutes ses dépendances. C'est ce fichier qui est commité : s'il n'est pas recompilé, la modification n'arrive jamais chez l'utilisateur. Sans le hook, compiler à la main : `cd plugins/ia-kit/mcp/pgadmin && npm run build`.

## Règles

- On modifie **uniquement dans ce dépôt**, jamais dans un projet qui utilise le plugin (les fichiers installés sont écrasés à chaque mise à jour).
- Aucun secret dans le dépôt : utiliser des variables d'environnement (`${MON_TOKEN}`).
- Tester en local avant de push : `claude plugin marketplace add /chemin/vers/ia`.
- **Tout nouvel élément du plugin (commande, agent, MCP, hook, skill…) s'ajoute au tableau « Contenu du plugin »**, dans le même commit.
- Agents : le bloc « Règles communes » est copié à l'identique en tête de chaque agent (un agent ne voit que son propre fichier). **Le modifier dans tous les agents à la fois.** Chaque agent sert au démarrage comme pour faire évoluer ou corriger le projet ; il lit tout le projet mais ne modifie que sa partie.
