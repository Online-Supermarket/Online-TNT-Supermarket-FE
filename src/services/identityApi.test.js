import { describe, expect, it } from 'vitest';
import identityApi, { IDENTITY_API_URL } from './identityApi';

describe('identity axios client', () => {
  it('targets the API Gateway on port 5150 by default', () => {
    expect(IDENTITY_API_URL).toBe('http://localhost:5150');
    expect(identityApi.defaults.baseURL).toBe('http://localhost:5150');
  });

  it('attaches the stored bearer token to Identity requests', async () => {
    localStorage.setItem('tnt_token', 'test-access-token');

    const handler = identityApi.interceptors.request.handlers[0].fulfilled;
    const config = await handler({ headers: {} });

    expect(config.headers.Authorization).toBe('Bearer test-access-token');
  });
});
