// Serveur MCP « pgadmin » : présente des outils à Claude.
// Claude Code lance ce fichier, puis discute avec lui via l'entrée/sortie standard (stdio).
// Important : ne jamais écrire avec console.log, la sortie standard est réservée au dialogue avec Claude.
// Pour déboguer, utiliser console.error.

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { listerServeurs, trouverServeur } from './pgadmin.js';
import { avecConnexion } from './postgres.js';
import { ecritureAutorisee, verifierSql } from './securite.js';

const mcp = new McpServer({ name: 'pgadmin', version: '0.1.0' });

// Exécute le travail d'un outil et met le résultat au format attendu par Claude.
// En cas d'erreur, on renvoie le message (isError) au lieu de planter : Claude peut alors corriger.
async function repondre(travail) {
  try {
    const resultat = await travail();
    return { content: [{ type: 'text', text: JSON.stringify(resultat, null, 2) }] };
  } catch (erreur) {
    return { isError: true, content: [{ type: 'text', text: erreur.message }] };
  }
}

// Paramètre commun : le nom du serveur, tel que pgAdmin l'affiche.
const parametreServeur = z
  .string()
  .describe('Nom du serveur tel qu’il apparaît dans pgAdmin (voir lister_serveurs), par ex. « Local »');

// Un outil = un nom, une description (c'est elle que Claude lit pour savoir quand l'utiliser),
// les paramètres attendus, et une fonction qui fait le travail.
mcp.registerTool(
  'lister_serveurs',
  {
    title: 'Lister les serveurs pgAdmin',
    description:
      'Liste les serveurs PostgreSQL enregistrés dans pgAdmin (nom, groupe, hôte, port, utilisateur). ' +
      'À utiliser en premier pour savoir à quels serveurs on peut se connecter.',
    annotations: { readOnlyHint: true },
  },
  () => repondre(() => listerServeurs()),
);

mcp.registerTool(
  'lister_bases',
  {
    title: 'Lister les bases d’un serveur',
    description:
      'Liste les bases de données d’un serveur pgAdmin, avec leur taille. ' +
      'Les bases sont lues en direct sur le serveur : une base qui vient d’être créée apparaît tout de suite.',
    inputSchema: { serveur: parametreServeur },
    annotations: { readOnlyHint: true },
  },
  ({ serveur }) =>
    repondre(async () => {
      const infos = trouverServeur(serveur);
      return avecConnexion(infos, infos.base_par_defaut, async (client) => {
        const { rows } = await client.query(
          `SELECT datname AS base,
                  CASE WHEN has_database_privilege(datname, 'CONNECT')
                       THEN pg_size_pretty(pg_database_size(datname)) END AS taille
           FROM pg_database
           WHERE NOT datistemplate AND datallowconn
           ORDER BY datname`,
        );
        return rows;
      });
    }),
);

// Schémas internes de PostgreSQL, qu'on n'affiche pas.
const SCHEMAS_SYSTEME = `n.nspname NOT IN ('pg_catalog', 'information_schema') AND n.nspname NOT LIKE 'pg_toast%'`;

mcp.registerTool(
  'decrire_base',
  {
    title: 'Décrire les tables d’une base',
    description:
      'Décrit la structure d’une base : ses tables et vues, avec colonnes, types, nombre de lignes estimé, ' +
      'clés primaires, clés étrangères (liens entre tables) et contraintes d’unicité. ' +
      'Préciser `table` pour ne décrire qu’une seule table.',
    inputSchema: {
      serveur: parametreServeur,
      base: z.string().describe('Nom de la base (voir lister_bases)'),
      table: z.string().optional().describe('Nom d’une table précise, sans le schéma (facultatif)'),
    },
    annotations: { readOnlyHint: true },
  },
  ({ serveur, base, table }) =>
    repondre(async () => {
      const infos = trouverServeur(serveur);
      return avecConnexion(infos, base, async (client) => {
        // Le nom de table passe en paramètre ($1) et jamais collé dans le SQL : ça évite les injections.
        const colonnes = await client.query(
          `SELECT n.nspname AS schema, c.relname AS table,
                  CASE c.relkind WHEN 'v' THEN 'vue' WHEN 'm' THEN 'vue matérialisée' ELSE 'table' END AS genre,
                  c.reltuples::bigint AS lignes_estimees,
                  a.attname AS colonne, format_type(a.atttypid, a.atttypmod) AS type, a.attnotnull AS obligatoire
           FROM pg_class c
           JOIN pg_namespace n ON n.oid = c.relnamespace
           JOIN pg_attribute a ON a.attrelid = c.oid AND a.attnum > 0 AND NOT a.attisdropped
           WHERE c.relkind IN ('r', 'p', 'v', 'm') AND ${SCHEMAS_SYSTEME}
             AND ($1::text IS NULL OR c.relname = $1)
           ORDER BY n.nspname, c.relname, a.attnum`,
          [table ?? null],
        );
        const contraintes = await client.query(
          `SELECT n.nspname AS schema, c.relname AS table, pg_get_constraintdef(k.oid) AS definition
           FROM pg_constraint k
           JOIN pg_class c ON c.oid = k.conrelid
           JOIN pg_namespace n ON n.oid = c.relnamespace
           WHERE k.contype IN ('p', 'f', 'u') AND ${SCHEMAS_SYSTEME}
             AND ($1::text IS NULL OR c.relname = $1)
           ORDER BY k.contype, k.conname`,
          [table ?? null],
        );

        // On regroupe les lignes par table : { "public.clients": { colonnes: [...], contraintes: [...] } }
        const tables = {};
        for (const l of colonnes.rows) {
          const cle = `${l.schema}.${l.table}`;
          tables[cle] ??= {
            genre: l.genre,
            // -1 signifie que PostgreSQL n'a pas encore estimé la table (jamais analysée).
            lignes_estimees: l.lignes_estimees >= 0 ? Number(l.lignes_estimees) : 'inconnu',
            colonnes: [],
            contraintes: [],
          };
          tables[cle].colonnes.push({ nom: l.colonne, type: l.type, obligatoire: l.obligatoire });
        }
        for (const k of contraintes.rows) {
          tables[`${k.schema}.${k.table}`]?.contraintes.push(k.definition);
        }

        if (table && Object.keys(tables).length === 0) {
          throw new Error(`Table « ${table} » introuvable dans la base « ${base} ».`);
        }
        return tables;
      });
    }),
);

