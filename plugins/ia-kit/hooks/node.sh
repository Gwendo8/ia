#!/bin/sh
# Trouve node même quand le PATH est réduit au minimum. Exemple : sur Mac, une application lancée
# depuis le Dock (VS Code, Cursor) ne lit pas ~/.zshrc, donc ni Homebrew ni nvm ne sont dans son PATH.
# Même recherche que templates/commun/.husky/path.sh (copié dans chaque projet) : modifier les deux ensemble.
# Ordre : node déjà dans le PATH, puis Homebrew, puis la version nvm la plus récente.
#
# Deux usages :
# - lancé avec un script : sh node.sh script.mjs [arguments] → exécute le script avec node ;
#   sans node trouvé, se tait (sortie 0) : un hook ne doit jamais bloquer le travail.
# - chargé sans argument : . node.sh → ajoute seulement le dossier de node au PATH
#   (pour un script qui appelle ensuite node et npm, comme le pre-commit du dépôt).
if ! command -v node >/dev/null 2>&1; then
  for dossier in /opt/homebrew/bin /usr/local/bin $(ls -d "$HOME"/.nvm/versions/node/*/bin 2>/dev/null | sort -V -r); do
    if [ -x "$dossier/node" ]; then
      PATH="$dossier:$PATH"
      export PATH
      break
    fi
  done
fi

if [ $# -gt 0 ]; then
  command -v node >/dev/null 2>&1 || exit 0
  exec node "$@"
fi
