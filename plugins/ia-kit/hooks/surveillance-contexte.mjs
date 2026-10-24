#!/usr/bin/env node
// Surveille le contexte des agents back, front et auditeur (hook PostToolUse).
// Un agent relit toute sa conversation à chaque réponse : au-delà du seuil, chaque
// réponse coûte cher en quota. Le hook lui demande alors de finir sa fonctionnalité
// en cours et de rendre la main au chef, qui lance un agent neuf pour la suite.
// Il ne bloque jamais rien : en cas de doute ou d'erreur, il se tait.
import { closeSync, existsSync, mkdirSync, openSync, readFileSync, readSync, statSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'

const SEUIL_TOKENS = Number(process.env.IA_KIT_SEUIL_CONTEXTE) || 250000
// Repli si le fichier de l'agent est illisible : on compte les appels d'outils.
const SEUIL_APPELS = Number(process.env.IA_KIT_SEUIL_APPELS) || 50
const RAPPEL_TOUS_LES = 10
const AGENTS_SURVEILLES = ['back', 'front', 'auditeur']
const OCTETS_LUS = 4 * 1024 * 1024

// Taille du contexte à la dernière réponse de l'agent : entrée + cache lu + cache écrit.
// Le format des fichiers de session n'est pas garanti : null si on ne le comprend pas.
function lireContexte(chemins) {
  const chemin = chemins.find((c) => existsSync(c))
  if (!chemin) return null
  const taille = statSync(chemin).size
  const debut = Math.max(0, taille - OCTETS_LUS)
  const buffer = Buffer.alloc(taille - debut)
  const fichier = openSync(chemin, 'r')
  try {
    readSync(fichier, buffer, 0, buffer.length, debut)
  } finally {
    closeSync(fichier)
  }
  const lignes = buffer.toString('utf8').split('\n')
  for (let i = lignes.length - 1; i >= 0; i--) {
    try {
      const { type, message } = JSON.parse(lignes[i])
      const usage = message?.usage
      if (type === 'assistant' && usage) {
        return (usage.input_tokens || 0) + (usage.cache_read_input_tokens || 0) + (usage.cache_creation_input_tokens || 0)
      }
    } catch {
      // ligne vide ou coupée par la lecture partielle : on passe à la précédente
    }
  }
  return null
}

function lireEtat(fichier) {
  try {
    return JSON.parse(readFileSync(fichier, 'utf8'))
  } catch {
    return { appels: 0, dernierRappel: null }
  }
}

function main() {
  const entree = JSON.parse(readFileSync(0, 'utf8'))
  const { agent_id: agentId, agent_type: agentType, transcript_path: transcript, session_id: session } = entree
  if (!agentId || !agentType || !transcript) return // session principale : pas concernée
  const nom = agentType.split(':').pop()
  if (!AGENTS_SURVEILLES.includes(nom)) return

  const dossier = join(tmpdir(), 'ia-kit-contexte')
  mkdirSync(dossier, { recursive: true })
  const fichierEtat = join(dossier, `${agentId}.json`)
  const etat = lireEtat(fichierEtat)
  etat.appels += 1

  const projet = dirname(transcript)
  const nomFichier = `agent-${agentId}.jsonl`
  const contexte = lireContexte([join(projet, session ?? '', 'subagents', nomFichier), join(projet, 'subagents', nomFichier)])

  const depasse = contexte === null ? etat.appels >= SEUIL_APPELS : contexte >= SEUIL_TOKENS
  const rappelDu = etat.dernierRappel === null || etat.appels - etat.dernierRappel >= RAPPEL_TOUS_LES
  if (depasse && rappelDu) {
    etat.dernierRappel = etat.appels
    const mesure = contexte === null ? `${etat.appels} appels d'outils` : `${Math.round(contexte / 1000)} 000 tokens de contexte`
    const message =
      `Ton contexte est devenu lourd (${mesure}) : chaque réponse relit tout et consomme beaucoup de quota. ` +
      `Ne commence pas de nouvelle fonctionnalité. Termine celle en cours, mets à jour PROJET.md, puis rends ton compte rendu ` +
      `en indiquant ce qui reste à faire : le chef lancera un agent neuf pour la suite.`
    process.stdout.write(JSON.stringify({ hookSpecificOutput: { hookEventName: 'PostToolUse', additionalContext: message } }))
  }
  writeFileSync(fichierEtat, JSON.stringify(etat))
}

try {
  main()
} catch {
  // un hook de surveillance ne doit jamais gêner le travail de l'agent
}
