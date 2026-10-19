import request from 'supertest';
import { describe, expect, it } from 'vitest';
import app from '../src/app.js';

describe('GET /api/health', () => {
  it("répond que l'API fonctionne", async () => {
    const res = await request(app).get('/api/health');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });

  it('renvoie 404 sur une route inconnue', async () => {
    const res = await request(app).get('/api/inconnue');

    expect(res.status).toBe(404);
  });
});
