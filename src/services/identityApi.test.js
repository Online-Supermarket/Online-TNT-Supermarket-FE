import { describe, expect, it } from 'vitest';
import identityApi, { IDENTITY_API_URL } from './identityApi';

describe('identity axios client', () => {
  it('targets the Identity service on port 5010 by default', () => {
    expect(IDENTITY_API_URL).toBe('http://localhost:5010');
    expect(identityApi.defaults.baseURL).toBe('http://localhost:5010');
  });

  it('attaches the stored bearer token to Identity requests', async () => {
    localStorage.setItem('tnt_token', 'test-access-token');

    const handler = identityApi.interceptors.request.handlers[0].fulfilled;
    const config = await handler({ headers: {} });

    expect(config.headers.Authorization).toBe('Bearer test-access-token');
  });
});
