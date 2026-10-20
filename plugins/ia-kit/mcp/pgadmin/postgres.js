// Connexion à PostgreSQL, toujours en lecture seule.

import pg from 'pg';
import pgpass from 'pgpass';

// Les mots de passe ne sont jamais stockés ici : on les cherche dans le fichier standard
// de PostgreSQL (~/.pgpass sur macOS/Linux, %APPDATA%\postgresql\pgpass.conf sur Windows).
// En local, souvent aucun mot de passe n'est demandé et ce fichier n'est pas nécessaire.
function chercherMotDePasse(parametres) {
  return () => new Promise((resolve) => pgpass(parametres, (mdp) => resolve(mdp ?? '')));
}

// Ouvre une connexion à `base` sur le serveur pgAdmin `serveur`, exécute `travail`, puis ferme.
// Lecture seule par défaut ; `ecriture: true` n'est passé que pour une base de test (voir securite.js).
export async function avecConnexion(serveur, base, travail, { ecriture = false } = {}) {
  const parametres = {
    host: serveur.hote,
    port: serveur.port,
    database: base,
    user: serveur.utilisateur,
  };
  const client = new pg.Client({
    ...parametres,
    password: chercherMotDePasse(parametres),
    connectionTimeoutMillis: 10_000,
    // Sécurité côté PostgreSQL : écriture refusée (hors base de test), et une requête est coupée après 30 s.
    options: ecriture
      ? '-c statement_timeout=30000'
      : '-c default_transaction_read_only=on -c statement_timeout=30000',
    application_name: 'pgadmin-mcp',
  });
  await client.connect();
  try {
    return await travail(client);
  } finally {
    await client.end();
  }
}
