import {describe, expect, it, vi} from 'vitest';
import api from './api';
import {categoryService, getCategoryErrorMessage, unwrapCategories} from './categoryService';

vi.mock('./api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    patch: vi.fn(),
  },
}));

describe('categoryService', () => {
  it('uses the shared api client for category endpoints', () => {
    categoryService.getCategories({isActive: true});
    categoryService.getCategoryById('cat-1');
    categoryService.createCategory({name: 'Fresh'});
    categoryService.updateCategory('cat-1', {name: 'Fresh Produce'});
    categoryService.deleteCategory('cat-1');
    categoryService.deactivateCategory('cat-1');
    categoryService.activateCategory('cat-1');

    expect(api.get).toHaveBeenCalledWith('/api/categories', {params: {isActive: true}});
    expect(api.get).toHaveBeenCalledWith('/api/categories/cat-1');
    expect(api.post).toHaveBeenCalledWith('/api/categories', {name: 'Fresh'});
    expect(api.put).toHaveBeenCalledWith('/api/categories/cat-1', {name: 'Fresh Produce'});
    expect(api.delete).toHaveBeenCalledWith('/api/categories/cat-1');
    expect(api.patch).toHaveBeenCalledWith('/api/categories/cat-1/deactivate');
    expect(api.patch).toHaveBeenCalledWith('/api/categories/cat-1/activate');
  });

  it('unwraps common list payload shapes and maps API errors', () => {
    expect(unwrapCategories([{id: 'cat-1'}])).toHaveLength(1);
    expect(unwrapCategories({items: [{id: 'cat-2'}]})).toEqual([{id: 'cat-2'}]);
    expect(getCategoryErrorMessage({response: {status: 409}})).toBe('A category with these details already exists.');
    expect(getCategoryErrorMessage({request: {}})).toBe('Network error. Please check the backend connection.');
  });
});
