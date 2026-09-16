import { useState } from 'react';
import DataTable from '../../components/DataTable';
import { PageHeader, SearchBox, Status } from '../../components/Ui';
import useApiCollection from '../../hooks/useApiCollection';

export default function StaffProducts() {
  const { data: products, loading, error } = useApiCollection('/api/products');
  const [q, setQ] = useState('');

  const safeProducts = Array.isArray(products) ? products : [];
  const filtered = safeProducts.filter((p) =>
    (p.name || '').toLowerCase().includes(q.toLowerCase())
  );

  return (
    <>
      <PageHeader title="Products" description="View products and stock availability." />
      <section className="panel">
        <div className="table-tools">
          <SearchBox value={q} onChange={setQ} placeholder="Search products..." />
        </div>
        {loading && <div style={{ padding: '2rem', textAlign: 'center' }}>Loading products...</div>}
        {error && <div className="error">{error}</div>}
        {!loading && (
          <DataTable
            rows={filtered}
            columns={[
              {
                key: 'name',
                label: 'PRODUCT',
                render: (r) => (
                  <div className="table-product">
                    {r.imageUrl || r.image ? (
                      <img src={r.imageUrl || r.image} alt={r.name || ''} style={{ width: 36, height: 36, borderRadius: 4, objectFit: 'cover' }} />
                    ) : null}
                    <div>
                      <b>{r.name}</b>
                    </div>
                  </div>
                ),
              },
              {
                key: 'price',
                label: 'PRICE',
                render: (r) => `Rs. ${Number(r.price || 0).toFixed(2)}`,
              },
              {
                key: 'stock',
                label: 'STOCK QUANTITY',
                render: (r) => r.stockQuantity ?? r.stock ?? 0,
              },
              {
                key: 'status',
                label: 'AVAILABILITY',
                render: (r) => {
                  const qty = r.stockQuantity ?? r.stock ?? 0;
                  return <Status>{qty > 0 ? 'Available' : 'Unavailable'}</Status>;
                },
              },
            ]}
          />
        )}
      </section>
    </>
  );
}
