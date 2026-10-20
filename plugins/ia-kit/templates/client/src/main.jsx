import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router';
import { z } from 'zod';
import './index.css';
import { router } from './router.jsx';

// Messages de Zod en français par défaut (filet de sécurité : chaque schéma donne ses propres messages clairs)
z.config(z.locales.fr());

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
