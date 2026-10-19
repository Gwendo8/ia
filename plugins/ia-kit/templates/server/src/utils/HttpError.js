// Erreur avec un code HTTP, à lancer depuis les services ou les controllers.
// Exemple : throw new HttpError(404, 'Utilisateur introuvable');
export class HttpError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}
