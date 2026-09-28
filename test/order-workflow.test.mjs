import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const customerPage = await readFile(new URL('../src/pages/customer/OrderHistoryPage.jsx', import.meta.url), 'utf8');
const operationsPage = await readFile(new URL('../src/pages/admin/ManageOrders.jsx', import.meta.url), 'utf8');
const staffPage = await readFile(new URL('../src/pages/staff/StaffOrders.jsx', import.meta.url), 'utf8');

// The customer control must follow the canonical pending-only cancellation rule.
assert.match(customerPage, /selected\.status === 'Pending' && <button/);
assert.doesNotMatch(customerPage, /selected\.status === 'Confirmed' && <button/);

// ManageOrders is shared by the Admin and Staff routes, so these assertions cover both dashboards.
assert.match(operationsPage, /\['All', 'Pending', 'Confirmed', 'Delivery', 'Delivered', 'Cancelled', 'Rejected'\]/);
assert.doesNotMatch(operationsPage, /CancellationPending/);
assert.match(operationsPage, /const isPending = o\.status === 'Pending'/);
assert.match(operationsPage, /selectedOrder\.status === 'Pending' && \(/);
assert.match(operationsPage, /Confirm Pending Order/);
assert.match(operationsPage, /Reject Pending Order/);
assert.match(operationsPage, /\/order\/staff\/orders\/\$\{order\.id\}\/confirm/);
assert.match(operationsPage, /\/order\/staff\/orders\/\$\{order\.id\}\/reject/);
assert.match(operationsPage, /\/order\/staff\/riders\/available/);
assert.match(operationsPage, /Assign Rider/);
assert.match(operationsPage, /paymentMethod === 'BankTransfer' && o\.paymentStatus !== 'Verified'/);
assert.doesNotMatch(operationsPage, /Delete Order/);
assert.match(staffPage, /<ManageOrders\s*\/>/);

console.log('Order workflow UI tests passed');
