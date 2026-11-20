# ia-kit

Mon plugin Claude Code : skills, commandes, agents et hooks réutilisables d'un projet à l'autre.

🗺️ **[Voir la carte du plugin](https://gwendo8.github.io/ia/carte.html)** : tout ia-kit d'un coup d'œil (agents, commandes, outils, gardiens). Elle est refaite à chaque commit par `.githooks/pre-commit` et mise en ligne par GitHub Pages à chaque push.

## Utilisation

### Installer (une fois par ordinateur, Mac comme Windows)

Dans un terminal :

```bash
claude plugin marketplace add Gwendo8/ia
claude plugin install ia-kit@gwendo8
```

> ⚠️ `/plugin` ne marche pas dans l'extension VS Code : toujours passer par `claude plugin ...` dans un terminal.

**Où le plugin est actif (la « portée »)** : par défaut, il s'installe pour **tous tes projets** de l'ordinateur (portée `user`), sans rien à refaire projet par projet. Les commandes ne se lancent que si tu les tapes, et les hooks de synchro ne font rien sans `PROJET.md` et celui de surveillance ne concerne que les agents `back`, `front` et `auditeur` : il ne gêne donc pas les autres projets. Le hook `reperage-erreurs`, lui, est actif partout, et c'est voulu : une erreur peut revenir dans n'importe quel projet. Deux autres portées existent, à installer depuis le dossier du projet :

| Portée | Où il est actif | Pour qui |
| --- | --- | --- |
| `user` (par défaut) | Tous tes projets | Toi seule |
| `project` (`--scope project`) | Ce projet seulement | Toi et quiconque récupère le projet (noté dans `.claude/settings.json`, versionné) |
| `local` (`--scope local`) | Ce projet seulement | Toi seule, sans partage |

Pour démarrer un nouveau projet : ouvre un terminal dans son dossier, lance `claude`, puis `/ia-kit:chef`. Si l'idée est encore floue, commence par `/ia-kit:cahier-des-charges <ton idée>` : il en discute avec toi et écrit `CAHIER-DES-CHARGES.md`, que tu donnes ensuite au chef (`/ia-kit:chef CAHIER-DES-CHARGES.md`).

Pour reprendre un projet en cours (nouvelle conversation entre deux étapes) : `/clear` puis `/ia-kit:chef`. Le chef lit `PROJET.md`, résume où on en est et continue à l'étape suivante, sans refaire le cadrage.

Prérequis : **Node.js 22.13 ou plus** (le MCP pgadmin en a besoin) et, pour ce MCP, **pgAdmin** installé avec ses serveurs enregistrés.

Le plugin n'a pas de numéro de version dans `plugin.json` : Claude Code prend le code du dernier commit (le SHA), donc chaque push est une nouvelle version, sans rien à changer à la main.

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
| `/chef` | commande | Chef de projet : cadre un nouveau projet, découpe le travail et dirige les agents spécialistes, et reprend un projet en cours depuis `PROJET.md`. Si le projet sort de la stack habituelle (autre langage), s'arrête et décide avec toi avant de lancer squelettes ou agents. Choisit pour chaque étape qui fait le travail (son agent ou lui-même) avec la règle `regles/qui-fait-le-travail.md`, et quand il le fait lui-même, applique en entier le fichier de l'agent. Découpe les étapes longues (`back`, `front`, `auditeur`) en blocs, un agent par bloc. Crée le `README.md` du projet au cadrage (page d'accueil du dépôt) et le relit à la livraison. Commite lui-même chaque étape validée (lint et tests verts avant), jamais de push. |
| `/squelette-client` | commande | Crée le squelette du client (React + Vite + Tailwind). Arguments : `[nom-du-projet] [mono\|separe]`. |
| `/squelette-server` | commande | Crée le squelette du serveur (Node.js + Express + Sequelize). Mêmes arguments. |
| `/bdd` | commande | Lance le spécialiste base de données directement dans la conversation. |
| `/back` | commande | Lance le spécialiste API directement dans la conversation. |
| `/design` | commande | Lance le designer directement dans la conversation. |
| `/front` | commande | Lance le spécialiste front-end directement dans la conversation. |
| `/auditeur` | commande | Lance un audit complet ou ciblé directement dans la conversation. |
| `/etat-serveur` | commande | Bilan de santé d'un serveur Linux joignable en SSH : services, disque, mémoire, température, mises à jour, erreurs des dernières 24 h, adresse publique. Lecture seule : ne modifie rien, ne lance aucun `sudo`. Argument : `[hôte-ssh]` (par défaut `maison`). |
| `/mesure-agents` | commande | Mesure ce qu'a consommé une session : la conversation principale, chaque agent et ses sous-agents, modèle par modèle (Opus, Sonnet, Haiku), avec le contexte maximal et un équivalent en tarif API. Sert à vérifier qu'un réglage (délégation, blocs…) fait vraiment gagner du quota. Lecture seule. Arguments : `[id-de-session] [dossier-du-projet]`, par défaut la conversation en cours. |
| `/menage-memoire` | commande | Ménage mensuel de la mémoire : relit ton `~/.claude/CLAUDE.md`, le journal des erreurs et la mémoire du projet, revérifie les faits supposés ou faciles à contrôler, repère ce qui est périmé, en double, contradictoire, mal rangé ou trop long, et propose les corrections. Ne modifie rien sans ton accord, point par point. |
| `bdd` | agent | Conçoit le schéma avec toi, puis crée la base, les migrations et les modèles (PostgreSQL + Sequelize). |
| `back` | agent | Définit le contrat de l'API avec toi, puis code les routes, la logique et les tests. |
| `design` | agent | Recherche l'inspiration ciblée sur le projet, te propose trois variantes, puis écrit `DESIGN.md` et les maquettes Figma. Gère aussi les refontes. |
| `front` | agent | Présente son plan avec toi, puis code les écrans React d'après `DESIGN.md`, les maquettes Figma et `API.md`, avec tests et vérification visuelle. |
| `auditeur` | agent | Passe le projet en revue (sécurité, cohérence, qualité, tests, performance, accessibilité), écrit `AUDIT.md` et les tests de bout en bout. Ne corrige pas : indique quel agent doit corriger. |
| `chercheur` | agent | Petit agent en lecture seule, sur Haiku : trouve des fichiers, collecte et extrait des informations, et rend des résultats avec chemin et numéro de ligne. Lancé par la session principale, le chef ou les autres agents pour leurs recherches larges. |
| `pgadmin` | MCP | Lit les bases PostgreSQL à partir des serveurs de pgAdmin (voir ci-dessous). |
| `playwright` | MCP | Navigateur invisible et isolé (jamais ton vrai Chrome) : les agents `design`, `front` et `auditeur` s'en servent pour regarder des pages en capture d'écran (inspiration, vérification des écrans). |
| `projet-sync` | hooks | Gardent `PROJET.md` à jour tout seuls : en début de conversation (rattrape tes modifications manuelles), à la fin de chaque demande qui a modifié le projet, et à chaque commit (Claude met `PROJET.md` à jour et l'ajoute au même commit). Ne font rien dans un projet sans `PROJET.md`. Script : `templates/commun/.husky/projet-sync.sh` (copié dans chaque projet par les squelettes). |
| `surveillance-contexte` | hooks | Prévient les agents `back`, `front` et `auditeur` quand leur contexte dépasse 250 000 tokens (ils relisent tout à chaque réponse, donc consomment beaucoup de quota) : ils terminent la fonctionnalité en cours, mettent `PROJET.md` à jour et rendent la main au chef, qui lance un agent neuf. Script : `hooks/surveillance-contexte.mjs`. |
| `reperage-erreurs` | hooks | Quand ton message ressemble à une correction (« tu as oublié », « c'est faux », « ça marche pas »…), rappelle à Claude de vérifier s'il a fait une erreur à noter avec le skill `erreurs`. Sans mot repéré, ne fait rien. Script : `hooks/reperage-erreurs.mjs`. |
| `rappel-menage` | hooks | Au lancement d'une conversation, si le dernier `/menage-memoire` date de plus de 30 jours, demande à Claude de te le rappeler en une phrase (une fois par jour au plus). Date gardée dans `~/.claude/menage-memoire.json`. Script : `hooks/rappel-menage.mjs`. |
| `meme-modele` | hooks | Avant de lancer un agent ia-kit, compare son modèle à celui de la conversation : si c'est le même, te demande de confirmer (l'agent repartirait de zéro pour le même résultat, règle `regles/qui-fait-le-travail.md`). Agent moins cher ou plus cher : ne fait rien. Script : `hooks/meme-modele.mjs`. |
| `erreurs` | skill | Journal global des erreurs de Claude (`~/.claude/erreurs.md`) : une erreur vue une fois y est notée ; si elle revient, elle devient une règle dans la section « Erreurs à ne pas refaire » de ton `~/.claude/CLAUDE.md` et quitte le journal ; si elle revient malgré la règle, Claude propose un hook. Seul skill du plugin : ici on veut justement qu'il se déclenche sans qu'on y pense (ailleurs, on préfère les commandes). |

**Commande ou agent ?** La commande (`/bdd`) fait travailler la conversation en cours, en dialogue direct avec toi. L'agent (`bdd`) est appelé par `/chef` et travaille dans son coin, puis lui rend compte. C'est le même fichier d'instructions dans les deux cas.

**Quel modèle ?** `front` et `back` (agents et commandes `/front` et `/back`) tournent sur **Sonnet**, car ils représentent l'essentiel de la consommation d'un projet (environ 77 % des tokens sur Platine) et que leur travail est surtout du code. Les autres (`bdd`, `design`, `auditeur`, agents et commandes) tournent sur **Opus**, là où le jugement compte le plus (schéma, créativité, détection de failles). Un petit agent en lecture seule fait les recherches larges à leur place : `chercheur` sur **Haiku** (trouver, collecter, extraire), presque gratuit. Mesuré sur Platine (audit cohérence et qualité, ~18 500 lignes) : avec le `chercheur`, l'audit a coûté à peu près autant qu'Opus seul (3,28 $ contre 3,43 $ en tarif API, dont 0,06 $ pour deux `chercheur`), mais le contexte d'Opus est resté à 187 000 tokens au lieu de 238 000, loin de l'alerte. Le vrai gain de la délégation est donc la place gardée dans le contexte, pas le quota. Comprendre du code reste le travail de l'agent lui-même : sur Platine, le confier à un sous-agent Sonnet coûtait plus de quota que de le lire soi-même. Ce même essai a montré qu'un agent qui lit moins juge moins bien : l'auditeur juge donc les rôles des couches sur le corps des fonctions, pas sur les imports seuls. Les spécialistes, le chef et la session principale le lancent pour toute recherche large (règle commune 13 des agents), gardent pour eux la réflexion, la décision et l'écriture du code (pour une modification, le `chercheur` trouve les endroits concernés, puis l'agent lit lui-même seulement ces passages, car l'outil de modification exige qu'il ait lu le fichier), et relisent eux-mêmes les passages qui fondent une décision, car un petit modèle peut rater un fichier ou mal résumer. Le seuil : déléguer dès qu'une tâche demande de lire plus d'environ 1 000 lignes sans les modifier. En dessous, lancer un agent consommerait plus que la lecture (sur Platine, une vérification de 800 lignes a coûté à peu près autant déléguée que lue directement ; estimation à ajuster après un audit complet). Le modèle est fixé dans chaque fichier, il ne dépend pas de celui de ta session. Pour changer : la ligne `model:` en tête du fichier de l'agent (et de la commande correspondante). Pour une commande, le réglage ne vaut que pour la réponse qui suit son lancement (documentation de Claude Code, vérifié le 2026-11-18) : la conversation reprend ensuite le modèle de la session. C'est voulu : avec chaque commande de spécialiste, la conversation réfléchit et décide avec toi sur le modèle de ta session, puis compare ce modèle à celui de l'agent. Agent moins cher (session Opus, `front` ou `back` sur Sonnet) : elle fait les petites modifications et confie un gros travail à l'agent avec un brief précis, puis relit son résultat avant le commit. Même modèle : elle fait tout elle-même, l'agent devrait tout relire pour rien. Agent plus cher (session Sonnet, `bdd`, `design` ou `auditeur` sur Opus) : elle juge, et confie à l'agent le gros travail où le jugement compte. Elle te dit à chaque fois ce qu'elle a choisi. Cette règle est écrite une seule fois, dans `plugins/ia-kit/regles/qui-fait-le-travail.md` : chaque commande de spécialiste contient seulement une ligne qui renvoie vers ce fichier, et le hook `pre-commit` bloque une commande qui l'oublierait (une nouvelle commande est donc vérifiée d'office).

**Pourquoi des blocs ?** Un agent relit toute sa conversation à chaque réponse : plus elle s'allonge, plus il consomme de quota. Pour `back`, `front` et `auditeur`, le chef découpe donc le travail restant, une fois le plan ou le contrat validé, en blocs d'environ 50 appels (250 000 tokens de contexte) : 3 à 5 écrans, 2 ou 3 groupes de routes, ou un axe d'audit. Chaque bloc a son agent, qui repart de `PROJET.md` et de la note de passage laissée par le précédent. Les agents gardent aussi leur contexte léger : lecture partielle des gros documents, sorties longues dans un fichier, une seule passe de captures par bloc.

**Le MCP pgadmin** donne à Claude quatre outils : `lister_serveurs`, `lister_bases`, `decrire_base` et `requete`.

- Il lit la liste des serveurs dans pgAdmin (sans jamais la modifier ni lire les mots de passe).
- Les mots de passe viennent du fichier standard de PostgreSQL : `~/.pgpass` (Mac) ou `%APPDATA%\postgresql\pgpass.conf` (Windows). En local, souvent inutile.
- **Lecture seule partout**, sauf sur une base de test : nom en `_test` **et** serveur local.
- Si pgAdmin est rangé ailleurs que d'habitude, indiquer le chemin de `pgadmin4.db` dans la variable d'environnement `PGADMIN_DB`.

**Les hooks en node passent par `hooks/node.sh`.** Sur Mac, une application lancée depuis le Dock (VS Code, Cursor) ne lit pas `~/.zshrc` : son PATH ne contient ni Homebrew ni nvm, et `node` y est introuvable. Le lanceur cherche `node` dans le PATH, puis dans nvm (la version du `.nvmrc` du projet si elle est installée, sinon la plus récente), puis dans Homebrew. Sans `node`, il se tait, pour ne jamais bloquer le travail. Le pre-commit du dépôt le charge aussi, pour trouver `node` et `npm`.

**Le hook surveillance-contexte** tourne après chaque appel d'outil d'un agent `back`, `front` ou `auditeur` (jamais pour la session principale ni pour les autres agents).

- **Mesure** : il lit dans le fichier de session de l'agent la taille de son contexte à sa dernière réponse. Ce format n'est pas garanti par Claude Code : si le fichier est illisible, il compte les appels d'outils et prévient à 50.
- **Message** : au seuil, il ajoute à côté du résultat d'outil un message qui demande à l'agent de finir sa fonctionnalité, de mettre `PROJET.md` à jour et de rendre son compte rendu avec ce qui reste à faire. Il le répète tous les 10 appels si l'agent continue. Les agents savent que ce message est légitime (section « Garder un contexte léger » de leur fichier).
- **Réglage** : `IA_KIT_SEUIL_CONTEXTE` (250 000 par défaut) et `IA_KIT_SEUIL_APPELS` (50, pour le repli), à poser dans l'environnement avant de lancer `claude`.
- Il ne bloque jamais rien : en cas d'erreur, il se tait.

**Le journal des erreurs** (hook `reperage-erreurs` + skill `erreurs`) sert à ne pas refaire deux fois la même erreur, quel que soit le projet.

- **Le réveil** : un hook ne comprend pas le sens d'un message. Il cherche des tournures typiques d'une correction (des tournures entières plutôt que des mots seuls comme « non » ou « erreur », qui déclencheraient pour rien) et, s'il en trouve, glisse un rappel d'une ligne à Claude, qui juge si c'est vraiment une erreur. Les erreurs que Claude découvre lui-même (corrigées seul, révélées par un test, un audit, un bug trouvé plus tard) passent par une consigne du `~/.claude/CLAUDE.md` global (« dis-le et note-la »), car aucun hook ne peut les repérer.
- **Les paliers** : journal (vue une fois) → règle dans le CLAUDE.md global (revenue dans une autre conversation ; répétée dans la même, elle reste au journal) → hook proposé (revenue malgré la règle). Avant d'ajouter une règle, Claude regarde si une règle existante dit déjà la même chose, pour l'élargir plutôt qu'en ajouter une.
- **Le ménage** : `/menage-memoire`, rappelé chaque mois par le hook `rappel-menage`, fusionne les règles qui se ressemblent, retire les lignes du journal jamais revenues, et fait respecter un **plafond de 10 règles** dans « Erreurs à ne pas refaire », chacune en une ou deux phrases (au-delà, une règle n'entre qu'en en fusionnant ou en retirant une autre).
- **Coût** : le journal n'est jamais lu au démarrage, Claude cherche dedans seulement quand une erreur arrive. Seules les erreurs passées en règle sont lues à chaque conversation (une ligne chacune).
- Le journal et la section « Erreurs à ne pas refaire » vivent dans `~/.claude/`, hors du dépôt : ils sont propres à chaque ordinateur.

**Le hook meme-modele** tourne avant chaque lancement d'agent (outil `Agent`), seulement pour les agents ia-kit.

- **Modèle de la conversation** : lu dans son fichier de session (dernière réponse). **Modèle de l'agent** : celui demandé au lancement, sinon la ligne `model:` de son fichier (`inherit` = même modèle que la conversation).
- **Même famille** (Opus et Opus, Sonnet et Sonnet…) : fenêtre de confirmation, avec la raison. Tu acceptes si tu veux vraiment cet agent ; sinon Claude fait le travail lui-même.
- Il ne bloque jamais à tort : modèle introuvable ou inconnu, erreur → il se tait. C'est le palier 3 du journal des erreurs : la règle seule n'avait pas suffi (agent `bdd` lancé depuis une conversation Opus sur Mijote).

**Les hooks projet-sync** gardent `PROJET.md` (la carte du projet) à jour, même après tes modifications à la main.

- **Point de synchro** : la dernière ligne de `PROJET.md` est un commentaire invisible qui contient une empreinte git de tous les fichiers au moment de la dernière mise à jour. Le script compare le projet à cette empreinte pour savoir ce qui a changé, que ce soit commité ou non. Ne pas modifier cette ligne.
- **Début de conversation** : s'il y a eu des changements depuis, Claude en reçoit la liste et met `PROJET.md` à jour. Il demande le pourquoi d'une modification manuelle au lieu de l'inventer, et pose aussi les questions laissées en attente (« ❓ à demander »).
- **Fin de chaque demande** : si du code a changé sans que `PROJET.md` suive, Claude est relancé **une seule fois** pour le mettre à jour. Si rien n'a changé, rien ne se passe (aucun coût).
- **Commit** (pre-commit Husky du projet) : si `PROJET.md` n'a pas suivi, le script lance `claude -p`, qui le met à jour (une quinzaine de secondes), puis l'ajoute au même commit. Une raison inconnue devient « ❓ à demander ». Si Claude est indisponible, le commit est bloqué (contournement : `git commit --no-verify`).
- **Tout le monde peut écrire `PROJET.md`** (chef, agents, toi) : on relit juste avant d'écrire et on ne touche qu'à ce qui concerne son travail. En dépôts séparés, chaque dépôt a son propre `PROJET.md`.
- Ignorés : `PROJET.md` lui-même, les fichiers de verrouillage et tout ce que `.gitignore` exclut (`node_modules`, `dist`, `.env`…). Le `claude -p` du commit tourne avec `IA_KIT_SYNC_OFF=1`, pour ne pas redéclencher les hooks en boucle.
- **Projet créé avant ces hooks** : les hooks de conversation marchent déjà. Pour le commit, copier `templates/commun/.husky/projet-sync.sh` dans le `.husky/` du projet et ajouter la ligne `sh .husky/projet-sync.sh commit` à `.husky/pre-commit`. Pour commiter depuis VS Code ou Cursor ouvert par le Dock (PATH réduit, `npx: command not found`), copier aussi `templates/commun/.husky/path.sh` et mettre `. .husky/path.sh` en première ligne de `.husky/pre-commit`.

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
├── .claude-plugin/plugin.json    # infos du plugin (nom, description…)
├── skills/<nom>/SKILL.md         # skills, utilisés automatiquement par Claude (erreurs)
├── commands/<nom>.md             # commandes /slash
├── agents/<nom>.md               # sous-agents
├── scripts/                      # scripts lancés par les commandes (mesure-agents.mjs)
├── templates/                    # modèles copiés par /squelette-client et /squelette-server
│                                 #   (commun/.husky/projet-sync.sh = script des hooks projet-sync)
│                                 #   (commun/.husky/commit-msg = retire Co-Authored-By Claude des commits)
│                                 #   (commun/.husky/path.sh = retrouve node, npx et claude quand le PATH est réduit)
├── .mcp.json                     # déclare les serveurs MCP du plugin
├── mcp/pgadmin/                  # code du MCP pgadmin (dist/ = version compilée, commitée)
└── hooks/                        # hooks (actions automatiques)
    ├── hooks.json                #   déclaration des hooks
    ├── node.sh                   #   lanceur : trouve node même quand le PATH est réduit
    ├── surveillance-contexte.mjs #   script du hook surveillance-contexte
    ├── reperage-erreurs.mjs      #   script du hook reperage-erreurs
    ├── rappel-menage.mjs         #   script du hook rappel-menage
    └── meme-modele.mjs           #   script du hook meme-modele
```

## Développer

- **Activer les hooks git** (une fois par poste où on développe) :

  ```bash
  git config core.hooksPath .githooks
  ```

  (Ce sont les hooks git **de ce dépôt**, pour développer le plugin ; à ne pas confondre avec les hooks projet-sync, qui tournent dans tes projets.)
  Le hook `pre-commit` fait alors quatre choses avant chaque commit :
  - il **bloque** le commit si le tableau « Contenu du plugin » ne correspond plus au plugin, dans les deux sens : élément (commande, agent, skill, MCP, hooks) sans sa ligne, ou ligne d'un élément supprimé (script `.githooks/verifier-readme.js`) ;
  - il **bloque** le commit si un agent n'a pas le bloc « Règles communes » ou si ce bloc n'est plus identique dans tous les agents. Seuls les agents de lecture (aujourd'hui le `chercheur`) en sont dispensés : ils sont listés dans la variable `AGENTS_LECTURE` du hook. Un nouvel agent est donc vérifié d'office ; pour un nouvel agent de lecture, ajouter son nom à cette liste (le hook le rappelle s'il bloque) ;
  - il **bloque** le commit si une commande de spécialiste (elle fait appliquer un agent « directement dans cette session ») ne renvoie pas vers `regles/qui-fait-le-travail.md`, la règle commune qui dit quand la conversation fait le travail elle-même et quand elle le confie à l'agent ;
  - si le code du MCP pgadmin a changé, il **relance la compilation** (`npm run build`) et ajoute `dist/` au commit.

- **Hook Claude de ce dépôt** (`.claude/settings.json`, actif tout seul quand Claude travaille ici) : à la fin d'une demande où Claude a modifié des fichiers du plugin sans toucher au README, il est relancé une fois pour vérifier que le README décrit toujours la réalité (descriptions, structure, explications). Le pre-commit ne vérifie que le tableau ; ce hook s'occupe du sens. Il ne couvre pas tes modifications manuelles.

- **Pourquoi compiler le MCP** : le plugin installé ne fait pas de `npm install`. Il lance directement `dist/pgadmin-mcp.js`, un fichier unique qui contient le code et toutes ses dépendances. C'est ce fichier qui est commité : s'il n'est pas recompilé, la modification n'arrive jamais chez l'utilisateur. Sans le hook, compiler à la main : `cd plugins/ia-kit/mcp/pgadmin && npm run build`.

## Règles

- On modifie **uniquement dans ce dépôt**, jamais dans un projet qui utilise le plugin (les fichiers installés sont écrasés à chaque mise à jour).
- Aucun secret dans le dépôt : utiliser des variables d'environnement (`${MON_TOKEN}`).
- Tester en local avant de push : `claude plugin marketplace add /chemin/vers/ia`.
- **Tout nouvel élément du plugin (commande, agent, MCP, hook, skill…) s'ajoute au tableau « Contenu du plugin »**, dans le même commit.
- Agents : le bloc « Règles communes » est copié à l'identique en tête de chaque agent (un agent ne voit que son propre fichier). **Le modifier dans tous les agents à la fois.** Chaque agent sert au démarrage comme pour faire évoluer ou corriger le projet ; il lit tout le projet mais ne modifie que sa partie.
