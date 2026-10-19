import { Link } from 'react-router';

export default function NotFoundPage() {
  return (
    <section className="space-y-2">
      <h1 className="text-2xl font-semibold">Page introuvable</h1>
      <Link to="/" className="text-blue-700 underline">
        Retour à l’accueil
      </Link>
    </section>
  );
}
