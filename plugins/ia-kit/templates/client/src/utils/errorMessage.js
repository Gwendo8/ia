import { ApiError } from '../services/api.js';

// Transforme une erreur en phrase compréhensible par l'utilisateur.
// Jamais de message technique à l'écran (« Failed to fetch », « Internal Server Error »…).
const GENERIC = 'Une erreur est survenue. Réessayez dans un instant.';

const messagesByStatus = {
  0: 'Impossible de joindre le serveur. Vérifiez votre connexion, puis réessayez.',
  401: 'Votre session a expiré. Reconnectez-vous.',
  403: "Vous n'avez pas les droits pour faire cette action.",
  404: "Cet élément n'existe pas ou a été supprimé.",
  429: 'Trop de tentatives. Patientez quelques minutes, puis réessayez.',
};

export function getErrorMessage(error) {
  if (!(error instanceof ApiError)) return GENERIC;
  // 400 et 409 : messages métier rédigés en français clair par le back (ex. « Cet email est déjà utilisé »)
  if (error.status === 400) {
    return error.details.length > 0 ? 'Certains champs sont à corriger.' : error.message;
  }
  if (error.status === 409) return error.message;
  return messagesByStatus[error.status] ?? GENERIC;
}

// Erreurs à afficher sous chaque champ d'un formulaire : { email: 'Adresse email invalide', … }
export function getFieldErrors(error) {
  if (!(error instanceof ApiError)) return {};

  const fields = {};
  for (const issue of error.details) {
    const field = issue.path?.join('.');
    if (field && !fields[field]) fields[field] = issue.message;
  }
  return fields;
}
