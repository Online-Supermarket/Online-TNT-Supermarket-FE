import React, { useState, useEffect } from 'react';
import { Package, RefreshCw, AlertCircle, Tag } from 'lucide-react';
import axiosInstance from '../../services/axiosInstance';
import { normalizeProduct } from '../../models/Product';

export const StaffProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchProducts = async () => {
    setLoading(true);
    setError('');
    try {
      let data;
      try {
        data = await axiosInstance.get('/catalog/staff/products');
      } catch {
        data = await axiosInstance.get('/catalog/products?pageSize=100');
      }

      if (Array.isArray(data)) {
        setProducts(data.map(normalizeProduct));
      } else {
        setProducts([]);
      }
    } catch (err) {
      setError(err.message || 'Failed to load catalog products.');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <Package size={28} style={{ color: 'var(--color-primary)' }} />
            <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '2.2rem', color: 'var(--color-primary-dark)', margin: 0 }}>
              Catalog Products View
            </h1>
          </div>
          <p style={{ color: 'var(--color-muted)', margin: 0 }}>Staff view of active catalog items and shelf stock levels.</p>
        </div>

        <button className="btn btn-outline" onClick={fetchProducts} disabled={loading}>
          <RefreshCw size={16} className={loading ? 'spin' : ''} /> Refresh
        </button>
      </div>

      {error && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', padding: '12px 16px', borderRadius: 'var(--radius-md)', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 10 }}>
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      <div style={{ background: '#ffffff', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: 24, boxShadow: 'var(--shadow-sm)' }}>
        <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'var(--color-soft-mint)', textAlign: 'left' }}>
              <th style={{ padding: '12px 16px' }}>SKU</th>
              <th style={{ padding: '12px 16px' }}>Item Name</th>
              <th style={{ padding: '12px 16px' }}>Category</th>
              <th style={{ padding: '12px 16px' }}>Price</th>
              <th style={{ padding: '12px 16px' }}>Shelf Stock</th>
            </tr>
          </thead>
          <tbody>
            {!loading && products.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: 32, color: 'var(--color-muted)' }}>
                  No products available in catalog.
                </td>
              </tr>
            ) : products.map((p) => (
              <tr key={p.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontWeight: 600, fontSize: '0.88rem', color: 'var(--color-primary-dark)' }}>
                  {p.sku}
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <strong>{p.name}</strong>
                  {p.description && <div style={{ fontSize: '0.8rem', color: 'var(--color-muted)' }}>{p.description}</div>}
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'var(--color-soft-mint)', color: 'var(--color-primary-dark)', padding: '4px 10px', borderRadius: 'var(--radius-sm)', fontSize: '0.82rem', fontWeight: 600 }}>
                    <Tag size={12} /> {p.category?.name || 'Uncategorized'}
                  </span>
                </td>
                <td style={{ padding: '12px 16px', fontWeight: 700 }}>
                  ${Number(p.price).toFixed(2)}
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <span className={`status-pill ${p.stockQuantity === 0 ? 'status-cancelled' : p.stockQuantity <= 10 ? 'status-pending' : 'status-delivered'}`}>
                    {p.stockQuantity} in stock
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
