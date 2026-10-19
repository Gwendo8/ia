import { apiFetch } from '../api.js';

export function getHealth() {
  return apiFetch('/health');
}
