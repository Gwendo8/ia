#!/usr/bin/env node
// Mesure ce qu'a consommé une session Claude Code : la conversation principale,
// chaque agent lancé et tous leurs sous-agents, modèle par modèle.
// Lecture seule : il lit les journaux de ~/.claude/projects et n'écrit rien.
//
// Usage : node mesure-agents.mjs [--projet <dossier>] [--session <id>] [--json]
//   --projet  dossier du projet (par défaut : le dossier courant)
//   --session identifiant de la session (par défaut : la plus récente du projet)
//
// Le format des journaux n'est pas garanti par Claude Code : si un fichier est
// illisible, il est signalé et ignoré.
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { homedir } from 'node:os'
import { basename, join, resolve } from 'node:path'

// Tarifs de l'API en $ par million de tokens (relevés en novembre 2026) :
// entrée, écriture de cache, lecture de cache, sortie. Ils servent d'indicateur
// du poids de chaque modèle ; le poids exact sur un quota d'abonnement n'est pas publié.
const TARIFS = {
  fable: [8, 10, 0.2, 40],
  opus: [4, 5, 0.2, 20],
  sonnet: [2, 2.5, 0.1, 10],
  haiku: [0.1, 0.125, 0.01, 0.5],
}

const args = process.argv.slice(2)
const option = (nom) => {
  const i = args.indexOf(nom)
  return i >= 0 ? args[i + 1] : undefined
}
const projet = resolve(option('--projet') || process.cwd())
const dossierProjet = join(homedir(), '.claude', 'projects', projet.replace(/[^a-zA-Z0-9]/g, '-'))

if (!existsSync(dossierProjet)) {
  console.error(`Aucun journal Claude Code pour ce projet (${dossierProjet}).`)
  process.exit(1)
}

// Session : celle demandée, sinon la plus récente (d'après son journal principal).
let session = option('--session')
if (!session) {
  const journaux = readdirSync(dossierProjet)
    .filter((f) => f.endsWith('.jsonl'))
    .map((f) => ({ id: basename(f, '.jsonl'), date: statSync(join(dossierProjet, f)).mtimeMs }))
    .sort((a, b) => b.date - a.date)
  if (!journaux.length) {
    console.error('Aucune session trouvée pour ce projet.')
    process.exit(1)
  }
  session = journaux[0].id
}

const famille = (modele = '') => Object.keys(TARIFS).find((f) => modele.includes(f)) || modele || '?'

// Additionne les tokens d'un journal, par modèle. Une même réponse peut occuper
// plusieurs lignes (une par bloc) : on la compte une fois, d'après son identifiant.
function lireJournal(chemin) {
  const parModele = {}
  let reponses = 0
  let contexteMax = 0
  const vus = new Set()
  let lignes
  try {
    lignes = readFileSync(chemin, 'utf8').split('\n')
  } catch {
    return null
  }
  for (const ligne of lignes) {
    let e
    try {
      e = JSON.parse(ligne)
    } catch {
      continue
    }
    const u = e?.message?.usage
    // Les messages internes de Claude Code (modèle « <synthetic> ») ne consomment rien.
    if (!u || e.message.model?.startsWith('<')) continue
    const cle = e.message.id || e.requestId || e.uuid
    if (vus.has(cle)) continue
    vus.add(cle)
    reponses++
    const t = (parModele[famille(e.message.model)] ??= [0, 0, 0, 0])
    const valeurs = [u.input_tokens, u.cache_creation_input_tokens, u.cache_read_input_tokens, u.output_tokens]
    valeurs.forEach((v, i) => (t[i] += v || 0))
    contexteMax = Math.max(contexteMax, (valeurs[0] || 0) + (valeurs[1] || 0) + (valeurs[2] || 0))
  }
  return { parModele, reponses, contexteMax }
}

const cout = (f, t) => (TARIFS[f] ? t.reduce((s, v, i) => s + (v * TARIFS[f][i]) / 1e6, 0) : 0)

