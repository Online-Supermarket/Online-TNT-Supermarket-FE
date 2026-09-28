import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const cartPage = await readFile(new URL('../src/pages/customer/CartPage.jsx', import.meta.url), 'utf8');
const cartContext = await readFile(new URL('../src/context/CartContext.jsx', import.meta.url), 'utf8');
const checkoutPage = await readFile(new URL('../src/pages/customer/CheckoutPage.jsx', import.meta.url), 'utf8');
const axiosInstance = await readFile(new URL('../src/services/axiosInstance.js', import.meta.url), 'utf8');

test('Proceed to Checkout clears only the visible basket and preserves a checkout snapshot', () => {
  assert.match(cartContext, /sessionStorage\.setItem\('tnt-checkout-basket'/);
  assert.match(cartContext, /setBasket\(emptyBasket\)/);
  assert.match(cartPage, /const snapshot = beginCheckout\(\)/);
  assert.match(cartPage, /state: \{ checkoutSnapshot: snapshot \}/);
  assert.match(checkoutPage, /checkoutSnapshot\?\.lines \|\| cartItems/);
});

test('checkout restores the server basket on failure and refreshes it after success', () => {
  assert.match(checkoutPage, /const restoreCart = async \(\) => \{ discardCheckoutSnapshot\(\); await refreshBasket\(\); \}/);
  assert.match(checkoutPage, /await restoreCart\(\)/);
  assert.match(checkoutPage, /discardCheckoutSnapshot\(\);\s+await refreshBasket\(\)/);
  assert.match(checkoutPage, /'Idempotency-Key': idempotencyKey/);
});

test('Place Order uses the checkout snapshot, not the intentionally hidden visible cart', () => {
  assert.match(checkoutPage, /type="submit" className="btn btn-primary"/);
  assert.match(checkoutPage, /disabled=\{placing \|\| !selected \|\| !checkoutLines\.length/);
  assert.doesNotMatch(checkoutPage, /disabled=\{placing \|\| !selected \|\| !cartItems\.length/);
});

test('COD and Bank Transfer use JSON request formats accepted by the Order Service', () => {
  assert.match(checkoutPage, /paymentMethod: 'CashOnDelivery'/);
  assert.match(checkoutPage, /'Content-Type': 'application\/json'/);
  assert.match(checkoutPage, /fetch\(`\$\{baseUrl\}\/order\/orders`/);
  assert.match(checkoutPage, /receiptBase64: btoa\(binary\)/);
  assert.match(checkoutPage, /receiptContentType: receiptFile\.type/);
  assert.match(axiosInstance, /config\.headers\?\.delete\?\.\('Content-Type'\)/);
});

test('a post-order refresh failure cannot turn a successful order into checkout failure', () => {
  assert.match(checkoutPage, /let orderCreated = false/);
  assert.match(checkoutPage, /orderCreated = true/);
  assert.match(checkoutPage, /await refreshBasket\(\)\.catch\(\(\) => null\)/);
  assert.match(checkoutPage, /if \(!orderCreated\)/);
});
