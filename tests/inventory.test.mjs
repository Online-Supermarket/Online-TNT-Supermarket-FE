// tests/inventory.test.mjs
// Frontend unit tests for inventory stock management logic
// Run with: node tests/inventory.test.mjs

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

// ── Status calculation rules ─────────────────────────────────────────────────
const calcStatus = (stock, reorder) =>
  stock === 0 ? 'Out of Stock' : stock <= reorder ? 'Low Stock' : 'In Stock';

console.log('=== Status Rules ===');
assert('stock=0 => Out of Stock', calcStatus(0, 10) === 'Out of Stock');
assert('stock=5, reorder=10 => Low Stock', calcStatus(5, 10) === 'Low Stock');
assert('stock=10, reorder=10 => Low Stock (equal)', calcStatus(10, 10) === 'Low Stock');
assert('stock=11, reorder=10 => In Stock', calcStatus(11, 10) === 'In Stock');
assert('stock=100, reorder=10 => In Stock', calcStatus(100, 10) === 'In Stock');

// ── Summary calculation ───────────────────────────────────────────────────────
const calcSummary = (products) => ({
  totalProducts: products.length,
  inStockCount: products.filter(p => calcStatus(p.stock, p.reorder) === 'In Stock').length,
  lowStockCount: products.filter(p => calcStatus(p.stock, p.reorder) === 'Low Stock').length,
  outOfStockCount: products.filter(p => calcStatus(p.stock, p.reorder) === 'Out of Stock').length,
  totalStockUnits: products.reduce((sum, p) => sum + p.stock, 0),
});

const sampleProducts = [
  { stock: 100, reorder: 10 },
  { stock: 5,   reorder: 10 },
  { stock: 0,   reorder: 10 },
  { stock: 50,  reorder: 10 },
  { stock: 0,   reorder: 5 },
];
const s = calcSummary(sampleProducts);

console.log('\n=== Summary Calculations ===');
assert('Total products = 5', s.totalProducts === 5);
assert('In Stock count = 2', s.inStockCount === 2);
assert('Low Stock count = 1', s.lowStockCount === 1);
assert('Out of Stock count = 2', s.outOfStockCount === 2);
assert('Total stock units = 155', s.totalStockUnits === 155);

// ── Input validation rules ────────────────────────────────────────────────────
const validateAdd = ({ quantity }) => {
  const errors = {};
  if (!Number.isInteger(quantity) || quantity <= 0) errors.quantity = 'Quantity must be > 0.';
  return errors;
};

const validateRemove = ({ quantity, currentStock }) => {
  const errors = {};
  if (!Number.isInteger(quantity) || quantity <= 0) errors.quantity = 'Quantity must be > 0.';
  else if (quantity > currentStock) errors.quantity = 'Insufficient stock.';
  return errors;
};

const validateAdjust = ({ newQuantity, reason }) => {
  const errors = {};
  if (!Number.isInteger(newQuantity) || newQuantity < 0) errors.newQuantity = 'Quantity must be >= 0.';
  if (!reason || !reason.trim()) errors.reason = 'Reason is required.';
  return errors;
};

console.log('\n=== Add Stock Validation ===');
assert('qty=1 is valid', Object.keys(validateAdd({ quantity: 1 })).length === 0);
assert('qty=0 is invalid', Object.keys(validateAdd({ quantity: 0 })).length > 0);
assert('qty=-5 is invalid', Object.keys(validateAdd({ quantity: -5 })).length > 0);
assert('qty=10 is valid', Object.keys(validateAdd({ quantity: 10 })).length === 0);

console.log('\n=== Remove Stock Validation ===');
assert('qty=1 with stock=10 is valid', Object.keys(validateRemove({ quantity: 1, currentStock: 10 })).length === 0);
assert('qty=10 with stock=10 is valid (exact)', Object.keys(validateRemove({ quantity: 10, currentStock: 10 })).length === 0);
assert('qty=11 with stock=10 is invalid (exceed)', Object.keys(validateRemove({ quantity: 11, currentStock: 10 })).length > 0);
assert('qty=0 is invalid', Object.keys(validateRemove({ quantity: 0, currentStock: 10 })).length > 0);

console.log('\n=== Adjust Stock Validation ===');
assert('newQty=0 with reason is valid', Object.keys(validateAdjust({ newQuantity: 0, reason: 'Stocktake' })).length === 0);
assert('newQty=50 with reason is valid', Object.keys(validateAdjust({ newQuantity: 50, reason: 'Physical count' })).length === 0);
assert('newQty=-1 is invalid', Object.keys(validateAdjust({ newQuantity: -1, reason: 'test' })).length > 0);
assert('empty reason is invalid', Object.keys(validateAdjust({ newQuantity: 10, reason: '' })).length > 0);
assert('whitespace-only reason is invalid', Object.keys(validateAdjust({ newQuantity: 10, reason: '   ' })).length > 0);

// ── Delta calculation ─────────────────────────────────────────────────────────
console.log('\n=== Delta Calculation ===');
const delta = (oldQty, newQty) => newQty - oldQty;
assert('50 -> 70: delta = +20', delta(50, 70) === 20);
assert('50 -> 30: delta = -20', delta(50, 30) === -20);
assert('50 -> 50: delta = 0', delta(50, 50) === 0);

// ── Result ────────────────────────────────────────────────────────────────────
console.log(`\n${'═'.repeat(40)}`);
console.log(`Results: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
