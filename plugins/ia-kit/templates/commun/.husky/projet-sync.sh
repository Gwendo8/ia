#!/bin/sh
# Garde PROJET.md à jour (hooks ia-kit). Un seul script, trois moments :
#   debut  : début de conversation (hook SessionStart du plugin) → signale à Claude ce qui a changé
#            depuis la dernière mise à jour de PROJET.md (modifications faites à la main).
#   fin    : fin de chaque demande (hook Stop du plugin) → si du code a changé sans que PROJET.md
#            suive, empêche Claude de s'arrêter et lui demande la mise à jour (une seule fois).
#   commit : avant chaque commit (pre-commit Husky du projet) → si PROJET.md n'a pas suivi,
#            demande à Claude (claude -p) de le mettre à jour et l'ajoute au même commit.
#
# Le « point de synchro » est la dernière ligne de PROJET.md (commentaire invisible) :
#   arbre  = empreinte git de tous les fichiers du projet au moment de la dernière mise à jour ;
#   projet = empreinte du contenu de PROJET.md à ce moment-là (pour savoir s'il a été retouché depuis).
#
# Ne fait rien s'il n'y a pas de dépôt git, pas de PROJET.md à la racine, ou si IA_KIT_SYNC_OFF=1
# (le claude -p lancé au commit déclencherait sinon ces mêmes hooks).

MODE=$1
[ "$IA_KIT_SYNC_OFF" = "1" ] && exit 0
cd "${CLAUDE_PROJECT_DIR:-.}" 2>/dev/null || exit 0
RACINE=$(git rev-parse --show-toplevel 2>/dev/null) || exit 0
cd "$RACINE" || exit 0
[ -f PROJET.md ] || exit 0

ETIQUETTE='ia-kit:synchro'
VIDE=4b825dc642cb6eb9a060e54bf8d69288fbee4904 # arbre git vide

# Fichiers sans intérêt pour la carte (node_modules, dist et .env sont déjà ignorés par .gitignore).
diff_projet() {
  git diff --name-status "$1" "$2" -- . \
    ':(exclude)PROJET.md' ':(exclude,glob)**/package-lock.json' ':(exclude,glob)**/*.lock'
}

# Empreinte de l'état actuel des fichiers (commités ou non), via un index temporaire :
# le vrai index (ce qui est prêt à être commité) n'est pas touché.
arbre_actuel() {
  TMP=$(mktemp)
  cp "$(git rev-parse --git-path index)" "$TMP" 2>/dev/null || rm -f "$TMP"
  GIT_INDEX_FILE=$TMP git add -A . >/dev/null 2>&1
  GIT_INDEX_FILE=$TMP git write-tree
  rm -f "$TMP"
}

empreinte_projet() {
  grep -v "$ETIQUETTE" PROJET.md | git hash-object --stdin
}

# Lit le point de synchro. Si l'arbre noté est introuvable (autre poste, dépôt recloné),
# on repart du dernier commit qui a modifié PROJET.md.
lire_marque() {
  LIGNE=$(grep "$ETIQUETTE" PROJET.md | tail -n 1)
  ANCIEN=$(echo "$LIGNE" | sed -n 's/.*arbre=\([0-9a-f]*\).*/\1/p')
  ANCIEN_PROJET=$(echo "$LIGNE" | sed -n 's/.*projet=\([0-9a-f]*\).*/\1/p')
  if [ -n "$ANCIEN" ] && ! git cat-file -e "$ANCIEN^{tree}" 2>/dev/null; then
    DERNIER=$(git log -1 --format=%H -- PROJET.md 2>/dev/null)
    ANCIEN=$(git rev-parse "$DERNIER^{tree}" 2>/dev/null || echo $VIDE)
  fi
}

# Avance le point de synchro à l'état actuel.
ecrire_marque() {
  ARBRE=$(arbre_actuel)
  # Une référence locale protège l'empreinte du nettoyage automatique de git.
  COMMIT=$(GIT_AUTHOR_NAME=ia-kit GIT_AUTHOR_EMAIL=ia-kit@local \
    GIT_COMMITTER_NAME=ia-kit GIT_COMMITTER_EMAIL=ia-kit@local \
    git commit-tree "$ARBRE" -m "point de synchro PROJET.md" 2>/dev/null) \
    && git update-ref refs/ia-kit/synchro "$COMMIT"
  PROJET=$(empreinte_projet)
  TMP=$(mktemp)
  grep -v "$ETIQUETTE" PROJET.md > "$TMP"
  echo "<!-- $ETIQUETTE arbre=$ARBRE projet=$PROJET : point de synchro des hooks ia-kit, ne pas modifier -->" >> "$TMP"
  cat "$TMP" > PROJET.md
  rm -f "$TMP"
}

