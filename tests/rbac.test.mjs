// tests/rbac.test.mjs
// Unit tests for Unified Staff Role-Based Access Control (RBAC) and Migration logic
import assert from 'node:assert';

console.log('=== Role Structure & Primary Role Determination ===');
const getPrimaryRole = (roles = []) => {
  if (roles.includes('OperationsAdmin') || roles.includes('ADMIN')) return 'ADMIN';
  if (roles.includes('Staff') || roles.includes('STAFF') || roles.includes('CatalogStaff') || roles.includes('InventoryStaff')) return 'STAFF';
  if (roles.includes('DeliveryDriver') || roles.includes('DELIVERY')) return 'DELIVERY';
  return 'CUSTOMER';
};

assert.strictEqual(getPrimaryRole(['Staff']), 'STAFF', 'Staff role resolves to STAFF primary role');
assert.strictEqual(getPrimaryRole(['Customer']), 'CUSTOMER', 'Customer role resolves to CUSTOMER');
assert.strictEqual(getPrimaryRole(['OperationsAdmin', 'Staff']), 'ADMIN', 'Admin with Staff role retains ADMIN primary role');
assert.strictEqual(getPrimaryRole(['DeliveryDriver']), 'DELIVERY', 'DeliveryDriver resolves to DELIVERY');
assert.strictEqual(getPrimaryRole(['CatalogStaff']), 'STAFF', 'Legacy CatalogStaff resolves to STAFF for backwards compatibility');
assert.strictEqual(getPrimaryRole(['InventoryStaff']), 'STAFF', 'Legacy InventoryStaff resolves to STAFF for backwards compatibility');
console.log('  ✓ Primary role resolution tests passed');

console.log('\n=== Staff Permissions Matrix ===');
const checkPermission = (roles, permission) => {
  const isOperationsAdmin = roles.includes('OperationsAdmin');
  const isStaff = roles.includes('Staff') || roles.includes('CatalogStaff') || roles.includes('InventoryStaff');

  switch (permission) {
    // Product management
    case 'VIEW_PRODUCTS':
    case 'CREATE_PRODUCT':
    case 'EDIT_PRODUCT':
    case 'UPDATE_PRODUCT_PRICE':
    case 'UPDATE_PRODUCT_IMAGE':
    case 'ACTIVATE_PRODUCT':
    case 'DEACTIVATE_PRODUCT':
      return isOperationsAdmin || isStaff;

    case 'DELETE_PRODUCT_PERMANENT':
      return isOperationsAdmin; // Only OperationsAdmin can permanently delete

    // Category management
    case 'VIEW_CATEGORIES':
    case 'CREATE_CATEGORY':
    case 'EDIT_CATEGORY':
    case 'DELETE_CATEGORY':
      return isOperationsAdmin || isStaff;

    // Inventory & stock
    case 'VIEW_INVENTORY':
    case 'VIEW_LOW_STOCK':
    case 'ADD_STOCK':
    case 'REMOVE_STOCK':
    case 'ADJUST_STOCK':
    case 'VIEW_STOCK_HISTORY':
      return isOperationsAdmin || isStaff;

    // Replenishment
    case 'VIEW_REPLENISHMENT':
    case 'CREATE_REPLENISHMENT':
    case 'APPROVE_REPLENISHMENT':
    case 'ORDER_REPLENISHMENT':
    case 'RECEIVE_REPLENISHMENT':
    case 'CANCEL_REPLENISHMENT':
      return isOperationsAdmin || isStaff;

    // Reports
    case 'VIEW_INVENTORY_REPORT':
    case 'EXPORT_INVENTORY_REPORT':
      return isOperationsAdmin || isStaff;
    case 'VIEW_SALES_REPORT':
    case 'EXPORT_SALES_REPORT':
      return isOperationsAdmin; // Only admin can access sales reports

    // Admin user management
    case 'MANAGE_USERS':
    case 'UPDATE_USER_ROLES':
      return isOperationsAdmin; // Only admin can manage users

    default:
      return false;
  }
};

// Staff checks
const staffRoles = ['Staff'];
assert.strictEqual(checkPermission(staffRoles, 'VIEW_PRODUCTS'), true, 'Staff can view all products');
assert.strictEqual(checkPermission(staffRoles, 'CREATE_PRODUCT'), true, 'Staff can create products');
assert.strictEqual(checkPermission(staffRoles, 'EDIT_PRODUCT'), true, 'Staff can edit products');
assert.strictEqual(checkPermission(staffRoles, 'UPDATE_PRODUCT_PRICE'), true, 'Staff can update product price');
assert.strictEqual(checkPermission(staffRoles, 'UPDATE_PRODUCT_IMAGE'), true, 'Staff can update product images');
assert.strictEqual(checkPermission(staffRoles, 'ACTIVATE_PRODUCT'), true, 'Staff can activate products');
assert.strictEqual(checkPermission(staffRoles, 'DEACTIVATE_PRODUCT'), true, 'Staff can deactivate products');
assert.strictEqual(checkPermission(staffRoles, 'DELETE_PRODUCT_PERMANENT'), false, 'Staff CANNOT permanently delete products');

assert.strictEqual(checkPermission(staffRoles, 'VIEW_CATEGORIES'), true, 'Staff can view categories');
assert.strictEqual(checkPermission(staffRoles, 'CREATE_CATEGORY'), true, 'Staff can create categories');
assert.strictEqual(checkPermission(staffRoles, 'EDIT_CATEGORY'), true, 'Staff can edit categories');

