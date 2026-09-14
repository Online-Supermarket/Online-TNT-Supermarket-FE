import {fireEvent, render, screen, waitFor} from '@testing-library/react';
import {beforeEach, describe, expect, it, vi} from 'vitest';
import ManageProducts from './ManageProducts';
import {categoryService} from '../../services/categoryService';
import {productService} from '../../services/productService';

vi.mock('../../components/ToastProvider', () => ({
  useToast: () => ({showToast: vi.fn()}),
}));

vi.mock('../../hooks/useApiCollection', () => ({
  default: () => ({data: [{id: 'prod-1', name: 'Apples', categoryId: 'cat-1', category: 'Fresh Produce', price: 4.5, stockQuantity: 12}], loading: false, error: null}),
}));

vi.mock('../../services/categoryService', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    categoryService: {
      getCategories: vi.fn(),
    },
  };
});

vi.mock('../../services/productService', () => ({
  productService: {
    create: vi.fn(),
  },
}));

describe('ManageProducts category integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    categoryService.getCategories.mockResolvedValue({data: {items: [
      {id: 'cat-1', name: 'Fresh Produce', isActive: true},
      {id: 'cat-2', name: 'Dairy', isActive: true},
    ]}});
    productService.create.mockResolvedValue({data: {id: 'prod-2'}});
  });

  it('loads category options and submits the selected categoryId', async () => {
    render(<ManageProducts/>);

    fireEvent.click(screen.getByRole('button', {name: /add product/i}));
    await waitFor(() => expect(categoryService.getCategories).toHaveBeenCalledWith({isActive: true}));
    const categorySelect = screen.getByLabelText(/product category/i);
    expect(categorySelect).toHaveTextContent('Dairy');

    fireEvent.change(screen.getByPlaceholderText(/product name/i), {target: {value: 'Milk'}});
    fireEvent.change(categorySelect, {target: {value: 'cat-2'}});
    fireEvent.change(screen.getByPlaceholderText(/price/i), {target: {value: '3.25'}});
    fireEvent.change(screen.getByPlaceholderText(/stock/i), {target: {value: '20'}});
    fireEvent.click(screen.getByRole('button', {name: /save product/i}));

    await waitFor(() => expect(productService.create).toHaveBeenCalledWith({
      name: 'Milk',
      categoryId: 'cat-2',
      price: 3.25,
      stockQuantity: 20,
    }));
  });
});
