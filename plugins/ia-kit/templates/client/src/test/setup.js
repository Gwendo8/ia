import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// Démonte les composants après chaque test
afterEach(() => {
  cleanup();
});
