# Chargé au début de .husky/pre-commit : retrouve node, npx et claude même quand le PATH est réduit.
# Exemple : sur Mac, VS Code ou Cursor ouvert depuis le Dock ne lit pas ~/.zshrc, donc ni Homebrew,
# ni nvm, ni ~/.local/bin (où s'installe claude) ne sont dans le PATH, et le commit échoue
# avec « npx: command not found ».
# Même recherche de node que hooks/node.sh du plugin ia-kit : modifier les deux ensemble.
if ! command -v node >/dev/null 2>&1; then
  for dossier in /opt/homebrew/bin /usr/local/bin $(ls -d "$HOME"/.nvm/versions/node/*/bin 2>/dev/null | sort -V -r); do
    if [ -x "$dossier/node" ]; then
      PATH="$dossier:$PATH"
      break
    fi
  done
fi
if ! command -v claude >/dev/null 2>&1 && [ -x "$HOME/.local/bin/claude" ]; then
  PATH="$HOME/.local/bin:$PATH"
fi
export PATH
