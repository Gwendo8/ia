#!/bin/sh
# Hook Stop de ce dépôt : quand Claude a modifié des fichiers du plugin pendant une demande et que
# le README n'a pas bougé, il est relancé une fois pour vérifier que le README décrit toujours la réalité
# (descriptions du tableau, structure, explications). Le pre-commit, lui, ne vérifie que le tableau.
#
# Dernier état vu : .git/ia-kit-readme-synchro (local, non versionné) = empreinte des fichiers + du README.

cd "${CLAUDE_PROJECT_DIR:-.}" || exit 0
MARQUE=$(git rev-parse --git-path ia-kit-readme-synchro) || exit 0

# Empreinte de l'état actuel des fichiers (commités ou non), via un index temporaire.
TMP=$(mktemp)
cp "$(git rev-parse --git-path index)" "$TMP" 2>/dev/null || rm -f "$TMP"
GIT_INDEX_FILE=$TMP git add -A . >/dev/null 2>&1
ARBRE=$(GIT_INDEX_FILE=$TMP git write-tree)
rm -f "$TMP"
README=$(git hash-object README.md)

memoriser() { echo "$ARBRE $README" > "$MARQUE"; }

# Première fois : on part du dernier commit.
[ -f "$MARQUE" ] || echo "$(git rev-parse 'HEAD^{tree}') $README" > "$MARQUE"
read -r ANCIEN ANCIEN_README < "$MARQUE"
git cat-file -e "$ANCIEN^{tree}" 2>/dev/null || ANCIEN=$(git rev-parse 'HEAD^{tree}')

CHANGES=$(git diff --name-status "$ANCIEN" "$ARBRE" -- plugins .githooks .claude-plugin \
  ':(exclude)plugins/ia-kit/mcp/pgadmin/dist' ':(exclude,glob)**/package-lock.json' | head -n 50)

# Rien de changé dans le plugin, README déjà retouché, ou Claude déjà relancé une fois : on mémorise et on s'arrête.
if [ -z "$CHANGES" ] || [ "$README" != "$ANCIEN_README" ] \
  || grep -Eq '"stop_hook_active"[[:space:]]*:[[:space:]]*true'; then
  memoriser
  exit 0
fi

# Code 2 : Claude ne s'arrête pas et reçoit ce message.
{
  echo "Fichiers du plugin modifiés sans que README.md bouge :"
  echo "$CHANGES"
  echo "Vérifie que README.md décrit toujours la réalité : tableau « Contenu du plugin » (une ligne par élément, descriptions justes), « Structure », paragraphes d'explication (MCP, hooks…), « Développer » et « Règles ». Corrige ce qui est faux ou manquant. Si tout est déjà juste, dis-le en une ligne sans rien modifier."
} >&2
exit 2
