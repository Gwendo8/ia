// Vérifie que le tableau « Contenu du plugin » du README correspond aux éléments réels du plugin,
// dans les deux sens : chaque élément a sa ligne, chaque ligne correspond à un élément qui existe.
// Lit les versions du commit en préparation (index git), pas les fichiers sur le disque.
// Lancé par .githooks/pre-commit ; code de sortie 1 si le tableau est faux.
import { execSync } from 'node:child_process';

const git = (cmd) => execSync(`git ${cmd}`, { encoding: 'utf8' });
const indexe = (chemin) => {
  try {
    return git(`show ":${chemin}"`);
  } catch {
    return null;
  }
};

const PLUGIN = 'plugins/ia-kit';
const fichiers = git(`ls-files ${PLUGIN}`).split('\n');

// Éléments réels, sous la forme « type nom », comme dans le tableau.
const attendus = new Set();
for (const f of fichiers) {
  let m;
  if ((m = f.match(/^plugins\/ia-kit\/commands\/([^/]+)\.md$/))) attendus.add(`commande /${m[1]}`);
  if ((m = f.match(/^plugins\/ia-kit\/agents\/([^/]+)\.md$/))) attendus.add(`agent ${m[1]}`);
  if ((m = f.match(/^plugins\/ia-kit\/skills\/([^/]+)\/SKILL\.md$/))) attendus.add(`skill ${m[1]}`);
}
const mcp = indexe(`${PLUGIN}/.mcp.json`);
if (mcp) for (const nom of Object.keys(JSON.parse(mcp).mcpServers ?? {})) attendus.add(`MCP ${nom}`);
const aDesHooks = fichiers.includes(`${PLUGIN}/hooks/hooks.json`);

// Lignes du tableau : | `nom` | type | description |
const lignes = new Set();
let lignesHooks = 0;
for (const ligne of (indexe('README.md') ?? '').split('\n')) {
  const m = ligne.match(/^\|\s*`([^`]+)`\s*\|\s*([^|]+?)\s*\|/);
  if (!m) continue;
  if (m[2] === 'hooks') lignesHooks++;
  else lignes.add(`${m[2]} ${m[1]}`);
}

const manquants = [...attendus].filter((e) => !lignes.has(e));
const enTrop = [...lignes].filter((e) => !attendus.has(e));
if (aDesHooks && lignesHooks === 0) manquants.push('hooks (plugins/ia-kit/hooks/hooks.json)');
if (!aDesHooks && lignesHooks > 0) enTrop.push('hooks (hooks/hooks.json n’existe plus)');

if (manquants.length || enTrop.length) {
  console.log('pre-commit : commit bloqué, le tableau « Contenu du plugin » du README ne correspond pas au plugin.');
  if (manquants.length) console.log(`Éléments sans ligne dans le tableau :\n${manquants.map((e) => `  - ${e}`).join('\n')}`);
  if (enTrop.length) console.log(`Lignes d’éléments qui n’existent plus :\n${enTrop.map((e) => `  - ${e}`).join('\n')}`);
  console.log('Corrige le tableau du README.md (format : | `nom` | type | description |), puis recommite.');
  console.log('(Si c’est voulu : git commit --no-verify)');
  process.exit(1);
}
