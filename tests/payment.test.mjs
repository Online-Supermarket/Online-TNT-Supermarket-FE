// tests/payment.test.mjs
// Frontend unit tests for Bank Transfer payment flow, receipt validation, and confirmation guard
// Run with: node tests/payment.test.mjs

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

// ── 1. Payment Method & Label Mapping ─────────────────────────────────────────
console.log('=== 1. Payment Method & Label Mapping ===');
const paymentLabel = (method) => method === 'BankTransfer' ? 'Bank Transfer' : 'Cash on Delivery';

assert('BankTransfer maps to "Bank Transfer"', paymentLabel('BankTransfer') === 'Bank Transfer');
assert('CashOnDelivery maps to "Cash on Delivery"', paymentLabel('CashOnDelivery') === 'Cash on Delivery');
assert('COD maps to "Cash on Delivery"', paymentLabel('COD') === 'Cash on Delivery');

// ── 2. Receipt File Validation ────────────────────────────────────────────────
console.log('\n=== 2. Receipt File Validation ===');
const validateReceiptFile = (file) => {
  if (!file) {
    return { valid: false, error: 'A payment receipt PDF is required for Bank Transfer.' };
  }
  const isPdf = file.type === 'application/pdf' || (file.name && file.name.toLowerCase().endsWith('.pdf'));
  if (!isPdf) {
    return { valid: false, error: 'Only PDF documents (.pdf) are accepted as payment receipts.' };
  }
  const maxBytes = 5 * 1024 * 1024;
  if (file.size > maxBytes) {
    return { valid: false, error: `Receipt PDF exceeds the 5 MB limit (${(file.size / (1024 * 1024)).toFixed(1)} MB).` };
  }
  return { valid: true, error: null };
};

assert('Valid 1MB PDF passes validation', validateReceiptFile({ name: 'receipt.pdf', type: 'application/pdf', size: 1024 * 1024 }).valid === true);
assert('Valid 4.9MB PDF passes validation', validateReceiptFile({ name: 'slip.pdf', type: 'application/pdf', size: 4.9 * 1024 * 1024 }).valid === true);
assert('No file selected fails validation', validateReceiptFile(null).valid === false);
assert('JPEG file fails validation', validateReceiptFile({ name: 'receipt.jpg', type: 'image/jpeg', size: 500 * 1024 }).valid === false);
assert('PNG file fails validation', validateReceiptFile({ name: 'receipt.png', type: 'image/png', size: 500 * 1024 }).valid === false);
assert('PDF over 5MB fails validation', validateReceiptFile({ name: 'huge_receipt.pdf', type: 'application/pdf', size: 6 * 1024 * 1024 }).valid === false);

// ── 3. Bank Transfer Confirmation Guard ───────────────────────────────────────
console.log('\n=== 3. Bank Transfer Confirmation Guard ===');
const canConfirmOrder = (order) => {
  if (!order || order.status !== 'Pending') return false;
  if (order.paymentMethod === 'BankTransfer') {
    return order.paymentStatus === 'Verified';
  }
  return true; // Cash on delivery
};

const pendingCodOrder = { id: 'ord-1', status: 'Pending', paymentMethod: 'CashOnDelivery', paymentStatus: 'NotRequired' };
const pendingBtOrderPendingPayment = { id: 'ord-2', status: 'Pending', paymentMethod: 'BankTransfer', paymentStatus: 'PendingVerification' };
const pendingBtOrderVerifiedPayment = { id: 'ord-3', status: 'Pending', paymentMethod: 'BankTransfer', paymentStatus: 'Verified' };
const pendingBtOrderRejectedPayment = { id: 'ord-4', status: 'Pending', paymentMethod: 'BankTransfer', paymentStatus: 'Rejected' };
const confirmedBtOrder = { id: 'ord-5', status: 'Confirmed', paymentMethod: 'BankTransfer', paymentStatus: 'Verified' };

assert('Pending COD order CAN be confirmed directly', canConfirmOrder(pendingCodOrder) === true);
assert('Pending Bank Transfer order with PendingVerification CANNOT be confirmed', canConfirmOrder(pendingBtOrderPendingPayment) === false);
assert('Pending Bank Transfer order with Verified payment CAN be confirmed', canConfirmOrder(pendingBtOrderVerifiedPayment) === true);
assert('Pending Bank Transfer order with Rejected payment CANNOT be confirmed', canConfirmOrder(pendingBtOrderRejectedPayment) === false);
assert('Already Confirmed order cannot be confirmed again', canConfirmOrder(confirmedBtOrder) === false);

// ── 4. Staff Payment Rejection Validation ─────────────────────────────────────
console.log('\n=== 4. Staff Payment Rejection Validation ===');
const validatePaymentRejection = (reason) => {
  if (!reason || !reason.trim()) {
    return { valid: false, error: 'Rejection reason is required.' };
  }
  return { valid: true, reason: reason.trim() };
};

assert('Valid rejection reason passes', validatePaymentRejection('Unclear slip').valid === true);
assert('Empty rejection reason fails', validatePaymentRejection('').valid === false);
assert('Whitespace-only rejection reason fails', validatePaymentRejection('   ').valid === false);
assert('Null rejection reason fails', validatePaymentRejection(null).valid === false);

// ── 5. Payment Status Badge Formatting ────────────────────────────────────────
console.log('\n=== 5. Payment Status Badge Formatting ===');
const getPaymentBadgeInfo = (method, status) => {
  if (method === 'BankTransfer') {
    if (status === 'Verified') return { label: 'Bank Transfer · Verified', color: '#15803d' };
    if (status === 'Rejected') return { label: 'Bank Transfer · Rejected', color: '#b91c1c' };
    return { label: 'Bank Transfer · Pending Review', color: '#b45309' };
  }
  return { label: 'Cash on Delivery', color: '#4b5563' };
};

assert('Bank Transfer Verified badge has green accent', getPaymentBadgeInfo('BankTransfer', 'Verified').color === '#15803d');
assert('Bank Transfer Rejected badge has red accent', getPaymentBadgeInfo('BankTransfer', 'Rejected').color === '#b91c1c');
assert('Bank Transfer Pending badge has amber accent', getPaymentBadgeInfo('BankTransfer', 'PendingVerification').color === '#b45309');
assert('COD badge has neutral accent', getPaymentBadgeInfo('CashOnDelivery', 'NotRequired').color === '#4b5563');

// ── Results ───────────────────────────────────────────────────────────────────
console.log(`\nResults: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
