import { Router } from 'express';
import healthRoutes from './health.routes.js';

// Point d'entrée de toutes les routes de l'API : un router par domaine.
const router = Router();

router.use('/health', healthRoutes);

export default router;
