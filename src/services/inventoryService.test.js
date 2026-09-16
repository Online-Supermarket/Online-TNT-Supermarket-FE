import { describe, expect, it, vi } from 'vitest';
import api from './api';
import { inventoryService, getInventoryErrorMessage } from './inventoryService';

vi.mock('./api', () => ({
  default: {
    get: vi.fn(),
    put: vi.fn(),
  },
}));

describe('inventoryService', () => {
  it('uses the shared api client for inventory endpoints', () => {
    const productId = '11111111-1111-1111-1111-111111111111';

    inventoryService.getAll({ page: 1, pageSize: 20, search: 'apple' });
    inventoryService.getByProductId(productId);
    inventoryService.updateStock(productId, 50);

    expect(api.get).toHaveBeenCalledWith('/api/inventory', {
      params: { page: 1, pageSize: 20, search: 'apple' },
    });
    expect(api.get).toHaveBeenCalledWith(`/api/inventory/${productId}`);
    expect(api.put).toHaveBeenCalledWith(`/api/inventory/${productId}`, {
      stockQuantity: 50,
    });
  });
});

describe('getInventoryErrorMessage', () => {
  it('returns the message field from the response body', () => {
    const err = { response: { status: 400, data: { message: 'Stock quantity cannot be negative.' } } };
    expect(getInventoryErrorMessage(err)).toBe('Stock quantity cannot be negative.');
  });

  it('returns the title field when message is absent', () => {
    const err = { response: { status: 400, data: { title: 'Bad Request' } } };
    expect(getInventoryErrorMessage(err)).toBe('Bad Request');
  });

  it('returns the first validation error string', () => {
    const err = { response: { status: 400, data: { errors: { StockQuantity: ['Must be ≥ 0.'] } } } };
    expect(getInventoryErrorMessage(err)).toBe('Must be ≥ 0.');
  });

  it('maps status 401 to a sign-in prompt', () => {
    const err = { response: { status: 401, data: {} } };
    expect(getInventoryErrorMessage(err)).toBe('Please sign in to manage inventory.');
  });

  it('maps status 403 to a permission message', () => {
    const err = { response: { status: 403, data: {} } };
    expect(getInventoryErrorMessage(err)).toBe('You do not have permission to manage inventory.');
  });

  it('maps status 404 to product not found', () => {
    const err = { response: { status: 404, data: {} } };
    expect(getInventoryErrorMessage(err)).toBe('Product not found.');
  });

  it('maps status 500 to a server error message', () => {
    const err = { response: { status: 500, data: {} } };
    expect(getInventoryErrorMessage(err)).toBe('The server could not process the inventory request.');
  });

  it('maps a network error (no response) to a network message', () => {
    const err = { request: {} };
    expect(getInventoryErrorMessage(err)).toBe('Network error. Please check the backend connection.');
  });

  it('returns the fallback when error is null', () => {
    expect(getInventoryErrorMessage(null, 'Custom fallback')).toBe('Custom fallback');
  });

  it('returns the default fallback string when no fallback is given', () => {
    expect(getInventoryErrorMessage(null)).toBe('Inventory request failed.');
  });
});