CONSIGNE="Mets à jour PROJET.md (relis-le juste avant) : les fichiers de chaque fonctionnalité concernée (carte), les statuts, et une ligne datée dans le journal. Ne touche pas à la dernière ligne ($ETIQUETTE)."

lire_marque
if [ -z "$ANCIEN" ]; then
  # Pas encore de point de synchro (PROJET.md tout neuf) : on part de l'état actuel.
  ecrire_marque
  exit 0
fi
NOUVEAU=$(arbre_actuel)
CHANGES=$(diff_projet "$ANCIEN" "$NOUVEAU" | head -n 50)
PROJET_RETOUCHE=$([ "$(empreinte_projet)" != "$ANCIEN_PROJET" ] && echo oui)

case "$MODE" in
  debut)
    # Le texte affiché ici est ajouté au contexte de Claude en début de conversation.
    if [ -n "$CHANGES" ]; then
      echo "ia-kit : des fichiers ont changé depuis la dernière mise à jour de PROJET.md (probablement à la main, en dehors de Claude) :"
      echo "$CHANGES"
      echo "Dès ta première réponse, avant la demande de l'utilisateur : $CONSIGNE Pour un changement dont tu ne connais pas la raison, demande-la à l'utilisateur, n'invente jamais. Termine par une ligne « PROJET.md mis à jour : … »."
    fi
    if grep -q '❓ à demander' PROJET.md; then
      echo "ia-kit : PROJET.md contient des raisons manquantes (marquées « ❓ à demander »), laissées lors d'un commit. Demande-les à l'utilisateur, puis remplace chaque marque par sa réponse."
    fi
    exit 0
    ;;
  fin)
    [ -z "$CHANGES" ] && exit 0
    # Claude a déjà été relancé une fois pour cette demande, ou PROJET.md a été retouché : on avance la synchro.
    if [ -n "$PROJET_RETOUCHE" ] || grep -Eq '"stop_hook_active"[[:space:]]*:[[:space:]]*true'; then
      ecrire_marque
      exit 0
    fi
    # Code 2 : Claude ne s'arrête pas et reçoit ce message.
    {
      echo "ia-kit : des fichiers du projet ont changé mais PROJET.md n'a pas suivi :"
      echo "$CHANGES"
      echo "$CONSIGNE Pour ce que tu as fait toi-même, la raison est la demande de l'utilisateur : résume-la. Pour un changement dont tu ne connais pas la raison (modification manuelle), demande-la à l'utilisateur, n'invente jamais. Termine par une ligne « PROJET.md mis à jour : … »."
    } >&2
    exit 2
    ;;
  commit)
    if [ -n "$CHANGES" ] && [ -z "$PROJET_RETOUCHE" ]; then
      if ! command -v claude >/dev/null 2>&1; then
        echo "pre-commit : commit bloqué, PROJET.md n'est pas à jour et Claude Code est introuvable pour le faire."
        echo "Mets PROJET.md à jour (ou ouvre Claude dans ce projet), puis recommite. (Si c'est voulu : git commit --no-verify)"
        exit 1
      fi
      echo "pre-commit : mise à jour de PROJET.md par Claude…"
      AVANT=$(empreinte_projet)
      IA_KIT_SYNC_OFF=1 claude -p "Ces fichiers ont changé depuis la dernière mise à jour de PROJET.md : $CHANGES
$CONSIGNE Tu ne peux pas poser de question : pour un changement dont tu ne connais pas la raison, écris « ❓ à demander » à la place de la raison, elle sera demandée à l'utilisateur à la prochaine conversation. Ne modifie aucun autre fichier." \
        --permission-mode acceptEdits --allowedTools Read Edit Glob Grep </dev/null >/dev/null
      if [ "$(empreinte_projet)" = "$AVANT" ]; then
        echo "pre-commit : commit bloqué, Claude n'a pas pu mettre PROJET.md à jour (connexion ?)."
        echo "Réessaie, ou mets PROJET.md à jour toi-même. (Si c'est voulu : git commit --no-verify)"
        exit 1
      fi
      echo "pre-commit : PROJET.md mis à jour et ajouté au commit."
    fi
    if [ -n "$CHANGES" ] || [ -n "$PROJET_RETOUCHE" ]; then
      ecrire_marque
      git add PROJET.md
    fi
    exit 0
    ;;
esac
