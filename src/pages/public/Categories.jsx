import {useEffect, useState} from 'react';
import {ChevronLeft, ChevronRight, Search, SlidersHorizontal} from 'lucide-react';
import ProductCard from '../../components/ProductCard';
import {Empty} from '../../components/Ui';
import api from '../../services/api';
import {categoryService, getCategoryLabel, unwrapCategories} from '../../services/categoryService';

const initialFilters = {search: '', category: '', minPrice: '', maxPrice: '', available: ''};

function mapProduct(product) {
	return {...product, image: product.imageUrl || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80', category: product.category || 'Grocery', stock: product.stockQuantity, unit: product.unit || 'item', rating: product.rating || 'New'};
}

export default function Categories() {
	const [filters, setFilters] = useState(initialFilters);
	const [sort, setSort] = useState('name-asc');
	const [page, setPage] = useState(1);
	const [products, setProducts] = useState([]);
	const [meta, setMeta] = useState({totalItems: 0, totalPages: 0});
	const [categories, setCategories] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);

	useEffect(() => {
		let active = true;
		async function loadCategories() {
			try {
				const response = await categoryService.getCategories({isActive: true});
				if (active) setCategories(unwrapCategories(response.data));
			} catch {
				if (active) setCategories([]);
			}
		}
		loadCategories();
		return () => { active = false; };
	}, []);

	useEffect(() => {
		let active = true;
		const [sortBy, sortOrder] = sort.split('-');
		async function loadProducts() {
			setLoading(true);
			setError(null);
			try {
				const response = await api.get('/api/products', {params: {...filters, minPrice: filters.minPrice || undefined, maxPrice: filters.maxPrice || undefined, available: filters.available || undefined, sortBy, sortOrder, page, pageSize: 12}});
				const payload = response.data || {};
				if (active) {
					setProducts((payload.items || []).map(mapProduct));
					setMeta({totalItems: payload.totalItems || 0, totalPages: payload.totalPages || 0});
				}
			} catch (requestError) {
				if (active) { setProducts([]); setError(requestError); }
			} finally {
				if (active) setLoading(false);
			}
		}
		loadProducts();
		return () => { active = false; };
	}, [filters, sort, page]);

	const updateFilter = (name, value) => { setPage(1); setFilters((current) => ({...current, [name]: value})); };
	const clearFilters = () => { setPage(1); setFilters(initialFilters); };

	return <>
		<section className="inner-hero catalog-hero"><div className="section-wrap"><span className="eyebrow">TNT online supermarket</span><h1>Shop fresh, shop easy.</h1><p>Find your everyday essentials with smart search and simple filters.</p></div></section>
		<section className="section-wrap catalog-page">
			<div className="catalog-toolbar"><label className="catalog-search"><Search size={18}/><input value={filters.search} onChange={(event) => updateFilter('search', event.target.value)} placeholder="Search products..."/></label><div className="catalog-toolbar-actions"><span>{meta.totalItems} products</span><label>Sort by <select value={sort} onChange={(event) => {setPage(1); setSort(event.target.value);}}><option value="name-asc">Name, A-Z</option><option value="name-desc">Name, Z-A</option><option value="price-asc">Price, low to high</option><option value="price-desc">Price, high to low</option></select></label></div></div>
			<div className="catalog-layout">
				<aside className="catalog-filters"><div className="filter-heading"><h2><SlidersHorizontal size={18}/> Filters</h2><button type="button" onClick={clearFilters}>Clear</button></div><label>Category<select value={filters.category} onChange={(event) => updateFilter('category', event.target.value)}><option value="">All categories</option>{categories.map((category) => <option key={category.id || category.categoryId} value={getCategoryLabel(category)}>{getCategoryLabel(category)}</option>)}</select></label><div className="price-fields"><label>Min price<input type="number" min="0" value={filters.minPrice} onChange={(event) => updateFilter('minPrice', event.target.value)} placeholder="0"/></label><label>Max price<input type="number" min="0" value={filters.maxPrice} onChange={(event) => updateFilter('maxPrice', event.target.value)} placeholder="Any"/></label></div><label>Availability<select value={filters.available} onChange={(event) => updateFilter('available', event.target.value)}><option value="">All products</option><option value="true">In stock</option><option value="false">Out of stock</option></select></label></aside>
				<div className="catalog-results">{loading && <div className="catalog-status">Loading products...</div>}{!loading && error && <Empty title="Products could not load" text="Please check the backend connection and try again."/>}{!loading && !error && products.length === 0 && <Empty title="No products found" text="Try changing your search or filters."/>}{!loading && !error && products.length > 0 && <div className="product-grid">{products.map((product) => <ProductCard key={product.id} product={product}/>)}</div>}{!loading && meta.totalPages > 1 && <div className="catalog-pagination"><button disabled={page === 1} onClick={() => setPage((current) => current - 1)}><ChevronLeft size={17}/> Previous</button><span>Page {page} of {meta.totalPages}</span><button disabled={page === meta.totalPages} onClick={() => setPage((current) => current + 1)}>Next <ChevronRight size={17}/></button></div>}</div>
			</div>
		</section>
	</>;
}