// Au-delà, on tronque le résultat : trop de lignes noieraient Claude sans rien apporter.
const LIGNES_MAX = 200;

mcp.registerTool(
  'requete',
  {
    title: 'Exécuter une requête SQL',
    description:
      'Exécute UNE instruction SQL sur une base. Lecture seule partout, sauf sur une base locale dont le nom ' +
      'se termine par « _test », où l’écriture est autorisée. ' +
      `Au plus ${LIGNES_MAX} lignes sont renvoyées : utiliser LIMIT, COUNT ou des agrégats pour les grosses tables. ` +
      'Les noms de tables ou colonnes avec des majuscules doivent être entre guillemets (ex. "User").',
    inputSchema: {
      serveur: parametreServeur,
      base: z.string().describe('Nom de la base (voir lister_bases)'),
      sql: z.string().describe('Une seule instruction SQL'),
    },
  },
  ({ serveur, base, sql }) =>
    repondre(async () => {
      const infos = trouverServeur(serveur);
      verifierSql(sql);
      const ecriture = ecritureAutorisee(infos, base);

      return avecConnexion(
        infos,
        base,
        async (client) => {
          // Lecture : transaction READ ONLY toujours annulée à la fin, donc rien ne peut être enregistré.
          // Base de test : transaction normale, validée à la fin.
          await client.query(ecriture ? 'BEGIN' : 'BEGIN READ ONLY');
          try {
            // queryMode « extended » : PostgreSQL refuse alors plusieurs instructions d'un coup
            // (impossible d'enchaîner « COMMIT; DELETE ... » pour sortir de la lecture seule).
            const resultat = await client.query({ text: sql, queryMode: 'extended' });
            await client.query(ecriture ? 'COMMIT' : 'ROLLBACK');

            const lignes = resultat.rows ?? [];
            return {
              mode: ecriture ? 'écriture (base de test)' : 'lecture seule',
              commande: resultat.command,
              lignes_concernees: resultat.rowCount,
              colonnes: resultat.fields?.map((f) => f.name) ?? [],
              lignes: lignes.slice(0, LIGNES_MAX),
              ...(lignes.length > LIGNES_MAX && {
                tronque: `${lignes.length} lignes au total, seules les ${LIGNES_MAX} premières sont affichées.`,
              }),
            };
          } catch (erreur) {
            await client.query('ROLLBACK').catch(() => {});
            throw traduireErreur(erreur, base);
          }
        },
        { ecriture },
      );
    }),
);

// Rend lisibles les deux refus de sécurité les plus fréquents (codes d'erreur PostgreSQL).
function traduireErreur(erreur, base) {
  if (erreur.code === '25006') {
    return new Error(
      `Écriture refusée : la base « ${base} » est en lecture seule. ` +
        'Seules les bases locales dont le nom se termine par « _test » acceptent l’écriture.',
    );
  }
  if (erreur.code === '42601' && /multiple commands/.test(erreur.message)) {
    return new Error('Une seule instruction SQL par appel : découper la requête en plusieurs appels.');
  }
  return erreur;
}

await mcp.connect(new StdioServerTransport());
