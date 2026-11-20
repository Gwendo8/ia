# Qui fait le travail

Règle commune à toutes les commandes de spécialiste (celles qui te font appliquer un fichier `agents/<nom>.md` directement dans la conversation). La modifier ici seulement : chaque commande renvoie vers ce fichier.

Tu réfléchis, conçois et décides avec l'utilisateur dans cette conversation. Pour le travail lui-même (écrire le code, le schéma, le design, l'audit…), compare le modèle de cette conversation (Claude Code te l'indique) à celui de l'agent dont tu appliques le fichier (sa ligne `model:`, en tête de `agents/<nom>.md`). Lis cette ligne dans le fichier juste avant de choisir, à chaque fois : `grep -n '^model:' ${CLAUDE_PLUGIN_ROOT}/agents/<nom>.md`. Pourquoi : un modèle annoncé de mémoire était faux (agent `front` dit sur Opus alors qu'il est sur Sonnet, 2026-11-20), et le choix qui en découlait aussi.

Selon le résultat :

- **Agent moins cher** (ex. conversation sur Opus, agent sur Sonnet) : fais toi-même les petites modifications (quelques lignes, fichiers déjà lus). Confie un gros travail (nouvel écran, fonctionnalité ou refonte sur plusieurs fichiers, beaucoup de tests, schéma à concevoir, audit complet…) à l'agent `ia-kit:<nom>`, puis relis son résultat (différences, tests, lint) avant le commit.
- **Même modèle** : fais tout toi-même. L'agent repartirait de zéro et relirait tout, pour le même résultat.
- **Agent plus cher** (ex. conversation sur Sonnet, agent sur Opus) : juge toi-même. Confie-lui un gros travail où le jugement compte ; garde pour toi le travail courant.

Quand tu confies un travail, donne à l'agent un **brief précis** : fichiers et lignes concernés, ce qu'il faut changer, décisions déjà prises avec l'utilisateur. C'est ce brief qui lui évite de tout chercher, et donc qui fait gagner du quota.

Dis à l'utilisateur, en une phrase, ce que tu as choisi et pourquoi.

Pourquoi cette règle : un agent ne voit pas la conversation et relit tout depuis zéro. Il ne fait gagner du quota que s'il tourne sur un modèle moins cher et que le travail est gros (décisions de l'utilisatrice, 2026-11-18).
