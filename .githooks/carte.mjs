// Génère carte.html : la carte mentale du plugin ia-kit (commandes, agents, outils, gardiens).
// Tout est lu dans les fichiers du plugin (versions du commit en préparation, index git) :
// un agent, une commande, un hook ou un serveur MCP ajouté apparaît tout seul au commit suivant.
// Lancé par .githooks/pre-commit, qui ajoute ensuite carte.html au commit.
import { execSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';

const git = (cmd) => execSync(`git ${cmd}`, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
const indexe = (chemin) => {
  try {
    return git(`show ":${chemin}"`);
  } catch {
    return null;
  }
};

const PLUGIN = 'plugins/ia-kit';
const fichiers = git(`ls-files ${PLUGIN}`).split('\n').filter(Boolean);

// En-tête YAML simple (clé: valeur sur une ligne), comme dans les agents, commandes et skills.
function entete(texte) {
  const res = {};
  const m = (texte ?? '').match(/^---\n([\s\S]*?)\n---/);
  if (!m) return res;
  for (const ligne of m[1].split('\n')) {
    const i = ligne.indexOf(':');
    if (i > 0) res[ligne.slice(0, i).trim()] = ligne.slice(i + 1).trim();
  }
  return res;
}
const phrases = (s) => (s ?? '').split(/(?<=[.!?])\s+/).filter(Boolean);
const sansParentheses = (s) => s.replace(/\s*\([^)]*\)/g, '').trim();
const majuscule = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const echappe = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

const MODELES = {
  opus: 'Opus · le plus fort',
  sonnet: 'Sonnet · équilibré',
  haiku: 'Haiku · léger et économe',
};
const modele = (m) => MODELES[m] ?? (m ? m : 'modèle de ta session');

// --- Agents -------------------------------------------------------------------------------
const agents = [];
for (const f of fichiers) {
  const m = f.match(/^plugins\/ia-kit\/agents\/([^/]+)\.md$/);
  if (!m) continue;
  const e = entete(indexe(f));
  const ph = phrases(e.description).filter((p) => !/^À utiliser/.test(p));
  const nom = e.name || m[1];
  agents.push({
    id: m[1],
    titre: nom.length <= 3 ? nom.toUpperCase() : majuscule(nom),
    // La 1re phrase nomme le rôle (« Spécialiste API (…). »), la 2e dit ce que fait l'agent.
    court: sansParentheses(ph[1] ?? ph[0] ?? ''),
    detail: ph.join(' '),
    tags: [modele(e.model), `agent ia-kit:${m[1]}`],
  });
}
const parId = Object.fromEntries(agents.map((a) => [a.id, a]));

// --- Commandes (celles qui portent le nom d'un agent sont rangées avec lui) ---------------------
const PREMIERES = ['chef', 'cahier-des-charges'];
const commandes = [];
for (const f of fichiers) {
  const m = f.match(/^plugins\/ia-kit\/commands\/([^/]+)\.md$/);
  if (!m) continue;
  const e = entete(indexe(f));
  if (parId[m[1]]) {
    parId[m[1]].tags.push(`/ia-kit:${m[1]}`);
    continue;
  }
  const [titre, ...reste] = (e.description ?? '').split(' — ');
  const texte = reste.join(' — ');
  commandes.push({
    id: m[1],
    titre: texte ? titre : majuscule(m[1].replace(/-/g, ' ')),
    court: majuscule(sansParentheses(texte || titre)),
    detail: [texte ? '' : e.description, e['argument-hint'] ? `À taper avec : ${e['argument-hint']}` : ''].filter(Boolean).join(' '),
    tags: [`/ia-kit:${m[1]}`, ...(e.model ? [modele(e.model)] : [])],
  });
}
commandes.sort((a, b) => {
  const ia = PREMIERES.indexOf(a.id), ib = PREMIERES.indexOf(b.id);
  if (ia !== ib) return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib);
  return a.id.localeCompare(b.id);
});

