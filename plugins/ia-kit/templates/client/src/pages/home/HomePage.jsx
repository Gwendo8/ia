import { useHealth } from '../../hooks/health/useHealth.js';

const messages = {
  loading: { text: 'Connexion à l’API…', className: 'text-gray-500' },
  ok: { text: 'API connectée', className: 'text-green-700' },
  error: { text: 'API injoignable', className: 'text-red-700' },
};

export default function HomePage() {
  const status = useHealth();
  const message = messages[status];

  return (
    <section className="space-y-2">
      <h1 className="text-2xl font-semibold">__NOM_PROJET__</h1>
      <p className={message.className}>{message.text}</p>
    </section>
  );
}
