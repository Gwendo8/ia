import cors from 'cors';
import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { env } from './config/env.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { notFound } from './middlewares/notFound.js';
import routes from './routes/index.js';

const app = express();

// Sécurité de base
app.use(helmet());
app.use(cors({ origin: env.CORS_ORIGIN }));
app.use(
  '/api',
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 300,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
  }),
);

app.use(express.json({ limit: '100kb' }));

app.use('/api', routes);

app.use(notFound);
app.use(errorHandler);

export default app;
