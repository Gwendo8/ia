import { z } from 'zod';

// Variables d'environnement vérifiées au démarrage : on s'arrête tout de suite si l'une manque.
const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z.url(),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
});

const result = schema.safeParse(process.env);

if (!result.success) {
  throw new Error(
    `Variables d'environnement invalides (voir .env.example) :\n${z.prettifyError(result.error)}`,
  );
}

export const env = result.data;
