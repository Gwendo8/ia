// Règles de sécurité du MCP : qui a le droit d'écrire, et ce qu'on refuse toujours.
//
// Règle : aucune écriture, sur aucune base, SAUF une base de test :
//   - son nom se termine par « _test » (ex. Quizz_test)
//   - ET elle est sur un serveur local (jamais dev, staging ou prod, même pour une base _test).

const HOTES_LOCAUX = ['localhost', '127.0.0.1', '::1'];

export function estServeurLocal(serveur) {
  // Un hôte vide ou commençant par « / » désigne une connexion locale par socket.
  return !serveur.hote || serveur.hote.startsWith('/') || HOTES_LOCAUX.includes(serveur.hote);
}

export function ecritureAutorisee(serveur, base) {
  return estServeurLocal(serveur) && /_test$/i.test(base);
}

// Fonctions et commandes qui peuvent agir HORS de la base (fichiers, programmes, autres connexions)
// ou sur les autres sessions. La lecture seule de PostgreSQL ne les bloque pas toutes,
// surtout avec un compte administrateur : on les refuse donc d'office.
// C'est un garde-fou contre les erreurs, pas une garantie absolue : pour ça, il faut un compte
// PostgreSQL qui n'a que le droit de lire.
const MOTS_INTERDITS =
  /\b(copy|lo_import|lo_export|dblink\w*|pg_read_file|pg_read_binary_file|pg_ls_dir|pg_terminate_backend|pg_cancel_backend|pg_reload_conf)\b/i;

export function verifierSql(sql) {
  const trouve = sql.match(MOTS_INTERDITS);
  if (trouve) {
    throw new Error(`Requête refusée : « ${trouve[0]} » est interdit par le MCP (action hors de la base).`);
  }
}
