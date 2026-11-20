---
description: Ménage mensuel de la mémoire — repère ce qui est périmé, en double, contradictoire ou trop long, et propose les corrections
---

Fais le **ménage de la mémoire** de l'utilisatrice. Tout se fait en français, avec des mots simples.
Tu proposes, elle décide : aucune modification sans son accord, point par point.

## 1. Lire

- `~/.claude/CLAUDE.md` (consignes globales, lues dans chaque conversation) ;
- `~/.claude/erreurs.md` (journal des erreurs vues une fois) ;
- la mémoire du projet en cours : le dossier `memory/` de ce projet dans `~/.claude/projects/` (son `MEMORY.md` et ses notes) ;
- le `CLAUDE.md` du projet en cours, s'il existe.

Ces fichiers sont courts : lis-les toi-même en entier.

## 2. Chercher les problèmes

| Problème | Comment le repérer |
| --- | --- |
| **Périmé** | Une info qui n'est plus vraie : fichier, commande, outil ou réglage cité qui n'existe plus (vérifie-le), choix remplacé depuis, date ancienne sur un fait qui bouge. |
| **À revérifier** | Un fait marqué « supposé », ou facile à contrôler (version d'un outil, chemin, programme installé, fichier cité) : vérifie-le maintenant dans la réalité (commande, fichier). Vrai → note « vérifié le AAAA-MM-JJ » ; faux → propose la correction ; invérifiable par toi (une préférence, un fait que seule l'utilisatrice connaît) → pose-lui la question. Un fait sans source ni certitude : propose d'en ajouter une. |
| **Doublon** | La même règle à deux endroits (mémoire et CLAUDE.md, deux notes, deux sections). |
| **Contradiction** | Deux règles qui demandent l'inverse. |
| **À fusionner** | Plusieurs règles qui disent au fond la même chose avec d'autres mots : une règle générale avec des exemples est plus courte et couvre aussi les cas nouveaux. |
| **Mal rangé** | Une note de projet valable partout (→ CLAUDE.md global), ou une règle du CLAUDE.md global qui ne concerne qu'un projet (→ mémoire de ce projet). |
| **Trop long** | Le CLAUDE.md global est lu en entier dans chaque conversation : signale sa taille en lignes et les règles les plus longues à raccourcir. |
| **Journal** | Une ligne de plus de 3 mois jamais revenue : proposer de la supprimer (c'était sans doute un accident). Une ligne qui en répète une autre : proposer de les regrouper. |

## 3. Proposer

Présente un tableau numéroté : le fichier, le problème, ce que tu proposes (mettre à jour, fusionner, déplacer, supprimer), et pourquoi en une phrase. Pour une fusion ou une réécriture, montre la nouvelle version.
Termine par la taille actuelle du CLAUDE.md global et celle qu'il aurait après tes propositions.
Si rien n'est à corriger, dis-le en une phrase.

## 4. Appliquer et noter la date

1. Applique seulement les points qu'elle accepte. Une règle réécrite se formule en positif, sans trace de l'ancienne version. Dans la mémoire du projet, garde `MEMORY.md` à jour (une ligne par note, rangée par section).
2. À la fin, même si rien n'a changé, écris la date du jour dans `~/.claude/menage-memoire.json` : `{"dernier": "AAAA-MM-JJ"}`. Le hook `rappel-menage` s'en sert pour rappeler le prochain ménage dans un mois.
3. Si d'autres projets ont une mémoire (dossiers `~/.claude/projects/*/memory/`), cite-les et propose de refaire le ménage depuis ces projets.
