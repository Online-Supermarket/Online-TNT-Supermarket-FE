import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('admin login resolves to the existing dashboard route', async () => {
  const login = await read('src/pages/auth/LoginPage.jsx');
  const roles = await read('src/utils/roles.js');
  assert.match(login, /roleHome\(role\)/);
  assert.match(roles, /Admin:\s*'\/admin\/dashboard'/);
});

test('account navigation uses the active role home instead of customer orders', async () => {
  const navbar = await read('src/components/Navbar.jsx');
  assert.match(navbar, /to=\{roleHome\(activeRole\)\}/);
  assert.doesNotMatch(navbar, /<Link to="\/orders"/);
});

test('order history remains customer-only and stale 401 sessions are cleared', async () => {
  const app = await read('src/App.jsx');
  const axios = await read('src/services/axiosInstance.js');
  assert.match(app, /path="\/orders"[\s\S]*allowedRoles=\{\['Customer'\]\}/);
  assert.match(axios, /status === 401/);
  assert.match(axios, /removeItem\('marketflowToken'\)/);
});
