import {fireEvent, render, screen, waitFor} from '@testing-library/react';
import {beforeEach, describe, expect, it, vi} from 'vitest';
import CategoryManagement from './CategoryManagement';
import {categoryService} from '../../services/categoryService';

vi.mock('../../components/ToastProvider', () => ({
  useToast: () => ({showToast: vi.fn()}),
}));

vi.mock('../../services/categoryService', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    categoryService: {
      getCategories: vi.fn(),
      createCategory: vi.fn(),
      updateCategory: vi.fn(),
      deleteCategory: vi.fn(),
      deactivateCategory: vi.fn(),
      activateCategory: vi.fn(),
    },
  };
});

const categories = [
  {id: 'cat-1', name: 'Fresh Produce', description: 'Fruit and vegetables', isActive: true},
  {id: 'cat-2', name: 'Bakery', description: 'Bread and pastries', isActive: false},
];

describe('CategoryManagement', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    categoryService.getCategories.mockResolvedValue({data: {items: categories}});
    categoryService.createCategory.mockResolvedValue({data: {id: 'cat-3'}});
    categoryService.updateCategory.mockResolvedValue({data: {}});
    categoryService.deleteCategory.mockResolvedValue({data: {}});
    categoryService.deactivateCategory.mockResolvedValue({data: {}});
    categoryService.activateCategory.mockResolvedValue({data: {}});
  });

  it('renders categories after loading', async () => {
    render(<CategoryManagement/>);

    expect(screen.getByText('Loading categories...')).toBeInTheDocument();
    expect(await screen.findByText('Fresh Produce')).toBeInTheDocument();
    expect(screen.getByText('Fruit and vegetables')).toBeInTheDocument();
    expect(screen.getByText('Inactive')).toBeInTheDocument();
  });

  it('creates a category with trimmed values', async () => {
    render(<CategoryManagement/>);
    await screen.findByText('Fresh Produce');

    fireEvent.change(screen.getByLabelText(/category name/i), {target: {value: '  Dairy  '}});
    fireEvent.change(screen.getByLabelText(/description/i), {target: {value: '  Milk and cheese  '}});
    fireEvent.click(screen.getByRole('button', {name: /create category/i}));

    await waitFor(() => expect(categoryService.createCategory).toHaveBeenCalledWith({
      name: 'Dairy',
      description: 'Milk and cheese',
      isActive: true,
    }));
  });

  it('validates blank category names', async () => {
    render(<CategoryManagement/>);
    await screen.findByText('Fresh Produce');

    fireEvent.change(screen.getByLabelText(/category name/i), {target: {value: '   '}});
    fireEvent.click(screen.getByRole('button', {name: /create category/i}));

    expect(await screen.findByRole('alert')).toHaveTextContent('Category name is required.');
    expect(categoryService.createCategory).not.toHaveBeenCalled();
  });

  it('edits an existing category', async () => {
    render(<CategoryManagement/>);
    await screen.findByText('Fresh Produce');

    fireEvent.click(screen.getAllByRole('button', {name: /edit/i})[0]);
    fireEvent.change(screen.getByLabelText(/category name/i), {target: {value: 'Fresh Food'}});
    fireEvent.click(screen.getByRole('button', {name: /save changes/i}));

    await waitFor(() => expect(categoryService.updateCategory).toHaveBeenCalledWith('cat-1', {
      name: 'Fresh Food',
      description: 'Fruit and vegetables',
      isActive: true,
    }));
  });

  it('deactivates and deletes only after confirmation', async () => {
    render(<CategoryManagement/>);
    await screen.findByText('Fresh Produce');

    fireEvent.click(screen.getByRole('button', {name: /deactivate/i}));
    await waitFor(() => expect(categoryService.deactivateCategory).toHaveBeenCalledWith('cat-1'));

    fireEvent.click(screen.getAllByRole('button', {name: /delete/i})[0]);
    await waitFor(() => expect(categoryService.deleteCategory).toHaveBeenCalledWith('cat-1'));
  });

  it('shows API load errors', async () => {
    categoryService.getCategories.mockRejectedValueOnce({response: {status: 403}});

    render(<CategoryManagement/>);

    expect(await screen.findByText('Categories could not load')).toBeInTheDocument();
    expect(screen.getByText('You do not have permission to manage categories.')).toBeInTheDocument();
  });
});
