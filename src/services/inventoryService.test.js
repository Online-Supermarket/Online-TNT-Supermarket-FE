import { describe, expect, it, vi } from 'vitest';
import api from './api';
import { inventoryService, getInventoryErrorMessage } from './inventoryService';

vi.mock('./api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('inventoryService', () => {
  it('uses the shared api client for all inventory endpoints including adjustStock', () => {
    inventoryService.getAll({ page: 1, pageSize: 20, lowStock: true });
    inventoryService.getByProductId('prod-1');
    inventoryService.addInventory('prod-1', 50);
    inventoryService.updateStock('prod-1', 100, 15);
    inventoryService.adjustStock('prod-1', { type: 'increase', quantity: 20 });
    inventoryService.deleteInventory('prod-1');

    expect(api.get).toHaveBeenCalledWith('/api/inventory', {
      params: { page: 1, pageSize: 20, lowStock: true },
    });
    expect(api.get).toHaveBeenCalledWith('/api/inventory/prod-1');
    expect(api.post).toHaveBeenCalledWith('/api/inventory', {
      productId: 'prod-1',
      stockQuantity: 50,
    });
    expect(api.put).toHaveBeenCalledWith('/api/inventory/prod-1', {
      stockQuantity: 100,
      lowStockThreshold: 15,
    });
    expect(api.patch).toHaveBeenCalledWith('/api/inventory/prod-1/stock', {
      type: 'increase',
      quantity: 20,
    });
    expect(api.delete).toHaveBeenCalledWith('/api/inventory/prod-1');
  });

  it('maps insufficient stock error correctly', () => {
    const error = {
      response: {
        status: 400,
        data: { message: 'Insufficient stock available.' },
      },
    };
    expect(getInventoryErrorMessage(error)).toBe('Insufficient stock available.');
  });

  it('maps generic status errors properly', () => {
    expect(getInventoryErrorMessage({ response: { status: 400 } })).toBe(
      'Invalid stock quantity. Please check and try again.',
    );
    expect(getInventoryErrorMessage({ response: { status: 401 } })).toBe(
      'Please sign in to manage inventory.',
    );
    expect(getInventoryErrorMessage({ response: { status: 403 } })).toBe(
      'You do not have permission to manage inventory.',
    );
    expect(getInventoryErrorMessage({ response: { status: 404 } })).toBe('Product not found.');
    expect(getInventoryErrorMessage({ response: { status: 409 } })).toBe(
      'This product already has an inventory record. Use Update Stock to change it.',
    );
    expect(getInventoryErrorMessage({ response: { status: 500 } })).toBe(
      'The server could not process the inventory request.',
    );
    expect(getInventoryErrorMessage({ request: {} })).toBe(
      'Network error. Please check the backend connection.',
    );
    expect(getInventoryErrorMessage(null)).toBe('Inventory request failed.');
  });
});
