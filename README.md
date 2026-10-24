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

**Où le plugin est actif (la « portée »)** : par défaut, il s'installe pour **tous tes projets** de l'ordinateur (portée `user`), sans rien à refaire projet par projet. Les commandes ne se lancent que si tu les tapes, et les hooks ne font rien sans `PROJET.md` : il ne gêne donc pas les autres projets. Deux autres portées existent, à installer depuis le dossier du projet :

| Portée | Où il est actif | Pour qui |
| --- | --- | --- |
| `user` (par défaut) | Tous tes projets | Toi seule |
| `project` (`--scope project`) | Ce projet seulement | Toi et quiconque récupère le projet (noté dans `.claude/settings.json`, versionné) |
| `local` (`--scope local`) | Ce projet seulement | Toi seule, sans partage |

Pour démarrer un nouveau projet : ouvre un terminal dans son dossier, lance `claude`, puis `/ia-kit:chef`. Si l'idée est encore floue, commence par `/ia-kit:cahier-des-charges <ton idée>` : il en discute avec toi et écrit `CAHIER-DES-CHARGES.md`, que tu donnes ensuite au chef (`/ia-kit:chef CAHIER-DES-CHARGES.md`).

Pour reprendre un projet en cours (nouvelle conversation entre deux étapes) : `/clear` puis `/ia-kit:chef`. Le chef lit `PROJET.md`, résume où on en est et continue à l'étape suivante, sans refaire le cadrage.

Prérequis : **Node.js 22.13 ou plus** (le MCP pgadmin en a besoin) et, pour ce MCP, **pgAdmin** installé avec ses serveurs enregistrés.

Mettre à jour après un push, puis relancer Claude Code :

```bash
claude plugin marketplace update gwendo8   # récupère le catalogue à jour depuis GitHub
claude plugin update ia-kit@gwendo8        # installe la nouvelle version du plugin
```

Inutile sur le poste où le catalogue a été ajouté depuis le dossier local (`claude plugin marketplace add /chemin/vers/ia`) : le plugin y est lu directement dans le dossier, relancer Claude Code suffit (`claude plugin marketplace list` montre la source : « Folder » ou GitHub). Attention, sur ce poste, une modification en cours dans `ia` s'applique à tous tes projets dès la relance, même sans commit.

### Contenu du plugin

