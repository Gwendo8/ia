import { env } from '../config/env.js';

// Dernier middleware : transforme toute erreur en réponse JSON.
// eslint-disable-next-line no-unused-vars -- Express reconnaît ce middleware grâce à ses 4 paramètres
export function errorHandler(err, req, res, next) {
  const status = err.status ?? 500;

  if (status >= 500) console.error(err);

  res.status(status).json({
    error: {
      message: status >= 500 && env.NODE_ENV === 'production' ? 'Erreur serveur' : err.message,
      ...(err.details && { details: err.details }),
    },
  });
}
