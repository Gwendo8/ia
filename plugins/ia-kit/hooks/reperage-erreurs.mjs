#!/usr/bin/env node
// Repère les messages où l'utilisatrice corrige Claude (hook UserPromptSubmit).
// Un hook ne comprend pas le sens d'un message : il cherche des tournures typiques
// d'une correction (« tu as oublié », « c'est faux », « ça marche pas »…). S'il en trouve, il glisse
// à Claude un rappel court : vérifier s'il s'agit d'une erreur à noter avec le skill erreurs.
// On cherche des tournures entières plutôt que des mots seuls (« non », « erreur ») : un mot seul
// apparaît dans plein de messages qui ne sont pas des corrections, et déclencherait pour rien.
// Sans tournure repérée, il ne fait rien et ne coûte rien. Il ne bloque jamais le message.
import { readFileSync } from 'node:fs'

const TOURNURES_DE_CORRECTION = [
  /^\W*non\b/i, // le message commence par « non »
  /\b(tu as|t'as|tu es|t'es|tu t'es)\s+(encore\s+|re)?(oublié|trompé|faux|planté)/i,
  /\btu (te trompes|as tort)\b|\bt'as tort\b/i,
  /\btu (as |)(encore |)(fait|fais|refais|refait) (une|la même|des|cette) (erreur|bêtise|faute)/i,
  /\bc'est (faux|pas (ça|bon|juste|correct|ce que))/i,
  /\bpas ce que je (voulais|veux|t'ai demandé|demandais)/i,
  /\bje (te l'ai|t'ai) (déjà |pourtant )?dit/i,
  /\b(encore une fois|toujours pas|encore oublié)\b/i,
  /\b(ne )?(marche|fonctionne)(nt)? (pas|plus)\b/i,
  /\b(recommence|refais|corrige)\b/i,
]

function main() {
  const { prompt } = JSON.parse(readFileSync(0, 'utf8'))
  if (!prompt || prompt.trimStart().startsWith('/')) return // commande tapée : pas une correction
  if (!TOURNURES_DE_CORRECTION.some((tournure) => tournure.test(prompt))) return

  const rappel =
    "Rappel ia-kit : ce message ressemble peut-être à une correction. Si c'est une erreur de ta part " +
    '(ou une erreur que tu as faite et corrigée), suis le skill ia-kit:erreurs. Sinon, ignore ce rappel.'
  process.stdout.write(JSON.stringify({ hookSpecificOutput: { hookEventName: 'UserPromptSubmit', additionalContext: rappel } }))
}

try {
  main()
} catch {
  // un hook de repérage ne doit jamais gêner l'envoi du message
}