| Élément | Type | À quoi ça sert |
| --- | --- | --- |
| `/cahier-des-charges` | commande | Part de ton idée de projet, te pose des questions thème par thème, puis rédige `CAHIER-DES-CHARGES.md` (à donner ensuite à `/chef`). Ne fait aucun choix technique. |
| `/chef` | commande | Chef de projet : cadre un nouveau projet, découpe le travail et dirige les agents spécialistes, et reprend un projet en cours depuis `PROJET.md`. Commite lui-même chaque étape validée (lint et tests verts avant), jamais de push. |
| `/squelette-client` | commande | Crée le squelette du client (React + Vite + Tailwind). Arguments : `[nom-du-projet] [mono\|separe]`. |
| `/squelette-server` | commande | Crée le squelette du serveur (Node.js + Express + Sequelize). Mêmes arguments. |
| `/bdd` | commande | Lance le spécialiste base de données directement dans la conversation. |
| `/back` | commande | Lance le spécialiste API directement dans la conversation. |
| `/design` | commande | Lance le designer directement dans la conversation. |
| `/front` | commande | Lance le spécialiste front-end directement dans la conversation. |
| `/auditeur` | commande | Lance un audit complet ou ciblé directement dans la conversation. |
| `bdd` | agent | Conçoit le schéma avec toi, puis crée la base, les migrations et les modèles (PostgreSQL + Sequelize). |
| `back` | agent | Définit le contrat de l'API avec toi, puis code les routes, la logique et les tests. |
| `design` | agent | Recherche l'inspiration ciblée sur le projet, te propose trois variantes, puis écrit `DESIGN.md` et les maquettes Figma. Gère aussi les refontes. |
| `front` | agent | Présente son plan avec toi, puis code les écrans React d'après `DESIGN.md`, les maquettes Figma et `API.md`, avec tests et vérification visuelle. |
| `auditeur` | agent | Passe le projet en revue (sécurité, cohérence, qualité, tests, performance, accessibilité), écrit `AUDIT.md` et les tests de bout en bout. Ne corrige pas : indique quel agent doit corriger. |
| `pgadmin` | MCP | Lit les bases PostgreSQL à partir des serveurs de pgAdmin (voir ci-dessous). |
| `playwright` | MCP | Navigateur invisible et isolé (jamais ton vrai Chrome) : les agents `design`, `front` et `auditeur` s'en servent pour regarder des pages en capture d'écran (inspiration, vérification des écrans). |
| `projet-sync` | hooks | Gardent `PROJET.md` à jour tout seuls : en début de conversation (rattrape tes modifications manuelles), à la fin de chaque demande qui a modifié le projet, et à chaque commit (Claude met `PROJET.md` à jour et l'ajoute au même commit). Ne font rien dans un projet sans `PROJET.md`. Script : `templates/commun/.husky/projet-sync.sh` (copié dans chaque projet par les squelettes). |
| Skills | — | Aucun pour l'instant (on préfère les commandes, qui ne se déclenchent pas toutes seules). |

**Commande ou agent ?** La commande (`/bdd`) fait travailler la conversation en cours, en dialogue direct avec toi. L'agent (`bdd`) est appelé par `/chef` et travaille dans son coin, puis lui rend compte. C'est le même fichier d'instructions dans les deux cas.

**Le MCP pgadmin** donne à Claude quatre outils : `lister_serveurs`, `lister_bases`, `decrire_base` et `requete`.

- Il lit la liste des serveurs dans pgAdmin (sans jamais la modifier ni lire les mots de passe).
- Les mots de passe viennent du fichier standard de PostgreSQL : `~/.pgpass` (Mac) ou `%APPDATA%\postgresql\pgpass.conf` (Windows). En local, souvent inutile.
- **Lecture seule partout**, sauf sur une base de test : nom en `_test` **et** serveur local.
- Si pgAdmin est rangé ailleurs que d'habitude, indiquer le chemin de `pgadmin4.db` dans la variable d'environnement `PGADMIN_DB`.

**Les hooks projet-sync** gardent `PROJET.md` (la carte du projet) à jour, même après tes modifications à la main.

- **Point de synchro** : la dernière ligne de `PROJET.md` est un commentaire invisible qui contient une empreinte git de tous les fichiers au moment de la dernière mise à jour. Le script compare le projet à cette empreinte pour savoir ce qui a changé, que ce soit commité ou non. Ne pas modifier cette ligne.
- **Début de conversation** : s'il y a eu des changements depuis, Claude en reçoit la liste et met `PROJET.md` à jour. Il demande le pourquoi d'une modification manuelle au lieu de l'inventer, et pose aussi les questions laissées en attente (« ❓ à demander »).
- **Fin de chaque demande** : si du code a changé sans que `PROJET.md` suive, Claude est relancé **une seule fois** pour le mettre à jour. Si rien n'a changé, rien ne se passe (aucun coût).
- **Commit** (pre-commit Husky du projet) : si `PROJET.md` n'a pas suivi, le script lance `claude -p`, qui le met à jour (une quinzaine de secondes), puis l'ajoute au même commit. Une raison inconnue devient « ❓ à demander ». Si Claude est indisponible, le commit est bloqué (contournement : `git commit --no-verify`).
- **Tout le monde peut écrire `PROJET.md`** (chef, agents, toi) : on relit juste avant d'écrire et on ne touche qu'à ce qui concerne son travail. En dépôts séparés, chaque dépôt a son propre `PROJET.md`.
- Ignorés : `PROJET.md` lui-même, les fichiers de verrouillage et tout ce que `.gitignore` exclut (`node_modules`, `dist`, `.env`…). Le `claude -p` du commit tourne avec `IA_KIT_SYNC_OFF=1`, pour ne pas redéclencher les hooks en boucle.
- **Projet créé avant ces hooks** : les hooks de conversation marchent déjà. Pour le commit, copier `templates/commun/.husky/projet-sync.sh` dans le `.husky/` du projet et ajouter la ligne `sh .husky/projet-sync.sh commit` à `.husky/pre-commit`.

## Compléments à installer (une fois par ordinateur)

Les agents `design` (frontend-design) et `front` (Impeccable, Vercel) utilisent ces skills s'ils sont installés, et font sans sinon. Ils s'installent sur la machine, pas sur le compte : à refaire sur chaque poste.

Dans un terminal :

```bash
claude plugin marketplace add anthropics/claude-code
claude plugin install frontend-design@claude-code-plugins
claude plugin marketplace add pbakaus/impeccable
claude plugin install impeccable@impeccable
# Skill de Vercel : un seul fichier, qui télécharge ses règles à jour à chaque usage
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
│                                 #   (commun/.husky/projet-sync.sh = script des hooks projet-sync)
│                                 #   (commun/.husky/commit-msg = retire Co-Authored-By Claude des commits)
├── .mcp.json                     # déclare les serveurs MCP du plugin
├── mcp/pgadmin/                  # code du MCP pgadmin (dist/ = version compilée, commitée)
└── hooks/hooks.json              # hooks (actions automatiques)
```

## Développer

- **Activer les hooks git** (une fois par poste où on développe) :

  ```bash
  git config core.hooksPath .githooks
  ```

  (Ce sont les hooks git **de ce dépôt**, pour développer le plugin ; à ne pas confondre avec les hooks projet-sync, qui tournent dans tes projets.)
  Le hook `pre-commit` fait alors trois choses avant chaque commit :
  - il **bloque** le commit si le tableau « Contenu du plugin » ne correspond plus au plugin, dans les deux sens : élément (commande, agent, skill, MCP, hooks) sans sa ligne, ou ligne d'un élément supprimé (script `.githooks/verifier-readme.js`) ;
  - il **bloque** le commit si le bloc « Règles communes » n'est plus identique dans tous les agents ;
  - si le code du MCP pgadmin a changé, il **relance la compilation** (`npm run build`) et ajoute `dist/` au commit.

- **Hook Claude de ce dépôt** (`.claude/settings.json`, actif tout seul quand Claude travaille ici) : à la fin d'une demande où Claude a modifié des fichiers du plugin sans toucher au README, il est relancé une fois pour vérifier que le README décrit toujours la réalité (descriptions, structure, explications). Le pre-commit ne vérifie que le tableau ; ce hook s'occupe du sens. Il ne couvre pas tes modifications manuelles.

- **Pourquoi compiler le MCP** : le plugin installé ne fait pas de `npm install`. Il lance directement `dist/pgadmin-mcp.js`, un fichier unique qui contient le code et toutes ses dépendances. C'est ce fichier qui est commité : s'il n'est pas recompilé, la modification n'arrive jamais chez l'utilisateur. Sans le hook, compiler à la main : `cd plugins/ia-kit/mcp/pgadmin && npm run build`.

## Règles

- On modifie **uniquement dans ce dépôt**, jamais dans un projet qui utilise le plugin (les fichiers installés sont écrasés à chaque mise à jour).
- Aucun secret dans le dépôt : utiliser des variables d'environnement (`${MON_TOKEN}`).
- Tester en local avant de push : `claude plugin marketplace add /chemin/vers/ia`.
- **Tout nouvel élément du plugin (commande, agent, MCP, hook, skill…) s'ajoute au tableau « Contenu du plugin »**, dans le même commit.
- Agents : le bloc « Règles communes » est copié à l'identique en tête de chaque agent (un agent ne voit que son propre fichier). **Le modifier dans tous les agents à la fois.** Chaque agent sert au démarrage comme pour faire évoluer ou corriger le projet ; il lit tout le projet mais ne modifie que sa partie.
