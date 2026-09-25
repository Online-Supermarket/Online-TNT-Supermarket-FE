import React, { useState, useEffect, useMemo } from 'react';
import { Search, Filter, SlidersHorizontal, AlertCircle, RefreshCw } from 'lucide-react';
import { ProductCard } from '../../components/ProductCard';
import axiosInstance from '../../services/axiosInstance';

export const ShopPage = () => {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState('ALL');
  const [sortBy, setSortBy] = useState('DEFAULT');
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [maxPrice, setMaxPrice] = useState(0); // 0 = no max applied until products load

  // Derive price ceiling from actual product data
  const priceCeiling = useMemo(() => {
    if (products.length === 0) return 1000;
    return Math.ceil(Math.max(...products.map((p) => Number(p.price) || 0)) * 1.1);
  }, [products]);

  const [userSetMax, setUserSetMax] = useState(false); // tracks if user manually moved slider

  // Effective max price used for filtering
  const effectiveMax = userSetMax ? maxPrice : priceCeiling;

  const loadData = () => {
    setLoading(true);
    setError('');

    // Fetch active products from real API (backend filters active=true automatically)
    const productPromise = axiosInstance
      .get('/catalog/products')
      .then((data) => {
        if (Array.isArray(data)) {
          return data;
        }
        // Handle paginated response shape just in case
        if (data && Array.isArray(data.items)) {
          return data.items;
        }
        return [];
      })
      .catch((err) => {
        const msg = err?.message || 'Failed to load products.';
        setError(msg);
        console.error('[ShopPage] GET /catalog/products failed:', err);
        return [];
      });

    // Fetch categories from real API
    const categoryPromise = axiosInstance
      .get('/catalog/categories')
      .then((data) => {
        if (Array.isArray(data)) return data;
        return [];
      })
      .catch((err) => {
        console.warn('[ShopPage] GET /catalog/categories failed:', err);
        return [];
      });

    Promise.all([productPromise, categoryPromise]).then(([prods, cats]) => {
      setProducts(prods);
      setCategories(cats);
      setLoading(false);
    });
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => {
        const q = search.trim().toLowerCase();
        const matchQuery =
          !q ||
          (p.name || '').toLowerCase().includes(q) ||
          ((p.sku || '').toLowerCase().includes(q));

        // Category match: compare against category name or id
        const catName = (p.category?.name || p.category || '').toUpperCase();
        const catId = p.category?.id || p.categoryId || '';
        const matchCat =
          selectedCat === 'ALL' ||
          catName === selectedCat.toUpperCase() ||
          catId === selectedCat;

        // Price filter
        const matchPrice = Number(p.price) <= effectiveMax;

        return matchQuery && matchCat && matchPrice;
      })
      .sort((a, b) => {
        if (sortBy === 'PRICE_LOW') return Number(a.price) - Number(b.price);
        if (sortBy === 'PRICE_HIGH') return Number(b.price) - Number(a.price);
        if (sortBy === 'NAME') return (a.name || '').localeCompare(b.name || '');
        return 0; // DEFAULT: backend already sorts by name
      });
  }, [products, search, selectedCat, sortBy, effectiveMax]);

  return (
    <div style={{ maxWidth: 1280, margin: '0 auto', padding: '40px 24px 80px' }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '2.5rem', color: 'var(--color-primary-dark)', marginBottom: 8 }}>
          Shop Fresh Catalog
        </h1>
        <p style={{ color: 'var(--color-muted)' }}>Filter through farm-fresh groceries and organic local goods.</p>
      </div>

      {/* API Error Banner */}
      {error && (
        <div
          style={{
            background: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#991b1b',
            padding: '12px 16px',
            borderRadius: 'var(--radius-md)',
            marginBottom: 24,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
          <button
            onClick={loadData}
            style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#991b1b', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 12px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}
          >
            <RefreshCw size={14} /> Retry
          </button>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 32 }}>
        {/* SIDEBAR FILTERS */}
        <aside style={{ background: '#ffffff', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: 24, height: 'fit-content' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, fontSize: '1.1rem', marginBottom: 20, color: 'var(--color-primary-dark)' }}>
            <Filter size={18} /> Filters
          </div>

          {/* Search */}
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: 6 }}>Search Item</label>
            <div style={{ position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: 10, top: 12, color: 'var(--color-muted)' }} />
              <input
                type="text"
                placeholder="Product name or SKU..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ width: '100%', padding: '10px 10px 10px 34px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', outline: 'none' }}
              />
            </div>
          </div>

          {/* Category Tabs — sourced from real API */}
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: 10 }}>Categories</label>
            <div style={{ display: 'grid', gap: 6 }}>
              {['ALL', ...categories.map((c) => c.name)].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCat(cat)}
                  style={{
                    textAlign: 'left',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-sm)',
                    border: 'none',
                    background: selectedCat === cat ? 'var(--color-soft-mint)' : 'transparent',
                    color: selectedCat === cat ? 'var(--color-primary)' : 'var(--color-ink-dark)',
                    fontWeight: selectedCat === cat ? 700 : 500,
                    cursor: 'pointer',
                  }}
                >
                  {cat === 'ALL' ? 'All Categories' : cat}
                </button>
              ))}
            </div>
          </div>

          {/* Price Range Slider — auto-scales to actual product price range */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600, fontSize: '0.85rem', marginBottom: 8 }}>
              <span>Max Price</span>
              <span style={{ color: 'var(--color-primary)' }}>
                {userSetMax ? `Rs. ${maxPrice.toLocaleString()}` : 'Any'}
              </span>
            </div>
            <input
              type="range"
              min="0"
              max={priceCeiling}
              value={userSetMax ? maxPrice : priceCeiling}
              onChange={(e) => {
                setUserSetMax(true);
                setMaxPrice(Number(e.target.value));
              }}
              style={{ width: '100%', accentColor: 'var(--color-primary)' }}
            />
            {userSetMax && (
              <button
                onClick={() => { setUserSetMax(false); setMaxPrice(0); }}
                style={{ marginTop: 6, fontSize: '0.78rem', color: 'var(--color-muted)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
              >
                Reset price filter
              </button>
            )}
          </div>
        </aside>

        {/* MAIN PRODUCT GRID AREA */}
        <div>
          {/* SORT BAR */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#ffffff', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '12px 20px', marginBottom: 24 }}>
            <span style={{ fontSize: '0.9rem', color: 'var(--color-muted)' }}>
              {loading ? 'Loading…' : <>Showing <strong>{filteredProducts.length}</strong> of <strong>{products.length}</strong> items</>}
            </span>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <SlidersHorizontal size={16} color="var(--color-muted)" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                style={{ border: 'none', background: 'transparent', fontWeight: 600, outline: 'none', cursor: 'pointer' }}
              >
                <option value="DEFAULT">Sort by: Recommended</option>
                <option value="PRICE_LOW">Price: Low to High</option>
                <option value="PRICE_HIGH">Price: High to Low</option>
                <option value="NAME">Name: A to Z</option>
              </select>
            </div>
          </div>

          {/* PRODUCTS GRID */}
          {loading ? (
            <div style={{ background: '#ffffff', borderRadius: 'var(--radius-md)', padding: 60, textAlign: 'center', border: '1px solid var(--color-border)' }}>
              <p style={{ color: 'var(--color-muted)' }}>Loading products from database…</p>
            </div>
          ) : !error && products.length === 0 ? (
            <div style={{ background: '#ffffff', borderRadius: 'var(--radius-md)', padding: 60, textAlign: 'center', border: '1px solid var(--color-border)' }}>
              <h3 style={{ marginBottom: 8 }}>No products available yet.</h3>
              <p style={{ color: 'var(--color-muted)' }}>Check back soon — new items are being added to the catalog.</p>
            </div>
          ) : filteredProducts.length > 0 ? (
            <div className="products-grid">
              {filteredProducts.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          ) : (
            <div style={{ background: '#ffffff', borderRadius: 'var(--radius-md)', padding: 60, textAlign: 'center', border: '1px solid var(--color-border)' }}>
              <h3>No items match your filter selection.</h3>
              <p style={{ color: 'var(--color-muted)', marginTop: 8 }}>Try resetting your search or adjusting the price slider.</p>
              <button
                onClick={() => { setSearch(''); setSelectedCat('ALL'); setUserSetMax(false); setMaxPrice(0); }}
                style={{ marginTop: 16, padding: '8px 16px', background: 'var(--color-primary)', color: '#fff', border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontWeight: 600 }}
              >
                Clear All Filters
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
