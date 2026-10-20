const BASE_URL = `${import.meta.env.VITE_API_URL ?? ''}/api`;

// Erreur lancée par apiFetch : garde le code HTTP et le détail des champs refusés par l'API.
// Ne jamais afficher error.message tel quel : passer par utils/errorMessage.js.
export class ApiError extends Error {
  constructor(status, message, details = []) {
    super(message);
    this.status = status; // 0 = serveur injoignable (réseau coupé, API arrêtée)
    this.details = details;
  }
}

// Appel à l'API : renvoie le JSON, ou lance une ApiError.
export async function apiFetch(path, options = {}) {
  let response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      ...options,
      headers: { 'Content-Type': 'application/json', ...options.headers },
    });
  } catch {
    throw new ApiError(0, 'Serveur injoignable');
  }

  const data = response.status === 204 ? null : await response.json().catch(() => null);

  if (!response.ok) {
    throw new ApiError(
      response.status,
      data?.error?.message ?? `Erreur ${response.status}`,
      data?.error?.details ?? [],
    );
  }
  return data;
}
