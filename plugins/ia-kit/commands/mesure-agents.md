---
description: Mesure ce qu'a consommé une session (conversation principale, agents et sous-agents), modèle par modèle
argument-hint: [id-de-session] [dossier-du-projet]
---

Mesure la consommation d'une session Claude Code et présente-la simplement. Arguments : $ARGUMENTS
Tout se fait en français, avec des mots simples (l'utilisateur apprend en même temps).

**Lecture seule** : le script lit les journaux de Claude Code (`~/.claude/projects`) et n'écrit rien.

## 1. Lancer la mesure

- Un argument qui ressemble à un identifiant de session (lettres, chiffres et tirets) → `--session <id>`.
- Un argument qui est un dossier → `--projet <dossier>`.
- Sans argument : la session la plus récente du projet courant, c'est-à-dire en général la conversation en cours.

```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/mesure-agents.mjs" [--session <id>] [--projet <dossier>]
```

Si `node` est introuvable, cherche-le dans `/opt/homebrew/bin` ou `~/.nvm/versions/node/*/bin`. Si le script dit qu'il ne trouve aucun journal, dis-le et demande le dossier du projet.

## 2. Présenter le résultat

1. **Un tableau par agent lancé** (et un pour la conversation principale) : chaque sous-agent, son modèle, son nombre de réponses, son contexte maximal et son coût. Garde l'arbre visible : quel agent a lancé quel sous-agent.
2. **Le total par modèle** (Opus, Sonnet, Haiku, Fable) et le total de la session.
3. **Ce qui ressort**, en quelques phrases : l'agent qui a le plus consommé, un sous-agent anormalement cher pour sa tâche, un contexte qui s'approche de l'alerte (250 000 tokens).

Rappelle en une phrase que les montants sont des **tarifs de l'API**, qui servent d'indicateur du poids de chaque modèle : le poids exact sur un quota d'abonnement n'est pas publié.

## 3. Pour comparer deux façons de faire

Si l'utilisateur compare deux essais (par exemple un agent avec délégation et un sans), mets-les côte à côte dans un même tableau : coût par modèle, total, nombre de réponses du modèle principal, contexte maximal. Rappelle qu'un seul essai de chaque côté donne une tendance, pas une preuve.
