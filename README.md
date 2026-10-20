# ia-kit

Mon plugin Claude Code : skills, commandes, agents et hooks réutilisables d'un projet à l'autre.

## Installation dans un projet

Dans Claude Code :

```
/plugin marketplace add Gwendo8/ia
/plugin install ia-kit@gwendo8
```

Mettre à jour après un push :

```
/plugin marketplace update gwendo8
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
└── hooks/hooks.json              # hooks (actions automatiques)
```

## Règles

- On modifie **uniquement dans ce dépôt**, jamais dans un projet qui utilise le plugin (les fichiers installés sont écrasés à chaque mise à jour).
- Aucun secret dans le dépôt : utiliser des variables d'environnement (`${MON_TOKEN}`).
- Tester en local avant de push : `/plugin marketplace add /chemin/vers/ia`.
- Agents : le bloc « Règles communes » est copié à l'identique en tête de chaque agent (un agent ne voit que son propre fichier). **Le modifier dans tous les agents à la fois.** Chaque agent sert au démarrage comme pour faire évoluer ou corriger le projet ; il lit tout le projet mais ne modifie que sa partie.
