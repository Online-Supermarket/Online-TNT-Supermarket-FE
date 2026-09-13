import {useEffect, useMemo, useState} from 'react';
import {useSearchParams} from 'react-router-dom';
import {Filter, RotateCcw} from 'lucide-react';
import ProductCard from '../../components/ProductCard';
import LoadingSpinner from '../../components/LoadingSpinner';
import {Empty, PageHeader} from '../../components/Ui';
import api from '../../services/api';
import {productService} from '../../services/productService';
import './Categories.css';

const PAGE_SIZE = 10;

function rowsFrom(payload) {
	if (Array.isArray(payload)) return payload;
	return payload?.items || payload?.products || payload?.data || [];
}

function paginationFrom(payload, rowCount, page) {
	const metadata = payload?.pagination || payload?.meta || payload || {};
	const total = Number(metadata.total ?? metadata.totalCount ?? metadata.count ?? rowCount);
	const totalPages = Number(metadata.totalPages ?? metadata.pageCount ?? (Math.ceil(total / PAGE_SIZE) || 1));
	return {total, totalPages: Math.max(totalPages, 1), page};
}

function categoryName(product) {
	return product.category?.name || product.categoryName || product.category || '';
}

function normalizeProduct(product) {
	return {
		...product,
		image: product.image || product.imageUrl || product.ImageUrl || null,
		name: product.name || product.Name || 'Unnamed product',
		category: categoryName(product),
		price: Number(product.price ?? product.Price ?? 0),
		stock: Number(product.stock ?? product.stockQuantity ?? product.StockQuantity ?? 0),
		unit: product.unit || product.Unit || '',
		rating: product.rating || product.Rating || 0,
	};
}

function categoriesFrom(rows) {
	return rows.reduce((categories, product) => {
		const name = categoryName(product);
		if (name && !categories.some((category) => category.name === name)) {
			categories.push({id: product.categoryId || name, name});
		}
		return categories;
	}, []);
}

