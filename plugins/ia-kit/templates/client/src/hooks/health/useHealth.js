import { useEffect, useState } from 'react';
import { getHealth } from '../../services/health/healthService.js';

// Indique si l'API répond : 'loading', 'ok' ou 'error'.
export function useHealth() {
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    getHealth()
      .then(() => setStatus('ok'))
      .catch(() => setStatus('error'));
  }, []);

  return status;
}
