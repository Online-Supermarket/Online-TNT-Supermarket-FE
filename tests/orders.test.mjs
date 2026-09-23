// tests/orders.test.mjs
// Frontend unit tests for admin order management pipeline logic
// Run with: node tests/orders.test.mjs

let passed = 0, failed = 0;

function assert(description, condition) {
  if (condition) {
    console.log(`  ✓ ${description}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${description}`);
    failed++;
  }
}

// ── Status configuration & badge tests ─────────────────────────────────────
const statusConfig = {
  Confirmed: { label: 'Confirmed', cancellable: true },
  PendingReservation: { label: 'Pending Reservation', cancellable: false },
  CancellationPending: { label: 'Cancellation Pending', cancellable: false },
  Cancelled: { label: 'Cancelled', cancellable: false },
  Rejected: { label: 'Rejected', cancellable: false },
};

console.log('=== Order Status Rules ===');
assert('Confirmed is marked as cancellable', statusConfig.Confirmed.cancellable === true);
assert('PendingReservation cannot be cancelled directly', statusConfig.PendingReservation.cancellable === false);
assert('Cancelled orders cannot be cancelled again', statusConfig.Cancelled.cancellable === false);
assert('CancellationPending cannot be re-cancelled', statusConfig.CancellationPending.cancellable === false);

// ── KPI Summary Calculations ───────────────────────────────────────────────
const sampleOrders = [
  { id: '1', status: 'Confirmed', total: 100.50, createdAt: '2026-09-20T10:00:00Z' },
  { id: '2', status: 'Confirmed', total: 49.50, createdAt: '2026-09-21T11:00:00Z' },
  { id: '3', status: 'PendingReservation', total: 25.00, createdAt: '2026-09-22T09:00:00Z' },
  { id: '4', status: 'Cancelled', total: 75.00, createdAt: '2026-09-22T12:00:00Z' },
  { id: '5', status: 'Rejected', total: 15.00, createdAt: '2026-09-22T14:00:00Z' },
];

const sampleSalesReport = {
  orderCount: 5,
  recognizedSales: 150.00,
  tax: 12.00,
  deliveryFee: 15.00,
  generatedAt: '2026-09-23T00:00:00Z',
};

const calcKpis = (orders, report) => {
  const confirmed = orders.filter(o => o.status === 'Confirmed');
  const pending = orders.filter(o => o.status === 'PendingReservation');
  const cancelled = orders.filter(o => o.status === 'Cancelled' || o.status === 'CancellationPending');
  const recognizedSales = report?.recognizedSales !== undefined
    ? Number(report.recognizedSales)
    : confirmed.reduce((sum, o) => sum + Number(o.total || 0), 0);
  const totalTaxAndFees = Number(report?.tax || 0) + Number(report?.deliveryFee || 0);

  return {
    totalOrders: orders.length,
    confirmedCount: confirmed.length,
    pendingCount: pending.length,
    cancelledCount: cancelled.length,
    recognizedSales,
    totalTaxAndFees,
  };
};

console.log('\n=== Order KPI Calculations ===');
const kpis = calcKpis(sampleOrders, sampleSalesReport);
assert('Total orders count = 5', kpis.totalOrders === 5);
assert('Confirmed orders count = 2', kpis.confirmedCount === 2);
assert('Pending count = 1', kpis.pendingCount === 1);
assert('Cancelled count = 1', kpis.cancelledCount === 1);
assert('Recognized revenue = $150.00', kpis.recognizedSales === 150.00);
assert('Tax + Delivery fees = $27.00', kpis.totalTaxAndFees === 27.00);

// ── Search & Filter Logic ──────────────────────────────────────────────────
console.log('\n=== Filter & Search Logic ===');
const filterOrders = (orders, search, statusFilter) => {
  let rows = orders;
  if (search.trim()) {
    const q = search.trim().toLowerCase();
    rows = rows.filter(o =>
      (o.id && o.id.toLowerCase().includes(q)) ||
      (o.customerId && o.customerId.toLowerCase().includes(q)) ||
      (o.status && o.status.toLowerCase().includes(q))
    );
  }
  if (statusFilter && statusFilter !== 'All') {
    rows = rows.filter(o => o.status === statusFilter);
  }
  return rows;
};

assert('Filter All returns 5 orders', filterOrders(sampleOrders, '', 'All').length === 5);
assert('Filter Confirmed returns 2 orders', filterOrders(sampleOrders, '', 'Confirmed').length === 2);
assert('Filter PendingReservation returns 1 order', filterOrders(sampleOrders, '', 'PendingReservation').length === 1);
assert('Search by status "cancelled" returns 1 order', filterOrders(sampleOrders, 'cancelled', 'All').length === 1);
assert('Search non-existent returns 0 orders', filterOrders(sampleOrders, 'non-existent', 'All').length === 0);

// ── Cancel Order Validation ─────────────────────────────────────────────────
console.log('\n=== Cancel Order Validations ===');
const validateCancellation = (order, reason) => {
  if (!order) return { valid: false, error: 'No order selected.' };
  if (order.status !== 'Confirmed') {
    return { valid: false, error: 'Only confirmed orders can be cancelled.' };
  }
  if (!reason || !reason.trim()) {
    return { valid: false, error: 'Cancellation reason is required.' };
  }
  return { valid: true };
};

assert('Valid cancellation passes', validateCancellation(sampleOrders[0], 'Customer request').valid === true);
assert('Empty reason fails validation', validateCancellation(sampleOrders[0], '').valid === false);
assert('Whitespace-only reason fails validation', validateCancellation(sampleOrders[0], '   ').valid === false);
assert('Cancelling non-confirmed order fails validation', validateCancellation(sampleOrders[2], 'Reason').valid === false);

// ── Sorting Logic ──────────────────────────────────────────────────────────
console.log('\n=== Sorting Logic ===');
const sortOrders = (orders, sortKey, sortDir) => {
  return [...orders].sort((a, b) => {
    let av = a[sortKey], bv = b[sortKey];
    if (sortKey === 'createdAt') {
      av = new Date(av).getTime();
      bv = new Date(bv).getTime();
    } else if (sortKey === 'total') {
      av = Number(av || 0);
      bv = Number(bv || 0);
    }
    if (av < bv) return sortDir === 'asc' ? -1 : 1;
    if (av > bv) return sortDir === 'asc' ? 1 : -1;
    return 0;
  });
};

const sortedByTotalDesc = sortOrders(sampleOrders, 'total', 'desc');
assert('Sorted by total desc: highest first ($100.50)', sortedByTotalDesc[0].total === 100.50);
assert('Sorted by total desc: lowest last ($15.00)', sortedByTotalDesc[4].total === 15.00);

const sortedByTotalAsc = sortOrders(sampleOrders, 'total', 'asc');
assert('Sorted by total asc: lowest first ($15.00)', sortedByTotalAsc[0].total === 15.00);
assert('Sorted by total asc: highest last ($100.50)', sortedByTotalAsc[4].total === 100.50);

// ── Results ────────────────────────────────────────────────────────────────
console.log(`\nResults: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
