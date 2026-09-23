import test from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeProduct,
  validateProductInput,
  PRODUCT_PLACEHOLDER_IMAGE,
} from '../src/models/Product.js';

test('normalizeProduct handles camelCase and nested category object from backend', () => {
  const backendPayload = {
    id: 'b19d9414-5a5c-4884-b1f1-1cfc690d1696',
    sku: 'ORG-BAN-001',
    name: 'Organic Bananas 1kg',
    description: 'Fresh organic yellow bananas',
    price: 2.49,
    stockQuantity: 50,
    available: true,
    active: true,
    imageUrl: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e',
    category: {
      id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
      name: 'Pantry'
    }
  };

  const normalized = normalizeProduct(backendPayload);
  assert.equal(normalized.id, 'b19d9414-5a5c-4884-b1f1-1cfc690d1696');
  assert.equal(normalized.sku, 'ORG-BAN-001');
  assert.equal(normalized.name, 'Organic Bananas 1kg');
  assert.equal(normalized.description, 'Fresh organic yellow bananas');
  assert.equal(normalized.price, 2.49);
  assert.equal(normalized.stockQuantity, 50);
  assert.equal(normalized.available, true);
  assert.equal(normalized.active, true);
  assert.equal(normalized.imageUrl, 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e');
  assert.equal(normalized.category.id, 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb');
  assert.equal(normalized.category.name, 'Pantry');
  assert.equal(normalized.categoryId, 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb');
});

test('normalizeProduct handles snake_case fields gracefully', () => {
  const snakePayload = {
    id: 'c29d9414-5a5c-4884-b1f1-1cfc690d1696',
    sku: 'SKU-999',
    name: 'Fresh Milk',
    price: '3.99',
    stock_quantity: 25,
    category_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    active: true,
    image_url: 'https://images.unsplash.com/photo-milk.jpg'
  };

  const normalized = normalizeProduct(snakePayload);
  assert.equal(normalized.id, 'c29d9414-5a5c-4884-b1f1-1cfc690d1696');
  assert.equal(normalized.price, 3.99);
  assert.equal(normalized.stockQuantity, 25);
  assert.equal(normalized.categoryId, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa');
  assert.equal(normalized.imageUrl, 'https://images.unsplash.com/photo-milk.jpg');
});

test('normalizeProduct gracefully handles null/empty/missing fields', () => {
  const nullPayload = {
    id: 'd39d9414-5a5c-4884-b1f1-1cfc690d1696',
    sku: 'SKU-NULL',
    name: 'Item without image',
    price: 1.00,
    stockQuantity: 10,
    imageUrl: null,
    image_url: null,
  };

  const normalized = normalizeProduct(nullPayload);
  assert.equal(normalized.imageUrl, null);
  assert.equal(normalized.image_url, null);
});

test('validateProductInput enforces required fields and numeric bounds', () => {
  const emptyResult = validateProductInput({});
  assert.equal(emptyResult.valid, false);
  assert.match(emptyResult.errors.sku, /required/i);
  assert.match(emptyResult.errors.name, /required/i);
  assert.match(emptyResult.errors.price, /required/i);
  assert.match(emptyResult.errors.stockQuantity, /required/i);
  assert.match(emptyResult.errors.categoryId, /category/i);

  const invalidNumeric = validateProductInput({
    sku: 'SKU-1',
    name: 'Item',
    price: -5.00,
    stockQuantity: -10,
    categoryId: 'guid-123'
  });
  assert.equal(invalidNumeric.valid, false);
  assert.match(invalidNumeric.errors.price, /negative/i);
  assert.match(invalidNumeric.errors.stockQuantity, /non-negative/i);

  const validResult = validateProductInput({
    sku: 'SKU-001',
    name: 'Fresh Apples 1kg',
    description: 'Crisp Red Gala apples',
    price: 4.99,
    stockQuantity: 100,
    categoryId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    imageUrl: 'https://images.unsplash.com/photo-apple.jpg'
  });
  assert.equal(validResult.valid, true);
  assert.equal(Object.keys(validResult.errors).length, 0);
});

test('validateProductInput checks image URL protocol and length limits', () => {
  const invalidProtocol = validateProductInput({
    sku: 'SKU-PROTO',
    name: 'Product',
    price: 10,
    stockQuantity: 5,
    categoryId: 'cat-1',
    imageUrl: 'ftp://bad-link.com/file.jpg'
  });
  assert.equal(invalidProtocol.valid, false);
  assert.match(invalidProtocol.errors.imageUrl, /http/i);

  const invalidUrl = validateProductInput({
    sku: 'SKU-NOTURL',
    name: 'Product',
    price: 10,
    stockQuantity: 5,
    categoryId: 'cat-1',
    imageUrl: 'not-a-valid-url'
  });
  assert.equal(invalidUrl.valid, false);
  assert.match(invalidUrl.errors.imageUrl, /valid URL/i);

  const overLimit = validateProductInput({
    sku: 'SKU-OVER',
    name: 'Product',
    price: 10,
    stockQuantity: 5,
    categoryId: 'cat-1',
    imageUrl: 'https://example.com/' + 'a'.repeat(2001)
  });
  assert.equal(overLimit.valid, false);
  assert.match(overLimit.errors.imageUrl, /2000 characters/i);
});

test('PRODUCT_PLACEHOLDER_IMAGE provides a valid SVG data URI', () => {
  assert.ok(PRODUCT_PLACEHOLDER_IMAGE.startsWith('data:image/svg+xml,'));
  assert.ok(PRODUCT_PLACEHOLDER_IMAGE.includes('TNT Supermarket'));
});
