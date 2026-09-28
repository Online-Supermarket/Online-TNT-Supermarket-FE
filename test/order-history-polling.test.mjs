import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const page = await readFile(new URL('../src/pages/customer/OrderHistoryPage.jsx', import.meta.url), 'utf8');
test('order history stops repeated polling after an API failure', () => {
  assert.match(page, /setPollingEnabled\(false\)/);
  assert.match(page, /if \(!pollingEnabled\) return undefined/);
});
