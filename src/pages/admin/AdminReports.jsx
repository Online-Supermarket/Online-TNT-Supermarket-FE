import React, { useCallback, useEffect, useState } from 'react';
import { BarChart3, Download, RefreshCw, Package, ShoppingCart, AlertTriangle } from 'lucide-react';
import axiosInstance from '../../services/axiosInstance';

const money = (value, currency = 'LKR') => `${currency === 'LKR' ? 'Rs.' : currency} ${Number(value || 0).toFixed(2)}`;
const query = (values) => {
  const params = new URLSearchParams();
  Object.entries(values).forEach(([key, value]) => { if (value !== undefined && value !== null && value !== '') params.set(key, value); });
  return params.toString();
};

export const AdminReports = () => {
  const [sales, setSales] = useState(null); const [inventory, setInventory] = useState(null);
  const [filters, setFilters] = useState({ from: '', to: '', status: '', threshold: 5 });
  const [loading, setLoading] = useState(true); const [error, setError] = useState(''); const [exporting, setExporting] = useState('');
  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const from = filters.from ? `${filters.from}T00:00:00Z` : ''; const to = filters.to ? `${filters.to}T23:59:59.999Z` : '';
      const [salesReport, inventoryReport] = await Promise.all([
        axiosInstance.get(`/reporting/reports/sales?${query({ from, to, status: filters.status })}`),
        axiosInstance.get(`/reporting/reports/inventory?${query({ threshold: filters.threshold })}`),
      ]);
      setSales(salesReport); setInventory(inventoryReport);
    } catch (err) { setError(err.message || 'Unable to load reporting data.'); } finally { setLoading(false); }
  }, [filters]);
  useEffect(() => { load(); }, [load]);
  const exportReport = async (kind) => {
    setExporting(kind); setError('');
    try {
      const from = filters.from ? `${filters.from}T00:00:00Z` : ''; const to = filters.to ? `${filters.to}T23:59:59.999Z` : '';
      const path = kind === 'sales' ? `/reporting/reports/sales/export?${query({ from, to, status: filters.status })}` : `/reporting/reports/inventory/export?${query({ threshold: filters.threshold })}`;
      const blob = await axiosInstance.get(path, { responseType: 'blob' }); const url = URL.createObjectURL(blob); const anchor = document.createElement('a');
      anchor.href = url; anchor.download = `${kind}-report.csv`; anchor.click(); URL.revokeObjectURL(url);
    } catch (err) { setError(err.message || `Unable to export ${kind} report.`); } finally { setExporting(''); }
  };
  return <div>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
      <div><h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '2.2rem', color: 'var(--color-primary-dark)', marginBottom: 6 }}>Sales & Inventory Reports</h1><p style={{ color: 'var(--color-muted)', margin: 0 }}>Live reporting data from order and catalog events.</p></div>
      <div style={{ display: 'flex', gap: 8 }}><button className="btn btn-outline" onClick={load} disabled={loading}><RefreshCw size={16} className={loading ? 'spin' : ''} /> Refresh</button><button className="btn btn-primary" onClick={() => exportReport('sales')} disabled={!!exporting}><Download size={16} /> {exporting === 'sales' ? 'Exporting…' : 'Sales CSV'}</button><button className="btn btn-outline" onClick={() => exportReport('inventory')} disabled={!!exporting}><Download size={16} /> {exporting === 'inventory' ? 'Exporting…' : 'Inventory CSV'}</button></div>
    </div>
    {error && <div role="alert" style={{ marginBottom: 18, padding: 12, borderRadius: 8, background: '#fee2e2', color: '#991b1b' }}>{error}</div>}
    <section style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'end', padding: 16, marginBottom: 20, background: '#fff', border: '1px solid var(--color-border)', borderRadius: 8 }}>
      <label>From<input type="date" value={filters.from} onChange={e => setFilters(f => ({ ...f, from: e.target.value }))} /></label><label>To<input type="date" value={filters.to} onChange={e => setFilters(f => ({ ...f, to: e.target.value }))} /></label><label>Status<select value={filters.status} onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}><option value="">All statuses</option><option value="Confirmed">Confirmed</option><option value="PendingReservation">Pending reservation</option><option value="Cancelled">Cancelled</option><option value="Rejected">Rejected</option></select></label><label>Low-stock threshold<input type="number" min="0" max="999999" value={filters.threshold} onChange={e => setFilters(f => ({ ...f, threshold: Math.max(0, Number(e.target.value) || 0) }))} /></label>
    </section>
    <div className="kpi-grid" style={{ marginBottom: 24 }}>
      <div className="kpi-card"><div className="kpi-icon" style={{ background: '#dcfce7', color: '#166534' }}><BarChart3 size={22} /></div><div><div className="kpi-label">RECOGNIZED SALES</div><div className="kpi-val">{loading ? '…' : money(sales?.recognizedSales, sales?.orders?.[0]?.currency)}</div><div className="kpi-sub">Confirmed orders only</div></div></div>
      <div className="kpi-card"><div className="kpi-icon" style={{ background: '#dbeafe', color: '#1d4ed8' }}><ShoppingCart size={22} /></div><div><div className="kpi-label">ORDERS</div><div className="kpi-val">{loading ? '…' : sales?.orderCount ?? 0}</div><div className="kpi-sub">Orders in selected range</div></div></div>
      <div className="kpi-card"><div className="kpi-icon" style={{ background: '#fef3c7', color: '#92400e' }}><Package size={22} /></div><div><div className="kpi-label">PRODUCTS</div><div className="kpi-val">{loading ? '…' : inventory?.totalProducts ?? 0}</div><div className="kpi-sub">Active catalog products</div></div></div>
      <div className="kpi-card"><div className="kpi-icon" style={{ background: '#fee2e2', color: '#b91c1c' }}><AlertTriangle size={22} /></div><div><div className="kpi-label">LOW STOCK</div><div className="kpi-val">{loading ? '…' : inventory?.lowStockCount ?? 0}</div><div className="kpi-sub">At or below threshold</div></div></div>
    </div>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 20 }}>
      <section style={{ background: '#fff', border: '1px solid var(--color-border)', borderRadius: 8, padding: 20, overflowX: 'auto' }}><h2 style={{ marginTop: 0 }}>Sales</h2><table className="data-table"><thead><tr><th>Order</th><th>Date</th><th>Status</th><th>Total</th></tr></thead><tbody>{(sales?.orders || []).map(order => <tr key={order.id}><td>{String(order.id).slice(0, 8)}…</td><td>{new Date(order.createdAt).toLocaleDateString()}</td><td>{order.status}</td><td>{money(order.total, order.currency)}</td></tr>)}{!loading && !sales?.orders?.length && <tr><td colSpan="4">No orders found.</td></tr>}</tbody></table></section>
      <section style={{ background: '#fff', border: '1px solid var(--color-border)', borderRadius: 8, padding: 20, overflowX: 'auto' }}><h2 style={{ marginTop: 0 }}>Inventory</h2><table className="data-table"><thead><tr><th>SKU</th><th>Product</th><th>Stock</th><th>Price</th></tr></thead><tbody>{(inventory?.products || []).map(product => <tr key={product.sku}><td>{product.sku}</td><td>{product.name}</td><td style={{ color: product.lowStock ? '#b91c1c' : undefined }}>{product.stockQuantity}</td><td>{money(product.price)}</td></tr>)}{!loading && !inventory?.products?.length && <tr><td colSpan="4">No products found.</td></tr>}</tbody></table></section>
    </div>
  </div>;
};

export default AdminReports;
