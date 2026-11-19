---
name: erreurs
description: Note une erreur de Claude dans le journal global des erreurs, et la passe en règle permanente quand elle revient. À utiliser quand l'utilisatrice corrige Claude, quand Claude découvre une erreur qu'il a faite (corrigée seul, révélée par un test, une relecture, un audit ou un bug trouvé plus tard), ou quand le hook ia-kit le rappelle.
---

# Journal des erreurs

Le but : ne pas refaire deux fois la même erreur, dans aucun projet.

- **Journal** : `~/.claude/erreurs.md`. Toutes les erreurs vues une fois. Jamais lu en entier : on cherche dedans.
- **Règles permanentes** : section `## Erreurs à ne pas refaire` du CLAUDE.md global (`~/.claude/CLAUDE.md`), lue à chaque conversation dans tous les projets.

## 1. Est-ce vraiment une erreur à noter ?

Oui si c'est une erreur de Claude (ou un oubli) qui pourrait se reproduire : mauvaise habitude, consigne pas suivie, vérification sautée, mauvaise supposition. Ça compte aussi quand l'erreur date d'une conversation précédente et se découvre seulement maintenant (un bug dans du code que Claude a écrit, un point relevé par l'auditeur) : la date notée est celle de la découverte.
Non si c'est une simple préférence nouvelle (elle va dans la mémoire habituelle), un bug du code de l'utilisatrice, ou un désaccord sans erreur. Dans ce cas, s'arrêter là sans rien dire.

## 2. Chercher si elle existe déjà

1. Choisir 2 ou 3 mots-clés qui décrivent l'erreur de façon générale (ex. : `tests`, `commit`, `base de données`).
2. Chercher dans `~/.claude/CLAUDE.md`, section « Erreurs à ne pas refaire », puis dans le journal, avec une recherche (Grep), sans lire les fichiers en entier. Essayer un synonyme si rien ne sort.

## 3. Agir selon le résultat

**Absente partout** → ajouter une ligne au journal, sous le bon thème (créer le fichier ou le thème s'il manque), au format :

```
- AAAA-MM-JJ | projet | mots-clés | ce qui s'est passé, en une phrase
```

**Déjà dans le journal, ligne écrite pendant la conversation en cours** → elle se répète sur la lancée, ce n'est pas encore une habitude. Compléter la ligne existante (« revue le même jour ») et en rester là.

**Déjà dans le journal, ligne écrite dans une autre conversation** (elle revient vraiment) →
1. Avant d'écrire, regarder si une règle existante de la section dit déjà la même chose avec d'autres mots. Si oui, l'élargir (un exemple de plus, une date de plus) plutôt que d'ajouter une ligne.
2. Sinon, l'ajouter au CLAUDE.md global, section `## Erreurs à ne pas refaire` (la créer en fin de fichier si elle manque), en une ligne écrite en positif, avec le pourquoi :
   `- **Thème** : ce qu'il faut faire. Pourquoi : … (vue le AAAA-MM-JJ et le AAAA-MM-JJ)`
3. Supprimer sa ligne du journal : la règle prend le relais.

Exception : si l'erreur ne peut arriver que dans un seul projet (nom de table, chemin propre à ce projet), la mettre dans la mémoire de ce projet plutôt que dans le CLAUDE.md global.

**Déjà dans « Erreurs à ne pas refaire »** (elle revient malgré la règle) → ne rien écrire. Prévenir l'utilisatrice et proposer un hook qui l'empêche automatiquement. Attendre son accord avant de le créer.

## 4. Le dire

Toujours une phrase à l'utilisatrice, à la fin de la réponse : quelle erreur, et ce qui a été fait (notée dans le journal, passée en règle, ou hook proposé).

## Modèle du journal (à la création)

```markdown
# Journal des erreurs de Claude

Une ligne par erreur vue une fois. Quand une erreur revient, elle passe dans
« Erreurs à ne pas refaire » de ~/.claude/CLAUDE.md et sa ligne est retirée d'ici.
Format : - date | projet | mots-clés | ce qui s'est passé

## Git

## Tests et vérifications

## Base de données

## Code

## Communication et consignes

## Autre
```
