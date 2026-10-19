import { Outlet } from 'react-router';

// Cadre commun à toutes les pages : la page courante s'affiche à la place de <Outlet />.
export default function Layout() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <main className="mx-auto max-w-4xl p-6">
        <Outlet />
      </main>
    </div>
  );
}
