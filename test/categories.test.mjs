import test from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeCategory,
  validateCategoryInput,
  CATEGORY_PLACEHOLDER_IMAGE,
} from '../src/models/Category.js';

test('normalizeCategory handles both camelCase (imageUrl) and snake_case (image_url)', () => {
  const camelCase = {
    id: '11111111-1111-1111-1111-111111111111',
    name: 'Fresh Fruits',
    description: 'Crisp organic apples and citrus',
    imageUrl: 'https://images.example.com/fruits.jpg',
  };

  const normalized1 = normalizeCategory(camelCase);
  assert.equal(normalized1.id, '11111111-1111-1111-1111-111111111111');
  assert.equal(normalized1.name, 'Fresh Fruits');
  assert.equal(normalized1.description, 'Crisp organic apples and citrus');
  assert.equal(normalized1.imageUrl, 'https://images.example.com/fruits.jpg');
  assert.equal(normalized1.image_url, 'https://images.example.com/fruits.jpg');

  const snakeCase = {
    id: '22222222-2222-2222-2222-222222222222',
    name: 'Bakery & Bread',
    description: 'Artisan sourdough loaves',
    image_url: 'https://images.example.com/bakery.jpg',
  };

  const normalized2 = normalizeCategory(snakeCase);
  assert.equal(normalized2.id, '22222222-2222-2222-2222-222222222222');
  assert.equal(normalized2.name, 'Bakery & Bread');
  assert.equal(normalized2.description, 'Artisan sourdough loaves');
  assert.equal(normalized2.imageUrl, 'https://images.example.com/bakery.jpg');
});

test('normalizeCategory gracefully handles null/empty/missing fields', () => {
  const normalized = normalizeCategory({
    id: '33333333-3333-3333-3333-333333333333',
    name: 'Pantry',
  });

  assert.equal(normalized.id, '33333333-3333-3333-3333-333333333333');
  assert.equal(normalized.name, 'Pantry');
  assert.equal(normalized.description, null);
  assert.equal(normalized.imageUrl, null);

  const empty = normalizeCategory(null);
  assert.equal(empty.id, '');
  assert.equal(empty.name, '');
  assert.equal(empty.description, null);
  assert.equal(empty.imageUrl, null);
});

test('validateCategoryInput enforces required category name', () => {
  const resultEmpty = validateCategoryInput({ name: '' });
  assert.equal(resultEmpty.valid, false);
  assert.match(resultEmpty.errors.name, /required/i);

  const resultWhitespace = validateCategoryInput({ name: '   ' });
  assert.equal(resultWhitespace.valid, false);
  assert.match(resultWhitespace.errors.name, /required/i);

  const resultValid = validateCategoryInput({ name: 'Produce' });
  assert.equal(resultValid.valid, true);
  assert.equal(Object.keys(resultValid.errors).length, 0);
});

test('validateCategoryInput enforces length limits on name, description, and image URL', () => {
  const tooLongName = 'A'.repeat(101);
  const tooLongDesc = 'D'.repeat(501);
  const tooLongUrl = 'https://example.com/' + 'x'.repeat(2000);

  const result = validateCategoryInput({
    name: tooLongName,
    description: tooLongDesc,
    imageUrl: tooLongUrl,
  });

  assert.equal(result.valid, false);
  assert.match(result.errors.name, /100 characters/i);
  assert.match(result.errors.description, /500 characters/i);
  assert.match(result.errors.imageUrl, /2000 characters/i);
});

test('validateCategoryInput checks image URL protocol', () => {
  const invalidUrl = validateCategoryInput({
    name: 'Valid Name',
    imageUrl: 'ftp://not-supported-scheme.com/img.jpg',
  });
  assert.equal(invalidUrl.valid, false);
  assert.match(invalidUrl.errors.imageUrl, /valid HTTP\/HTTPS URL/i);

  const validHttps = validateCategoryInput({
    name: 'Valid Name',
    imageUrl: 'https://images.unsplash.com/photo-produce.jpg',
  });
  assert.equal(validHttps.valid, true);

  const validDataUri = validateCategoryInput({
    name: 'Valid Name',
    imageUrl: 'data:image/svg+xml,%3Csvg%3E%3C/svg%3E',
  });
  assert.equal(validDataUri.valid, true);
});

test('CATEGORY_PLACEHOLDER_IMAGE provides a valid SVG data URI', () => {
  assert.ok(CATEGORY_PLACEHOLDER_IMAGE.startsWith('data:image/svg+xml,'));
  assert.ok(CATEGORY_PLACEHOLDER_IMAGE.includes('TNT Supermarket'));
});
