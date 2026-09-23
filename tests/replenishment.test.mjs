// tests/replenishment.test.mjs
// Frontend unit tests for ReplenishmentManager stock status filter & procurement logic
// Run with: node tests/replenishment.test.mjs

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

// ── Status derivation logic ────────────────────────────────────────────────
const calcStockStatus = (stockQuantity, reorderLevel) => {
  if (stockQuantity === 0) return 'Out of Stock';
  if (stockQuantity <= reorderLevel) return 'Low Stock';
  return 'In Stock';
};

console.log('=== Stock Status Calculation ===');
assert('Stock 0 is Out of Stock', calcStockStatus(0, 10) === 'Out of Stock');
assert('Stock 5 with reorder 10 is Low Stock', calcStockStatus(5, 10) === 'Low Stock');
assert('Stock 10 with reorder 10 is Low Stock (threshold reached)', calcStockStatus(10, 10) === 'Low Stock');
assert('Stock 11 with reorder 10 is In Stock', calcStockStatus(11, 10) === 'In Stock');
assert('Stock 100 with reorder 10 is In Stock', calcStockStatus(100, 10) === 'In Stock');

// ── Sample Products & Plans ────────────────────────────────────────────────
const sampleProducts = [
  { id: 'p1', name: 'Fresh Milk 1L', sku: 'MILK-001', categoryName: 'Dairy', stockQuantity: 25, reorderLevel: 10, targetStockLevel: 50 },
  { id: 'p2', name: 'Organic Butter', sku: 'BTR-002', categoryName: 'Dairy', stockQuantity: 8, reorderLevel: 10, targetStockLevel: 30 },
  { id: 'p3', name: 'Almond Milk', sku: 'ALM-003', categoryName: 'Beverages', stockQuantity: 0, reorderLevel: 15, targetStockLevel: 40 },
  { id: 'p4', name: 'Sourdough Bread', sku: 'BRD-004', categoryName: 'Bakery', stockQuantity: 4, reorderLevel: 5, targetStockLevel: 20 },
  { id: 'p5', name: 'Cheddar Cheese', sku: 'CHS-005', categoryName: 'Dairy', stockQuantity: 50, reorderLevel: 20, targetStockLevel: 60 },
  { id: 'p6', name: 'Sparkling Water', sku: 'WTR-006', categoryName: 'Beverages', stockQuantity: 0, reorderLevel: 20, targetStockLevel: 50 },
];

const samplePlans = [
  { id: 'plan1', productId: 'p2', status: 'Pending', requestedQuantity: 22 },
  { id: 'plan2', productId: 'p3', status: 'Ordered', requestedQuantity: 40 },
  { id: 'plan3', productId: 'p5', status: 'Received', requestedQuantity: 30 },
];

// ── Product Enrichment ─────────────────────────────────────────────────────
const enrichProducts = (products, plans) => {
  const planByProductId = {};
  plans.forEach(plan => {
    if (['Pending', 'Approved', 'Ordered'].includes(plan.status)) {
      planByProductId[plan.productId] = plan.status;
    }
  });

  return products.map(prod => {
    const status = calcStockStatus(prod.stockQuantity, prod.reorderLevel);
    const suggestedQuantity = Math.max(1, (prod.targetStockLevel - prod.stockQuantity) || 10);
    const activePlanStatus = planByProductId[prod.id] || null;
    return {
      ...prod,
      status,
      suggestedQuantity,
      activePlanStatus
    };
  });
};

const enriched = enrichProducts(sampleProducts, samplePlans);

console.log('\n=== Product Enrichment & KPI Counts ===');
const inStockCount = enriched.filter(p => p.status === 'In Stock').length;
const lowStockCount = enriched.filter(p => p.status === 'Low Stock').length;
const outOfStockCount = enriched.filter(p => p.status === 'Out of Stock').length;

assert('Total products = 6', enriched.length === 6);
assert('In Stock count = 2 (Milk, Cheese)', inStockCount === 2);
assert('Low Stock count = 2 (Butter, Bread)', lowStockCount === 2);
assert('Out of Stock count = 2 (Almond Milk, Sparkling Water)', outOfStockCount === 2);

// ── Stock Status Filter: All, In Stock, Low Stock, Out of Stock ───────────
console.log('\n=== Stock Status Filtering Logic ===');
const filterProducts = (products, stockFilter, search = '') => {
  let rows = products;
  if (stockFilter !== 'All') {
    rows = rows.filter(p => p.status === stockFilter);
  }
  if (search.trim()) {
    const q = search.toLowerCase();
    rows = rows.filter(
      p => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q) || p.categoryName.toLowerCase().includes(q)
    );
  }
  return rows;
};

assert('Filter "All" returns all 6 products', filterProducts(enriched, 'All').length === 6);
assert('Filter "In Stock" returns 2 products', filterProducts(enriched, 'In Stock').length === 2);
assert('Filter "Low Stock" returns 2 products', filterProducts(enriched, 'Low Stock').length === 2);
assert('Filter "Out of Stock" returns 2 products', filterProducts(enriched, 'Out of Stock').length === 2);

console.log('\n=== Combined Filter and Search Logic ===');
const filteredDairyLowStock = filterProducts(enriched, 'Low Stock', 'Dairy');
assert('Filter "Low Stock" + search "Dairy" returns 1 (Organic Butter)', filteredDairyLowStock.length === 1 && filteredDairyLowStock[0].name === 'Organic Butter');

const filteredInStockSearchMilk = filterProducts(enriched, 'In Stock', 'Milk');
assert('Filter "In Stock" + search "Milk" returns 1 (Fresh Milk 1L)', filteredInStockSearchMilk.length === 1 && filteredInStockSearchMilk[0].name === 'Fresh Milk 1L');

const filteredOutOfStockSearchNonExistent = filterProducts(enriched, 'Out of Stock', 'Pizza');
assert('Filter "Out of Stock" + search "Pizza" returns 0', filteredOutOfStockSearchNonExistent.length === 0);

// ── Suggested Quantity Calculation ─────────────────────────────────────────
console.log('\n=== Suggested Quantity Calculations ===');
assert('Suggested quantity for Milk (Target 50 - Stock 25) = 25', enriched.find(p => p.id === 'p1').suggestedQuantity === 25);
assert('Suggested quantity for Butter (Target 30 - Stock 8) = 22', enriched.find(p => p.id === 'p2').suggestedQuantity === 22);
assert('Suggested quantity for Almond Milk (Target 40 - Stock 0) = 40', enriched.find(p => p.id === 'p3').suggestedQuantity === 40);

// ── Active Plan Linking ────────────────────────────────────────────────────
console.log('\n=== Active Replenishment Plan Association ===');
assert('Butter has active plan "Pending"', enriched.find(p => p.id === 'p2').activePlanStatus === 'Pending');
assert('Almond Milk has active plan "Ordered"', enriched.find(p => p.id === 'p3').activePlanStatus === 'Ordered');
assert('Cheese has no active plan (Received is archived)', enriched.find(p => p.id === 'p5').activePlanStatus === null);
assert('Fresh Milk has no plan', enriched.find(p => p.id === 'p1').activePlanStatus === null);

// ── Summary ────────────────────────────────────────────────────────────────
console.log(`\nResults: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