// Les agents de la session, avec leur parent (meta.json écrit par Claude Code).
const dossierAgents = join(dossierProjet, session, 'subagents')
const agents = {}
if (existsSync(dossierAgents)) {
  for (const f of readdirSync(dossierAgents).filter((f) => f.endsWith('.meta.json'))) {
    const id = f.slice('agent-'.length, -'.meta.json'.length)
    try {
      const meta = JSON.parse(readFileSync(join(dossierAgents, f), 'utf8'))
      const journal = join(dossierAgents, `agent-${id}.jsonl`)
      agents[id] = { id, meta, mesure: lireJournal(journal), date: existsSync(journal) ? statSync(journal).birthtimeMs : 0 }
    } catch {
      console.error(`Fichier illisible, ignoré : ${f}`)
    }
  }
}

// Regroupe un agent et tous ses descendants.
function arbre(id, profondeur = 0) {
  const lignes = [{ ...agents[id], profondeur }]
  Object.values(agents)
    .filter((a) => a.meta.parentAgentId === id)
    .sort((a, b) => a.date - b.date)
    .forEach((a) => lignes.push(...arbre(a.id, profondeur + 1)))
  return lignes
}

const groupes = [
  { titre: 'Conversation principale', lignes: [{ meta: { agentType: 'session principale' }, mesure: lireJournal(join(dossierProjet, `${session}.jsonl`)), profondeur: 0 }] },
  ...Object.values(agents)
    .filter((a) => !a.meta.parentAgentId || !agents[a.meta.parentAgentId])
    .sort((a, b) => a.date - b.date)
    .map((a) => ({ titre: a.meta.description || a.meta.agentType, lignes: arbre(a.id) })),
]

// Totaux par groupe et pour toute la session.
const totalSession = {}
for (const g of groupes) {
  g.total = {}
  for (const l of g.lignes) {
    for (const [f, t] of Object.entries(l.mesure?.parModele || {})) {
      const T = (g.total[f] ??= [0, 0, 0, 0])
      const S = (totalSession[f] ??= [0, 0, 0, 0])
      t.forEach((v, i) => ((T[i] += v), (S[i] += v)))
    }
  }
}

if (args.includes('--json')) {
  console.log(JSON.stringify({ projet, session, groupes, totalSession }, null, 2))
  process.exit(0)
}

const n = (x) => Math.round(x).toLocaleString('fr-FR')
const d = (x) => x.toFixed(2).replace('.', ',') + ' $'
const somme = (total) => Object.entries(total).reduce((s, [f, t]) => s + cout(f, t), 0)

console.log(`Projet : ${projet}\nSession : ${session}\n`)
for (const g of groupes) {
  if (!g.lignes.some((l) => l.mesure?.reponses)) continue
  console.log(`## ${g.titre}  —  ${d(somme(g.total))}`)
  for (const l of g.lignes) {
    const m = l.mesure
    if (!m) {
      console.log(`${'  '.repeat(l.profondeur)}- ${l.meta.agentType} : journal illisible`)
      continue
    }
    const modeles = Object.entries(m.parModele)
      .map(([f, t]) => `${f} ${d(cout(f, t))}`)
      .join(', ')
    console.log(`${'  '.repeat(l.profondeur)}- ${l.meta.agentType} : ${m.reponses} réponses, contexte max ${n(m.contexteMax)} tokens, ${modeles}`)
  }
  console.log()
}
console.log('## Total de la session, par modèle')
for (const [f, t] of Object.entries(totalSession)) {
  console.log(`- ${f} : entrée ${n(t[0])}, écriture de cache ${n(t[1])}, lecture de cache ${n(t[2])}, sortie ${n(t[3])}  →  ${d(cout(f, t))}`)
}
console.log(`- Total : ${d(somme(totalSession))} (équivalent tarif API)`)