export default function Categories() {
	const [searchParams, setSearchParams] = useSearchParams();
	const [search, setSearch] = useState(searchParams.get('search') || '');
	const [debouncedSearch, setDebouncedSearch] = useState(searchParams.get('search') || '');
	const [category, setCategory] = useState(searchParams.get('category') || '');
	const [minPrice, setMinPrice] = useState(searchParams.get('minPrice') || '');
	const [maxPrice, setMaxPrice] = useState(searchParams.get('maxPrice') || '');
	const [availability, setAvailability] = useState(searchParams.get('available') || '');
	const [sort, setSort] = useState(searchParams.get('sort') || '');
	const [page, setPage] = useState(Number(searchParams.get('page')) || 1);
	const [products, setProducts] = useState([]);
	const [categories, setCategories] = useState([]);
	const [pagination, setPagination] = useState({total: 0, totalPages: 1, page: 1});
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [reloadKey, setReloadKey] = useState(0);

	useEffect(() => {
		const timer = setTimeout(() => {
			setDebouncedSearch(search);
			setPage(1);
		}, 350);
		return () => clearTimeout(timer);
	}, [search]);

	useEffect(() => {
		const [sortBy = '', sortOrder = ''] = sort.split(':');
		const params = {
			search: debouncedSearch,
			category,
			minPrice,
			maxPrice,
			available: availability,
			sortBy,
			sortOrder,
			page,
		};
		const nextParams = Object.fromEntries(Object.entries(params).filter(([, value]) => value));
		setSearchParams(nextParams, {replace: true});
	}, [availability, category, debouncedSearch, maxPrice, minPrice, page, setSearchParams, sort]);

	useEffect(() => {
		if (minPrice !== '' && Number(minPrice) < 0 || maxPrice !== '' && Number(maxPrice) < 0 || minPrice !== '' && maxPrice !== '' && Number(minPrice) > Number(maxPrice)) {
			setLoading(false);
			setProducts([]);
			return;
		}

		let active = true;
		async function loadProducts() {
			setLoading(true);
			setError(null);
			const [sortBy = '', sortOrder = ''] = sort.split(':');
			try {
				const response = await productService.getAll({
					search: debouncedSearch,
					category,
					minPrice,
					maxPrice,
					available: availability,
					sortBy,
					sortOrder,
					page,
					pageSize: PAGE_SIZE,
				});
				if (!active) return;
				const rows = rowsFrom(response.data);
				setProducts(rows.map(normalizeProduct));
				setPagination(paginationFrom(response.data, rows.length, page));
				setCategories((current) => current.length ? current : categoriesFrom(rows));
			} catch (requestError) {
				if (active) {
					setProducts([]);
					setPagination({total: 0, totalPages: 1, page});
					setError(requestError);
				}
			} finally {
				if (active) setLoading(false);
			}
		}
		loadProducts();
		return () => { active = false; };
	}, [availability, category, debouncedSearch, maxPrice, minPrice, page, reloadKey, sort]);

	useEffect(() => {
		let active = true;
		api.get('/api/categories').then((response) => {
			if (active) setCategories(rowsFrom(response.data));
		}).catch(() => {});
		return () => { active = false; };
	}, []);

	const validationError = useMemo(() => {
		if (minPrice !== '' && Number(minPrice) < 0) return 'Minimum price cannot be negative.';
		if (maxPrice !== '' && Number(maxPrice) < 0) return 'Maximum price cannot be negative.';
		if (minPrice !== '' && maxPrice !== '' && Number(minPrice) > Number(maxPrice)) return 'Minimum price cannot be greater than maximum price.';
		return null;
	}, [maxPrice, minPrice]);

	function resetPage(update) {
		update();
		setPage(1);
	}

	function clearFilters() {
		setSearch('');
		setDebouncedSearch('');
		setCategory('');
		setMinPrice('');
		setMaxPrice('');
		setAvailability('');
		setSort('');
		setPage(1);
	}

	const hasFilters = search || category || minPrice || maxPrice || availability || sort;

	return <>
		<PageHeader eyebrow="The full collection" title="Find your fresh" description="Search and filter every product in the TNT supermarket." />
		<section className="section-wrap catalog-page">
			<div className="catalog-filters panel">
				<div className="catalog-search"><label htmlFor="product-search">Search products...</label><input id="product-search" value={search} onChange={(event) => resetPage(() => setSearch(event.target.value))} placeholder="Search products..." /></div>
				<div className="catalog-filter-grid">
					<label>Category<select value={category} onChange={(event) => resetPage(() => setCategory(event.target.value))}><option value="">All categories</option>{categories.map((item) => <option key={item.id || item.name} value={item.name || item.id}>{item.name || item.Name}</option>)}</select></label>
					<label>Minimum price<input type="number" min="0" value={minPrice} onChange={(event) => resetPage(() => setMinPrice(event.target.value))} placeholder="Min" /></label>
					<label>Maximum price<input type="number" min="0" value={maxPrice} onChange={(event) => resetPage(() => setMaxPrice(event.target.value))} placeholder="Max" /></label>
					<label>Availability<select value={availability} onChange={(event) => resetPage(() => setAvailability(event.target.value))}><option value="">All products</option><option value="true">Available</option><option value="false">Out of stock</option></select></label>
					<label>Sort by<select value={sort} onChange={(event) => resetPage(() => setSort(event.target.value))}><option value="">Recommended</option><option value="price:asc">Price: Low to High</option><option value="price:desc">Price: High to Low</option><option value="name:asc">Name: A to Z</option><option value="name:desc">Name: Z to A</option></select></label>
				</div>
				<div className="catalog-filter-footer"><span><Filter size={16} /> {pagination.total} products</span>{validationError && <p className="catalog-validation" role="alert">{validationError}</p>}<button className="btn btn-light" type="button" onClick={clearFilters} disabled={!hasFilters}><RotateCcw size={16} /> Clear filters</button></div>
			</div>

			{loading && <div className="catalog-status" aria-live="polite"><LoadingSpinner /></div>}
			{!loading && error && <div className="catalog-status"><Empty title="We couldn't load products" text="Please check your connection and try again."/><button className="btn btn-primary" type="button" onClick={() => setReloadKey((current) => current + 1)}>Retry</button></div>}
			{!loading && !error && !validationError && !products.length && <div className="catalog-status"><Empty title="No products found" text="Try changing your search or filters."/><button className="btn btn-light" type="button" onClick={clearFilters}>Clear filters</button></div>}
			{!loading && !error && !validationError && products.length > 0 && <>
				<div className="catalog-results"><p>Showing {products.length} of {pagination.total} products</p><span>Page {page} of {pagination.totalPages}</span></div>
				<div className="product-grid">{products.map((product) => <ProductCard key={product.id} product={product} />)}</div>
				{pagination.totalPages > 1 && <nav className="catalog-pagination" aria-label="Product pages"><button className="btn btn-light" disabled={page <= 1} onClick={() => setPage((current) => current - 1)}>Previous</button>{Array.from({length: pagination.totalPages}, (_, index) => index + 1).map((number) => <button key={number} className={`page-number ${number === page ? 'active' : ''}`} aria-current={number === page ? 'page' : undefined} onClick={() => setPage(number)}>{number}</button>)}<button className="btn btn-light" disabled={page >= pagination.totalPages} onClick={() => setPage((current) => current + 1)}>Next</button></nav>}
			</>}
		</section>
	</>;
}
