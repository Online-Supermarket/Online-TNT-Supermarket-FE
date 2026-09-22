import test from 'node:test';
import assert from 'node:assert/strict';
import { api } from '../src/api.js';

test('api returns parsed JSON for successful requests', async () => {
  global.fetch = async () => new Response(JSON.stringify({ id: 'product-1' }), { status: 200 });
  assert.deepEqual(await api('/products'), { id: 'product-1' });
});

test('api returns null for a 204 response', async () => {
  global.fetch = async () => new Response(null, { status: 204 });
  assert.equal(await api('/logout'), null);
});

test('api surfaces API error messages', async () => {
  global.fetch = async () => new Response(JSON.stringify({ message: 'SKU already exists.' }), { status: 409 });
  await assert.rejects(api('/products'), { message: 'SKU already exists.' });
});
