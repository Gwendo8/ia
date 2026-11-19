#!/usr/bin/env node
// Rappelle le ménage mensuel de la mémoire (hook SessionStart, au lancement d'une conversation).
// La date du dernier ménage est dans ~/.claude/menage-memoire.json, écrite par /menage-memoire.
// Au-delà de 30 jours, il demande à Claude de le rappeler en une phrase, une fois par jour au plus.
// Premier lancement sans fichier : il commence à compter à partir d'aujourd'hui, sans rien dire.
// Il ne bloque jamais rien : en cas d'erreur, il se tait.
import { readFileSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'

const JOURS_ENTRE_DEUX_MENAGES = 30
const FICHIER = join(homedir(), '.claude', 'menage-memoire.json')
const UN_JOUR = 24 * 60 * 60 * 1000

function main() {
  const aujourdhui = new Date().toISOString().slice(0, 10)
  let etat
  try {
    etat = JSON.parse(readFileSync(FICHIER, 'utf8'))
  } catch {
    writeFileSync(FICHIER, JSON.stringify({ dernier: aujourdhui }))
    return
  }
  const jours = Math.floor((Date.parse(aujourdhui) - Date.parse(etat.dernier)) / UN_JOUR)
  if (!(jours >= JOURS_ENTRE_DEUX_MENAGES) || etat.dernierRappel === aujourdhui) return

  writeFileSync(FICHIER, JSON.stringify({ ...etat, dernierRappel: aujourdhui }))
  const rappel =
    `Rappel ia-kit : le dernier ménage de la mémoire date du ${etat.dernier} (il y a ${jours} jours). ` +
    "Au début de ta première réponse, rappelle-le à l'utilisatrice en une phrase : elle peut lancer /ia-kit:menage-memoire " +
    "quand elle a un moment. Puis réponds normalement à sa demande."
  process.stdout.write(JSON.stringify({ hookSpecificOutput: { hookEventName: 'SessionStart', additionalContext: rappel } }))
}

try {
  main()
} catch {
  // un rappel ne doit jamais gêner le démarrage d'une conversation
}
