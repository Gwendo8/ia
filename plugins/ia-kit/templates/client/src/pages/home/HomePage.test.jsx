import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import HomePage from './HomePage.jsx';

describe('HomePage', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("affiche que l'API est connectée", async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ status: 'ok' })));

    render(<HomePage />);

    expect(await screen.findByText('API connectée')).toBeInTheDocument();
  });

  it("affiche que l'API est injoignable", async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('réseau')));

    render(<HomePage />);

    expect(await screen.findByText('API injoignable')).toBeInTheDocument();
  });
});
