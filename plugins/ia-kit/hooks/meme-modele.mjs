#!/usr/bin/env node
// Garde-fou « même modèle » (hook PreToolUse sur l'outil Agent).
// Règle (regles/qui-fait-le-travail.md) : un agent spécialiste ia-kit qui tourne sur le même modèle
// que la conversation repart de zéro et relit tout, pour le même résultat. Mieux vaut faire le travail
// soi-même. Avant chaque lancement d'un agent ia-kit, le hook compare les deux modèles ; s'ils sont
// de la même famille, il demande à l'utilisatrice de confirmer (fenêtre d'autorisation).
// Agent moins cher ou plus cher : rien (pour un agent plus cher, la règle laisse juger).
// En cas de doute (modèle introuvable ou inconnu) ou d'erreur, il se tait : il ne bloque jamais à tort.
import { closeSync, existsSync, openSync, readFileSync, readSync, statSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const DOSSIER_AGENTS = join(dirname(fileURLToPath(import.meta.url)), '..', 'agents')
const OCTETS_LUS = 2 * 1024 * 1024

// Famille d'un modèle, du moins cher au plus cher. null si on ne reconnaît pas le nom.
function famille(modele) {
  const nom = String(modele || '').toLowerCase()
  if (nom.includes('haiku')) return 'haiku'
  if (nom.includes('sonnet')) return 'sonnet'
  if (nom.includes('opus')) return 'opus'
  if (nom.includes('fable') || nom.includes('mythos')) return 'fable'
  return null
}

// Modèle de la dernière réponse écrite dans un fichier de conversation (lu par la fin).
function modeleDeLaConversation(chemins) {
  const chemin = chemins.find((c) => c && existsSync(c))
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
      if (type === 'assistant' && message?.model && message.model !== '<synthetic>') return message.model
    } catch {
      // ligne vide ou coupée par la lecture partielle : on passe à la précédente
    }
  }
  return null
}

// Modèle déclaré dans le fichier de l'agent (ligne `model:` de l'en-tête).
function modeleDeLAgent(nom) {
  const chemin = join(DOSSIER_AGENTS, `${nom}.md`)
  if (!existsSync(chemin)) return null
  const entete = readFileSync(chemin, 'utf8').split('\n---')[0]
  return entete.match(/^model:\s*(\S+)/m)?.[1] ?? 'inherit'
}

function main() {
  const entree = JSON.parse(readFileSync(0, 'utf8'))
  const type = entree.tool_input?.subagent_type ?? ''
  if (!type.startsWith('ia-kit:')) return
  const nom = type.slice('ia-kit:'.length)

  const transcript = entree.transcript_path
  const chemins = entree.agent_id
    ? [join(dirname(transcript), entree.session_id ?? '', 'subagents', `agent-${entree.agent_id}.jsonl`), transcript]
    : [transcript]
  const conversation = modeleDeLaConversation(chemins)

  const declare = entree.tool_input?.model || modeleDeLAgent(nom)
  if (!declare) return
  const agent = declare === 'inherit' ? conversation : declare

  const f = famille(conversation)
  if (!f || famille(agent) !== f) return

  const raison =
    `Garde-fou ia-kit : l'agent ${nom} tourne sur ${f}, comme cette conversation. ` +
    `Il repartirait de zéro et relirait tout, pour le même résultat (règle « qui fait le travail »). ` +
    `Accepte seulement si tu veux vraiment cet agent ; sinon refuse, et Claude fera le travail lui-même.`
  process.stdout.write(
    JSON.stringify({ hookSpecificOutput: { hookEventName: 'PreToolUse', permissionDecision: 'ask', permissionDecisionReason: raison } })
  )
}

try {
  main()
} catch {
  // un garde-fou ne doit jamais gêner le travail
}
