const BASE_URL = `${import.meta.env.VITE_API_URL ?? ''}/api`;

// Appel à l'API : renvoie le JSON, ou lance une erreur avec le message renvoyé par le serveur.
export async function apiFetch(path, options = {}) {
  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options.headers },
  });

  const data = response.status === 204 ? null : await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.error?.message ?? `Erreur ${response.status}`);
  }
  return data;
}
