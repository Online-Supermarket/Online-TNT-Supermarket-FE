import {fireEvent, render, screen, waitFor} from '@testing-library/react';
import {afterEach, describe, expect, it, vi} from 'vitest';
import {MemoryRouter} from 'react-router-dom';
import {CartProvider} from '../../context/CartContext';
import Categories from './Categories';
import {productService} from '../../services/productService';
import api from '../../services/api';

vi.mock('../../services/productService', () => ({
  productService: {getAll: vi.fn()},
}));

vi.mock('../../services/api', () => ({
  default: {get: vi.fn()},
}));

const milk = {id: 1, name: 'Fresh Milk', category: 'Drinks', price: 350, stock: 8, unit: '1L', rating: 4.5};
const bread = {id: 2, name: 'Wholemeal Bread', category: 'Bakery', price: 220, stock: 0, unit: '500g', rating: 4};

function renderCatalog() {
  return render(<MemoryRouter><CartProvider><Categories /></CartProvider></MemoryRouter>);
}

function respondWith(rows = [milk, bread], extra = {}) {
  productService.getAll.mockResolvedValue({data: {items: rows, total: rows.length, totalPages: 1, ...extra}});
  api.get.mockResolvedValue({data: {items: [{id: 'drinks', name: 'Drinks'}, {id: 'bakery', name: 'Bakery'}]}});
}

afterEach(() => {
  vi.clearAllMocks();
});

describe('customer product search and filtering', () => {
  it('loads products from the backend and shows the loading state', async () => {
    let resolveRequest;
    productService.getAll.mockReturnValue(new Promise((resolve) => { resolveRequest = resolve; }));
    api.get.mockResolvedValue({data: []});
    renderCatalog();

    expect(screen.getByLabelText('Loading')).toBeInTheDocument();
    resolveRequest({data: {items: [milk], total: 1, totalPages: 1}});
    expect(await screen.findByText('Fresh Milk')).toBeInTheDocument();
  });

  it('debounces search and resets to the first page', async () => {
    respondWith([milk]);
    renderCatalog();
    await screen.findByText('Fresh Milk');

    fireEvent.change(screen.getByLabelText('Search products...'), {target: {value: 'milk'}});
    await waitFor(() => expect(productService.getAll).toHaveBeenLastCalledWith(expect.objectContaining({search: 'milk', page: 1, pageSize: 10})), {timeout: 1000});
  });

  it('sends category, price, availability, and sort values together', async () => {
    respondWith([milk]);
    renderCatalog();
    await screen.findByText('Fresh Milk');

    fireEvent.change(screen.getByLabelText('Category'), {target: {value: 'Drinks'}});
    fireEvent.change(screen.getByLabelText('Minimum price'), {target: {value: '100'}});
    fireEvent.change(screen.getByLabelText('Maximum price'), {target: {value: '1000'}});
    fireEvent.change(screen.getByLabelText('Availability'), {target: {value: 'true'}});
    fireEvent.change(screen.getByLabelText('Sort by'), {target: {value: 'price:asc'}});

    await waitFor(() => expect(productService.getAll).toHaveBeenLastCalledWith(expect.objectContaining({category: 'Drinks', minPrice: '100', maxPrice: '1000', available: 'true', sortBy: 'price', sortOrder: 'asc', page: 1})), {timeout: 1000});
  });

  it('keeps filters while changing pages and can clear them', async () => {
    respondWith([milk], {total: 21, totalPages: 3});
    renderCatalog();
    await screen.findByText('Fresh Milk');

    fireEvent.change(screen.getByLabelText('Search products...'), {target: {value: 'milk'}});
    await waitFor(() => expect(screen.getByRole('button', {name: '2'})).toBeInTheDocument(), {timeout: 1000});
    await waitFor(() => expect(screen.getByText('Page 1 of 3')).toBeInTheDocument());
    await new Promise((resolve) => setTimeout(resolve, 400));
    fireEvent.click(screen.getByRole('button', {name: '2', exact: true}));
    await waitFor(() => expect(productService.getAll).toHaveBeenLastCalledWith(expect.objectContaining({search: 'milk', page: 2})), {timeout: 1000});

    fireEvent.click(screen.getByRole('button', {name: /clear filters/i}));
    await waitFor(() => expect(productService.getAll).toHaveBeenLastCalledWith(expect.objectContaining({search: '', category: '', page: 1})), {timeout: 1000});
  });

  it('shows empty and backend error states without crashing', async () => {
    respondWith([]);
    renderCatalog();
    expect(await screen.findByText('No products found')).toBeInTheDocument();

    productService.getAll.mockRejectedValueOnce(new Error('network failure'));
    fireEvent.change(screen.getByLabelText('Search products...'), {target: {value: 'missing'}});
    expect(await screen.findByText("We couldn't load products")).toBeInTheDocument();
    expect(screen.getByRole('button', {name: 'Retry'})).toBeInTheDocument();
  });
});