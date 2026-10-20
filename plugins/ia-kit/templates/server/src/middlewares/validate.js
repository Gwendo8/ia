import { z } from 'zod';
import { HttpError } from '../utils/HttpError.js';

// Messages de Zod en français par défaut. Filet de sécurité : chaque schéma donne ses propres messages clairs
// (ex. z.email({ error: 'Adresse email invalide' })), car ceux de Zod restent techniques.
z.config(z.locales.fr());

// Vérifie la requête avec des schémas Zod avant d'appeler le controller.
// Exemple : router.post('/', validate({ body: createUserSchema }), controller.create);
// Les données vérifiées sont dans req.validated.body / .query / .params.
export function validate(schemas) {
  return (req, res, next) => {
    req.validated = {};

    for (const part of ['body', 'query', 'params']) {
      if (!schemas[part]) continue;

      const result = schemas[part].safeParse(req[part]);
      if (!result.success) {
        return next(new HttpError(400, 'Données invalides', result.error.issues));
      }
      req.validated[part] = result.data;
    }

    next();
  };
}