// --- Outils (serveurs MCP) ------------------------------------------------------------------
const TEXTES_OUTILS = {
  pgadmin: 'Lit tes bases PostgreSQL, sans jamais pouvoir les modifier.',
  playwright: 'Un navigateur que Claude pilote : ouvrir une page, cliquer, prendre une capture.',
};
const outils = [];
const mcp = JSON.parse(indexe(`${PLUGIN}/.mcp.json`) ?? '{}').mcpServers ?? {};
for (const [nom, conf] of Object.entries(mcp)) {
  const pkg = JSON.parse(indexe(`${PLUGIN}/mcp/${nom}/package.json`) ?? '{}');
  const paquet = (conf.args ?? []).find((a) => /^@?[\w-]+\/[\w-]+@/.test(a) || /^@[\w-]+\//.test(a));
  outils.push({
    id: nom,
    titre: majuscule(nom),
    court: sansParentheses(phrases(TEXTES_OUTILS[nom] || pkg.description || 'Un outil de plus branché sur Claude.')[0]),
    detail: pkg.description ? `Écrit pour ia-kit : ${pkg.description}.` : paquet ? `Fourni par le paquet ${paquet}.` : '',
    tags: ['serveur MCP', ...(pkg.description && /lecture seule/.test(pkg.description) ? ['lecture seule'] : [])],
  });
}

// --- Gardiens : hooks et skills -------------------------------------------------------------
const MOMENTS = {
  SessionStart: 'Au début de chaque conversation',
  UserPromptSubmit: 'À chaque message que tu envoies',
  PreToolUse: 'Avant chaque outil utilisé par Claude',
  PostToolUse: 'Après chaque outil utilisé par Claude',
  Stop: 'À la fin de chaque réponse',
  SubagentStop: "À la fin du travail d'un agent",
  PreCompact: 'Avant que la conversation soit résumée',
  Notification: 'Quand Claude envoie une notification',
};
// Première phrase du premier commentaire d'un script (après la ligne #!).
function descriptionScript(texte) {
  for (const ligne of (texte ?? '').split('\n').slice(1)) {
    const m = ligne.match(/^\s*(?:\/\/|#)\s?(.*\S)/);
    if (m) return sansParentheses(phrases(m[1])[0] ?? '');
  }
  return '';
}
// Script à plusieurs modes (ex. projet-sync.sh debut|fin) : texte de la ligne « #   mode : … → ce qu'il fait ».
function descriptionMode(texte, mode) {
  const lignes = (texte ?? '').split('\n');
  const i = lignes.findIndex((l) => new RegExp(`^#\\s+${mode}\\s*:`).test(l));
  if (i < 0) return '';
  let bloc = lignes[i].replace(/^#\s+\w+\s*:\s*/, '');
  for (const l of lignes.slice(i + 1)) {
    if (!/^#\s{4,}\S/.test(l)) break;
    bloc += ' ' + l.replace(/^#\s+/, '');
  }
  const apres = bloc.split('→').pop().trim();
  return majuscule(sansParentheses(phrases(apres)[0] ?? apres));
}
const gardiens = [];
const hooks = JSON.parse(indexe(`${PLUGIN}/hooks/hooks.json`) ?? '{}').hooks ?? {};
for (const [evenement, groupes] of Object.entries(hooks)) {
  for (const g of groupes) {
    for (const h of g.hooks ?? []) {
      const scripts = [...(h.command ?? '').matchAll(/\$\{CLAUDE_PLUGIN_ROOT\}\/([^"\s]+\.(?:mjs|js|sh))"?\s*(\w+)?/g)]
        .filter((s) => !/\/node\.sh$/.test(s[1]));
      const s = scripts.at(-1);
      const chemin = s?.[1] ?? '';
      const mode = s?.[2] ? ` (mode ${s[2]})` : '';
      gardiens.push({
        id: `hook-${evenement}-${gardiens.length}`,
        titre: MOMENTS[evenement] ?? evenement,
        court: (s?.[2] && descriptionMode(indexe(`${PLUGIN}/${chemin}`), s[2])) || descriptionScript(indexe(`${PLUGIN}/${chemin}`)) || 'Script lancé automatiquement.',
        detail: `Script : ${chemin.split('/').pop()}${mode}.`,
        tags: ['hook', evenement],
      });
    }
  }
}
for (const f of fichiers) {
  const m = f.match(/^plugins\/ia-kit\/skills\/([^/]+)\/SKILL\.md$/);
  if (!m) continue;
  const e = entete(indexe(f));
  const ph = phrases(e.description).filter((p) => !/^À utiliser/.test(p));
  gardiens.push({
    id: `skill-${m[1]}`,
    titre: `Skill ${e.name || m[1]}`,
    court: ph[0] ?? '',
    detail: ph.slice(1).join(' ') + ' Il se déclenche tout seul quand la situation le demande.',
    tags: ['skill'],
  });
}

// --- Page -----------------------------------------------------------------------------------
const BRANCHES = [
  { id: 'equipe', titre: "L'équipe", intro: 'Les agents : des Claude spécialisés, chacun dans son métier.', items: agents, cote: 'gauche' },
  { id: 'outils', titre: 'Outils', intro: 'Des outils en plus que le plugin branche sur Claude.', items: outils, cote: 'gauche' },
  { id: 'cmd', titre: 'Commandes', intro: 'Ce que tu tapes dans Claude Code pour lancer quelque chose.', items: commandes, cote: 'droite' },
  { id: 'gardiens', titre: 'Gardiens', intro: 'Ils travaillent tout seuls, au bon moment, sans qu’on le demande.', items: gardiens, cote: 'droite' },
];

const item = (it) => `
        <li><details>
          <summary><span class="nom">${echappe(it.titre)}</span><span class="court">${echappe(it.court)}</span></summary>
          <div class="plus">${it.detail ? `<p>${echappe(it.detail)}</p>` : ''}<div class="tags">${it.tags.map((t) => `<span>${echappe(t)}</span>`).join('')}</div></div>
        </details></li>`;
const branche = (b) => `
    <section class="branche b-${b.id}" data-branche="${b.id}">
      <h2 class="bulle"><span>${echappe(b.titre)}</span><span class="nb">${b.items.length}</span></h2>
      <p class="intro">${echappe(b.intro)}</p>
      <ul>${b.items.map(item).join('')}
      </ul>
    </section>`;

const page = `<!doctype html>
<!-- Fichier généré par .githooks/carte.mjs à chaque commit : ne pas le modifier à la main. -->
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Carte d'ia-kit</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Outfit:wght@500;700;800&family=Inter:wght@400;500;600&display=swap">
<style>
/* Carte mentale : ia-kit au centre, deux branches de chaque côté, reliées par des courbes. */
:root {
  --bg: #F5F6FA; --carte: #FFFFFF; --texte: #1B2133; --doux: #5D6579; --trait: #DDE1EA;
  --equipe: #E2683C; --outils: #1C9A6C; --cmd: #2F6BD8; --gardiens: #7B55C9;
  --titre: "Outfit", "Avenir Next", system-ui, sans-serif;
  --corps: "Inter", system-ui, -apple-system, "Segoe UI", sans-serif;
  color-scheme: light;
}
@media (prefers-color-scheme: dark) {
  :root { --bg: #11141C; --carte: #1A1F2B; --texte: #E8EBF2; --doux: #9AA2B4; --trait: #2B3242;
    --equipe: #F2875F; --outils: #3CC492; --cmd: #6A97F0; --gardiens: #A585EC; color-scheme: dark; }
}
* { box-sizing: border-box; }
body { margin: 0; background: var(--bg); color: var(--texte); font: 15px/1.5 var(--corps); padding: 28px max(16px, 3vw) 48px; }
header { max-width: 1280px; margin: 0 auto 8px; text-align: center; }
header p { margin: 4px 0 0; color: var(--doux); }
.carte { position: relative; max-width: 1280px; margin: 0 auto; display: grid; grid-template-columns: minmax(0, 1fr) 220px minmax(0, 1fr); gap: 28px; align-items: center; }
svg.liens { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; overflow: visible; }
svg.liens path { fill: none; stroke-width: 4; stroke-linecap: round; opacity: .55; }
.colonne { display: flex; flex-direction: column; gap: 28px; min-width: 0; position: relative; z-index: 1; }
.centre { display: flex; justify-content: center; position: relative; z-index: 1; }
.coeur { width: 190px; height: 190px; border-radius: 50%; background: var(--texte); color: var(--bg); display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; box-shadow: 0 0 0 10px var(--carte), 0 0 0 11px var(--trait); }
.coeur strong { font: 800 34px/1 var(--titre); }
.coeur small { margin-top: 6px; font-size: 13px; opacity: .8; }
.branche { --c: var(--texte); background: var(--carte); border: 1px solid var(--trait); border-radius: 18px; padding: 16px 18px 14px; }
.b-equipe { --c: var(--equipe); } .b-outils { --c: var(--outils); } .b-cmd { --c: var(--cmd); } .b-gardiens { --c: var(--gardiens); }
.bulle { margin: 0; display: inline-flex; align-items: center; gap: 10px; background: var(--c); color: #fff; font: 700 20px/1 var(--titre); padding: 9px 16px; border-radius: 999px; }
.bulle .nb { background: rgba(255,255,255,.25); border-radius: 999px; font-size: 13px; padding: 3px 8px; }
.intro { margin: 8px 0 10px; color: var(--doux); font-size: 14px; }
ul { list-style: none; margin: 0; padding: 0 0 0 14px; border-left: 3px solid color-mix(in srgb, var(--c) 45%, transparent); display: flex; flex-direction: column; gap: 4px; }
li { position: relative; }
li::before { content: ""; position: absolute; left: -14px; top: 19px; width: 11px; height: 3px; background: color-mix(in srgb, var(--c) 45%, transparent); }
summary { list-style: none; cursor: pointer; display: flex; flex-direction: column; padding: 7px 34px 7px 10px; border-radius: 10px; position: relative; }
summary::-webkit-details-marker { display: none; }
summary::after { content: "+"; position: absolute; right: 10px; top: 6px; font: 700 18px/1 var(--titre); color: var(--c); transition: transform .2s; }
details[open] summary::after { transform: rotate(45deg); }
summary:hover, summary:focus-visible { background: color-mix(in srgb, var(--c) 10%, transparent); outline: none; }
summary:focus-visible { box-shadow: 0 0 0 2px var(--c); }
.nom { font: 700 16px/1.3 var(--titre); }
.court { color: var(--doux); font-size: 14px; }
.plus { padding: 2px 10px 10px; display: flex; flex-direction: column; gap: 8px; }
.plus p { margin: 0; font-size: 14px; }
.tags { display: flex; flex-wrap: wrap; gap: 6px; }
.tags span { font-size: 12px; border: 1px solid var(--trait); border-radius: 999px; padding: 1px 9px; color: var(--doux); }
footer { max-width: 1280px; margin: 28px auto 0; text-align: center; color: var(--doux); font-size: 13px; }
@media (max-width: 860px) {
  .carte { grid-template-columns: minmax(0, 1fr); }
  .centre { order: -1; }
  .coeur { width: 140px; height: 140px; }
  .coeur strong { font-size: 26px; }
  svg.liens { display: none; }
}
@media (prefers-reduced-motion: reduce) { summary::after { transition: none; } }
</style>
</head>
<body>
<header>
  <p>Clique sur un élément pour lire ce qu'il fait.</p>
</header>
<main class="carte" id="carte">
  <svg class="liens" id="liens" aria-hidden="true"></svg>
  <div class="colonne">${BRANCHES.filter((b) => b.cote === 'gauche').map(branche).join('')}
  </div>
  <div class="centre"><div class="coeur" id="coeur"><strong>ia-kit</strong><small>ton plugin</small></div></div>
  <div class="colonne">${BRANCHES.filter((b) => b.cote === 'droite').map(branche).join('')}
  </div>
</main>
<footer>Carte refaite automatiquement à chaque commit du dépôt ia, à partir des fichiers du plugin.</footer>
<script>
(function () {
  var carte = document.getElementById('carte'), svg = document.getElementById('liens'), coeur = document.getElementById('coeur');
  function dessiner() {
    var base = carte.getBoundingClientRect(), c = coeur.getBoundingClientRect();
    var cx = c.left + c.width / 2 - base.left, cy = c.top + c.height / 2 - base.top;
    var traits = '';
    document.querySelectorAll('.branche').forEach(function (b) {
      var bulle = b.querySelector('.bulle').getBoundingClientRect();
      var gauche = bulle.left + bulle.width / 2 < cx + base.left;
      var x = (gauche ? b.getBoundingClientRect().right : b.getBoundingClientRect().left) - base.left;
      var y = bulle.top + bulle.height / 2 - base.top;
      var mx = (cx + x) / 2;
      var couleur = getComputedStyle(b).getPropertyValue('--c');
      traits += '<path d="M' + cx + ' ' + cy + ' C' + mx + ' ' + cy + ' ' + mx + ' ' + y + ' ' + x + ' ' + y + '" stroke="' + couleur + '"/>';
    });
    svg.innerHTML = traits;
  }
  dessiner();
  if (window.ResizeObserver) new ResizeObserver(dessiner).observe(carte);
  window.addEventListener('resize', dessiner);
})();
</script>
</body>
</html>
`;

writeFileSync('carte.html', page);
