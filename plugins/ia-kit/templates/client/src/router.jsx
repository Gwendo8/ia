import { createBrowserRouter } from 'react-router';
import Layout from './components/layout/Layout.jsx';
import HomePage from './pages/home/HomePage.jsx';
import NotFoundPage from './pages/not-found/NotFoundPage.jsx';

// Toutes les pages de l'application. Ajouter une route = ajouter une entrée dans children.
export const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { path: '/', element: <HomePage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);
