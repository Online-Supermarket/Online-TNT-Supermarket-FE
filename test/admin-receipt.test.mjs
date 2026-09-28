import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const page = await readFile(new URL('../src/pages/admin/ManageOrders.jsx', import.meta.url), 'utf8');
test('admin receipt uses protected GET endpoint and prevents duplicate loads', () => {
  assert.match(page, /axiosInstance\.get\(`\/order\/orders\/\$\{orderId\}\/payment\/receipt`/);
  assert.match(page, /if \(receiptLoading\) return/);
  assert.match(page, /responseType: 'blob'/);
});
