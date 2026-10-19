import { HttpError } from '../utils/HttpError.js';

export function notFound(req, res, next) {
  next(new HttpError(404, `Route introuvable : ${req.method} ${req.originalUrl}`));
}
