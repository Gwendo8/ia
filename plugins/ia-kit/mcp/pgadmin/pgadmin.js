// Lecture de la configuration de pgAdmin.
// pgAdmin range ses réglages (dont la liste des serveurs) dans une petite base SQLite.
// On l'ouvre en lecture seule : on ne modifie jamais rien chez pgAdmin.

import { DatabaseSync } from 'node:sqlite';
import { homedir } from 'node:os';
import { join } from 'node:path';

// L'emplacement dépend du système : %APPDATA%\pgAdmin sur Windows, ~/.pgadmin sur macOS et Linux.
// La variable PGADMIN_DB permet de forcer un autre chemin si besoin.
function cheminParDefaut() {
  if (process.platform === 'win32') {
    return join(process.env.APPDATA ?? join(homedir(), 'AppData', 'Roaming'), 'pgAdmin', 'pgadmin4.db');
  }
  return join(homedir(), '.pgadmin', 'pgadmin4.db');
}

const CHEMIN_PGADMIN = process.env.PGADMIN_DB ?? cheminParDefaut();

// Renvoie la liste des serveurs enregistrés dans pgAdmin.
// Volontairement, on ne lit PAS les mots de passe (ils sont chiffrés par pgAdmin).
export function listerServeurs() {
  const db = new DatabaseSync(CHEMIN_PGADMIN, { readOnly: true });
  try {
    return db
      .prepare(
        `SELECT s.name AS nom, g.name AS groupe, s.host AS hote, s.port,
                s.maintenance_db AS base_par_defaut, s.username AS utilisateur
         FROM server s
         LEFT JOIN servergroup g ON g.id = s.servergroup_id
         ORDER BY g.name, s.name`,
      )
      .all();
  } finally {
    db.close();
  }
}

// Retrouve un serveur par son nom dans pgAdmin, ou lève une erreur qui liste les noms possibles.
export function trouverServeur(nom) {
  const serveurs = listerServeurs();
  const serveur = serveurs.find((s) => s.nom === nom);
  if (!serveur) {
    const noms = serveurs.map((s) => s.nom).join(', ');
    throw new Error(`Serveur « ${nom} » introuvable dans pgAdmin. Serveurs disponibles : ${noms}`);
  }
  return serveur;
}
