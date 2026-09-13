import { describe, expect, it } from 'vitest';
import api from './api';

describe('api axios client', () => {
  it('attaches the stored bearer token to outgoing requests', async () => {
    localStorage.setItem('tnt_token', 'test-access-token');

    const handler = api.interceptors.request.handlers[0].fulfilled;
    const config = await handler({ headers: {} });

    expect(config.headers.Authorization).toBe('Bearer test-access-token');
  });
});
