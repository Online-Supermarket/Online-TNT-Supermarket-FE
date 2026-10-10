import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeMobileNumber, isMobileNumber } from '../src/utils/mobileNumber.js';

test('existing local and international mobile numbers retain the same digits', () => {
  for (const value of ['0771234567', '077-1234567', '+94 77 123 4567', '94771234567']) {
    assert.equal(normalizeMobileNumber(value), '0771234567');
    assert.equal(isMobileNumber(value), true);
  }
});

test('incomplete, oversized, and invalid numbers cannot be saved as mobile numbers', () => {
  for (const value of ['', '07', '077123456', '07712345678', '0111234567', '077abc4567', null]) {
    assert.equal(isMobileNumber(value), false);
  }
});

test('normalization does not silently replace existing landline prefixes', () => {
  assert.equal(normalizeMobileNumber('011-1234567'), '0111234567');
  assert.equal(normalizeMobileNumber(null), '');
});
