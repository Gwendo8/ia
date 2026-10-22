---
description: Crée le squelette du client (React + Vite + Tailwind) d'un projet
argument-hint: [nom-du-projet] [mono|separe]
---

Crée le squelette **client** d'un projet à partir des modèles du plugin. Arguments : $ARGUMENTS
Tout se fait en français, en expliquant simplement chaque étape (l'utilisateur apprend en même temps).

Modèles : `${CLAUDE_PLUGIN_ROOT}/templates/` (`client/`, `commun/`, `mono/`). Ne réécris pas leur contenu à la main : copie-les, c'est ce qui garantit une structure identique d'un projet à l'autre.

## 1. Rassembler les infos

- **Nom du projet**, en kebab-case (`mon-projet`).
- **Organisation** :
  - `mono` : un seul dépôt, le code va dans `client/` (et le serveur dans `server/`) ;
  - `separe` : un dépôt par partie, le code va directement à la racine du dossier courant.

Si `/chef` t'a lancé, il te donne ces deux infos. Sinon, prends-les dans les arguments, et demande ce qui manque **avant de toucher à quoi que ce soit**.

La **racine** est le dossier courant. La **destination** est `client/` en mono, la racine en séparé.

## 2. Vérifier avant de commencer

- `node -v` doit donner la version majeure de `templates/commun/.nvmrc` (sinon : `nvm install` puis `nvm use` dans la racine, après avoir copié `.nvmrc`). `git` doit être installé.
- La destination doit être vide ou absente. En séparé, seuls `.git/`, `CLAUDE.md`, `PROJET.md` et `README.md` sont tolérés. Sinon, **arrête-toi** et montre à l'utilisateur ce qui s'y trouve.

## 3. Copier le modèle

```bash
cp -R "${CLAUDE_PLUGIN_ROOT}/templates/client/." <destination>/
grep -rl __NOM_PROJET__ <destination> | xargs perl -pi -e 's/__NOM_PROJET__/<nom>/g'
```

## 4. Fichiers communs à la racine

Copie chaque fichier de `templates/commun/` à la racine **seulement s'il n'existe pas déjà** (le squelette serveur a pu passer avant). N'écrase jamais un fichier existant.
- `gitignore` est copié sous le nom **`.gitignore`** (sans point dans le plugin, sinon git l'appliquerait au plugin lui-même) ;
- `.prettierrc.json`, `.prettierignore`, `.nvmrc`, `.husky/pre-commit` et `.husky/projet-sync.sh` (appelé par `pre-commit` : sans lui, tout commit échoue).

Puis, selon l'organisation :
- **mono** : copie aussi `templates/mono/package.json` (en remplaçant `__NOM_PROJET__`) et `templates/mono/.lintstagedrc.json`, s'ils n'existent pas.
- **separe** : ajoute à `package.json` les scripts et outils de `templates/mono/package.json` (Husky, lint-staged, Prettier) :
  ```bash
  node -e "const fs=require('fs');const m=require('${CLAUDE_PLUGIN_ROOT}/templates/mono/package.json');const p=JSON.parse(fs.readFileSync('package.json'));p.scripts={...m.scripts,...p.scripts};p.devDependencies={...p.devDependencies,...m.devDependencies};fs.writeFileSync('package.json',JSON.stringify(p,null,2)+'\n')"
  ```

## 5. Installer

1. Si la racine n'a pas de `.git/` : `git init` (Husky en a besoin).
2. **mono** : `npm install` à la racine, puis dans `client/`. **separe** : `npm install` à la racine.
   Les versions du modèle bloquent la version majeure (`^19.0.0`) : npm installe la dernière version compatible.
3. Pas de `.env` à créer : par défaut, le front appelle `/api`, que Vite redirige vers le serveur local (`localhost:3000`). `.env.example` explique comment viser une autre adresse.

## 6. Vérifier que tout marche

Dans la destination :
- `npm run lint`, `npm test` et `npm run build` passent ;
- `npx prettier --check .` (depuis la racine) ne signale rien.

Si une vérification échoue, montre l'erreur et corrige avant de continuer. Ne dis jamais que c'est bon sans l'avoir constaté.

## 7. Récapituler

- Ce qui a été créé et où (renvoie au `README.md` du client pour l'organisation par domaine et les règles).
- Comment lancer : `npm run dev` → http://localhost:5173. La page d'accueil affiche « API connectée » si le serveur tourne, « API injoignable » sinon.
- **Ne commite pas et ne pousse jamais** (pas de `git push`, pas de dépôt distant ajouté) : propose un message de commit et laisse l'utilisateur le faire.