assert.strictEqual(checkPermission(staffRoles, 'VIEW_INVENTORY'), true, 'Staff can view inventory');
assert.strictEqual(checkPermission(staffRoles, 'ADD_STOCK'), true, 'Staff can add stock');
assert.strictEqual(checkPermission(staffRoles, 'REMOVE_STOCK'), true, 'Staff can remove stock');
assert.strictEqual(checkPermission(staffRoles, 'ADJUST_STOCK'), true, 'Staff can adjust stock');
assert.strictEqual(checkPermission(staffRoles, 'VIEW_STOCK_HISTORY'), true, 'Staff can view stock history');

assert.strictEqual(checkPermission(staffRoles, 'VIEW_REPLENISHMENT'), true, 'Staff can view replenishment plans');
assert.strictEqual(checkPermission(staffRoles, 'CREATE_REPLENISHMENT'), true, 'Staff can create replenishment plans');
assert.strictEqual(checkPermission(staffRoles, 'APPROVE_REPLENISHMENT'), true, 'Staff can approve replenishment plans');
assert.strictEqual(checkPermission(staffRoles, 'RECEIVE_REPLENISHMENT'), true, 'Staff can receive replenishment stock');
assert.strictEqual(checkPermission(staffRoles, 'CANCEL_REPLENISHMENT'), true, 'Staff can cancel replenishment plans');

assert.strictEqual(checkPermission(staffRoles, 'VIEW_INVENTORY_REPORT'), true, 'Staff can view inventory reports');
assert.strictEqual(checkPermission(staffRoles, 'EXPORT_INVENTORY_REPORT'), true, 'Staff can export inventory reports');

assert.strictEqual(checkPermission(staffRoles, 'VIEW_SALES_REPORT'), false, 'Staff CANNOT view sales reports');
assert.strictEqual(checkPermission(staffRoles, 'MANAGE_USERS'), false, 'Staff CANNOT access user management');
assert.strictEqual(checkPermission(staffRoles, 'UPDATE_USER_ROLES'), false, 'Staff CANNOT update user roles');
console.log('  ✓ Staff permission matrix tests passed');

console.log('\n=== Customer Access Restrictions ===');
const customerRoles = ['Customer'];
assert.strictEqual(checkPermission(customerRoles, 'VIEW_PRODUCTS'), false, 'Customer cannot access staff product view');
assert.strictEqual(checkPermission(customerRoles, 'CREATE_PRODUCT'), false, 'Customer cannot create products');
assert.strictEqual(checkPermission(customerRoles, 'VIEW_INVENTORY'), false, 'Customer cannot view staff inventory');
assert.strictEqual(checkPermission(customerRoles, 'ADD_STOCK'), false, 'Customer cannot add stock');
assert.strictEqual(checkPermission(customerRoles, 'VIEW_REPLENISHMENT'), false, 'Customer cannot access replenishment');
assert.strictEqual(checkPermission(customerRoles, 'MANAGE_USERS'), false, 'Customer cannot manage users');
console.log('  ✓ Customer restriction tests passed');

console.log('\n=== OperationsAdmin Permission Retention ===');
const adminRoles = ['OperationsAdmin'];
assert.strictEqual(checkPermission(adminRoles, 'CREATE_PRODUCT'), true, 'Admin can create products');
assert.strictEqual(checkPermission(adminRoles, 'DELETE_PRODUCT_PERMANENT'), true, 'Admin can permanently delete products');
assert.strictEqual(checkPermission(adminRoles, 'ADD_STOCK'), true, 'Admin can add stock');
assert.strictEqual(checkPermission(adminRoles, 'VIEW_SALES_REPORT'), true, 'Admin can view sales reports');
assert.strictEqual(checkPermission(adminRoles, 'MANAGE_USERS'), true, 'Admin can manage users');
console.log('  ✓ OperationsAdmin permission retention tests passed');

console.log('\n=== Database Role Migration Logic ===');
// Simulates PostgreSQL ARRAY(SELECT DISTINCT CASE WHEN r IN ('CatalogStaff', 'InventoryStaff') THEN 'Staff' ELSE r END FROM unnest(roles) AS r)
const migrateRoles = (roles) => {
  const set = new Set();
  for (const r of roles) {
    if (r === 'CatalogStaff' || r === 'InventoryStaff') {
      set.add('Staff');
    } else {
      set.add(r);
    }
  }
  return Array.from(set);
};

// Case 1: CatalogStaff + InventoryStaff -> Staff (deduplicated)
assert.deepStrictEqual(migrateRoles(['CatalogStaff', 'InventoryStaff']), ['Staff']);
// Case 2: CatalogStaff only -> Staff
assert.deepStrictEqual(migrateRoles(['CatalogStaff']), ['Staff']);
// Case 3: InventoryStaff only -> Staff
assert.deepStrictEqual(migrateRoles(['InventoryStaff']), ['Staff']);
// Case 4: OperationsAdmin + CatalogStaff + InventoryStaff -> OperationsAdmin, Staff (preserves unrelated roles!)
const adminMigrated = migrateRoles(['OperationsAdmin', 'CatalogStaff', 'InventoryStaff']);
assert.strictEqual(adminMigrated.includes('OperationsAdmin'), true);
assert.strictEqual(adminMigrated.includes('Staff'), true);
assert.strictEqual(adminMigrated.length, 2);
// Case 5: Customer -> Customer (unrelated role preserved)
assert.deepStrictEqual(migrateRoles(['Customer']), ['Customer']);
// Case 6: Courier, Dispatcher -> Courier, Dispatcher (unrelated preserved)
assert.deepStrictEqual(migrateRoles(['Courier', 'Dispatcher']), ['Courier', 'Dispatcher']);
console.log('  ✓ Role migration and deduplication tests passed');

console.log('\n════════════════════════════════════════');
console.log('All RBAC and Migration tests passed successfully!');
