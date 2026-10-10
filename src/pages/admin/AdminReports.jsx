import React, { useEffect, useRef, useState } from 'react';
import { Download, RefreshCw, Banknote, Building2, Package, BarChart3 } from 'lucide-react';
import axiosInstance from '../../services/axiosInstance';
import { dateRange, formatMoney, isSale, paymentName, reportCsv, showTotals } from '../../utils/reporting';
import './AdminReports.css';

const initialFilters = { from: '', to: '', status: '', paymentMethod: '', threshold: 5, stock: '' };
const statuses = ['Pending', 'PendingReservation', 'Confirmed', 'Delivery', 'Delivered', 'Cancelled', 'Rejected'];
export const AdminReports = () => {
  const [filters, setFilters] = useState(initialFilters);
  const [snapshot, setSnapshot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refresh, setRefresh] = useState(0);
  const [tab, setTab] = useState('sales');
  const request = useRef(0);
  useEffect(() => {
    const id = ++request.current;
    setLoading(true); setError(''); setSnapshot(null);
    (async () => {
      try {
        const range = dateRange(filters.from, filters.to);
        const params = new URLSearchParams();
        Object.entries({ ...range, status: filters.status }).forEach(([key,value]) => { if (value) params.set(key,value); });
        const [sales, inventory] = await Promise.all([
          axiosInstance.get(`/order/reports/sales?${params}`),
          axiosInstance.get(`/catalog/reports/inventory?threshold=${filters.threshold}`),
        ]);
        if (id === request.current) setSnapshot({ orders: sales.orders || [], products: inventory.products || [], generatedAt: new Date().toISOString() });
      } catch (err) { if (id === request.current) setError(err.message || 'Unable to load reports. Please refresh to try again.'); }
      finally { if (id === request.current) setLoading(false); }
    })();
    return () => { request.current++; };
  }, [filters.from, filters.to, filters.status, filters.threshold, refresh]);
  const field = (name, value) => setFilters(current => ({ ...current, [name]: value }));
  const orders = (snapshot?.orders || []).filter(o => !filters.paymentMethod || (filters.paymentMethod === 'CashOnDelivery' ? ['CashOnDelivery','COD'].includes(o.paymentMethod) : o.paymentMethod === filters.paymentMethod));
  const products = (snapshot?.products || []).filter(p => !filters.stock || (filters.stock === 'low' ? p.stockQuantity <= filters.threshold : filters.stock === 'out' ? p.stockQuantity <= 0 : p.stockQuantity > filters.threshold));
  const sales = orders.filter(isSale);
  const cash = sales.filter(o => ['CashOnDelivery','COD'].includes(o.paymentMethod));
  const bank = sales.filter(o => o.paymentMethod === 'BankTransfer');
  const unknown = sales.filter(o => !['CashOnDelivery','COD','BankTransfer'].includes(o.paymentMethod));
  const stockValue = products.reduce((sum,p) => sum + Number(p.price) * Number(p.stockQuantity), 0);
  const exportReport = kind => {
    if (!snapshot || loading) return;
    try {
      const url = URL.createObjectURL(new Blob([reportCsv(kind, orders, products, filters, snapshot.generatedAt)], { type: 'text/csv;charset=utf-8;' }));
      const anchor = document.createElement('a'); anchor.href = url; anchor.download = `TNT-${kind}-report-${snapshot.generatedAt.slice(0,10)}.csv`;
      document.body.appendChild(anchor); anchor.click(); anchor.remove(); window.setTimeout(() => URL.revokeObjectURL(url), 30000);
    } catch { setError('Unable to download the report. Please try again.'); }
  };
  const date = value => new Date(value).toLocaleString('en-GB', { timeZone: 'Asia/Colombo' });
  return <div className="tnt-reports">
    <header className="tnt-reports-heading"><div><span className="tnt-reports-kicker">TNT BUSINESS OVERVIEW</span><h1>Sales & Stock Reports</h1><p>Cash sales, bank transfers and stock — together in one place.</p></div><div className="tnt-reports-actions"><button className="btn btn-outline" disabled={loading} onClick={() => setRefresh(n => n + 1)}><RefreshCw size={16} /> Refresh</button><button className="btn btn-primary" disabled={loading || !snapshot} onClick={() => exportReport('complete')}><Download size={17} /> Download Full Report</button></div></header>
    <section className="tnt-report-filters" aria-label="Report filters">
      <label>From date<input type="date" value={filters.from} onChange={e => field('from', e.target.value)} /></label>
      <label>To date<input type="date" value={filters.to} min={filters.from || undefined} onChange={e => field('to', e.target.value)} /></label>
      <label>Order status<select value={filters.status} onChange={e => field('status',e.target.value)}><option value="">All statuses</option>{statuses.map(s => <option key={s}>{s}</option>)}</select></label>
      <label>Payment method<select value={filters.paymentMethod} onChange={e => field('paymentMethod',e.target.value)}><option value="">All methods</option><option value="CashOnDelivery">Cash on delivery</option><option value="BankTransfer">Bank transfer</option></select></label>
      <label>Stock status<select value={filters.stock} onChange={e => field('stock',e.target.value)}><option value="">All products</option><option value="low">Low stock (includes zero)</option><option value="out">Out of stock</option><option value="healthy">Above threshold</option></select></label>
      <label>Low-stock threshold<input type="number" min="0" max="999999" step="1" value={filters.threshold} onChange={e => field('threshold',Math.min(999999,Math.max(0,Math.floor(Number(e.target.value) || 0))))} /></label>
      <button className="btn btn-ghost" onClick={() => setFilters(initialFilters)}>Reset filters</button>
    </section>
    {error && <p role="alert" className="tnt-report-error">{error}</p>}
    <div className="tnt-report-cards" aria-busy={loading}>
      {[['Total sales', showTotals(sales), `${sales.length} confirmed / delivery / delivered orders`, BarChart3], ['Cash sales', showTotals(cash), `${cash.length} cash-on-delivery orders`, Banknote], ['Bank sales', showTotals(bank), `${bank.length} bank-transfer orders`, Building2], ['Stock retail value', formatMoney(stockValue), `${products.length} products · ${products.reduce((n,p) => n + Number(p.stockQuantity),0)} units`, Package]].map(([title,value,note,Icon]) => <section className="tnt-report-card" key={title}><Icon size={22} /><span>{title}</span><strong>{loading ? '…' : snapshot ? value : '—'}</strong><small>{note}</small></section>)}
    </div>
    <p className="tnt-report-note">Sales include confirmed, out-for-delivery and delivered orders, including delivery fees and tax. These are order values, not a cash collection statement. Pending, cancelled and rejected orders are excluded from sales totals. Currencies are shown separately.</p>
    {unknown.length > 0 && <p className="tnt-report-note">{unknown.length} sales orders have an unspecified payment method ({showTotals(unknown)}); these are included only in total sales.</p>}
    <section className="tnt-report-panel">
      <div className="tnt-report-panel-heading"><div className="tnt-report-tabs" role="group" aria-label="Report section"><button aria-pressed={tab === 'sales'} onClick={() => setTab('sales')}>Sales & payments <span>{orders.length}</span></button><button aria-pressed={tab === 'stock'} onClick={() => setTab('stock')}>Stock report <span>{products.length}</span></button></div><button className="btn btn-outline" disabled={loading || !snapshot} onClick={() => exportReport(tab === 'sales' ? 'sales' : 'inventory')}><Download size={15} /> {tab === 'sales' ? 'Sales CSV' : 'Stock CSV'}</button></div>
      {tab === 'sales' ? <><p className="tnt-report-note">Orders placed within the selected dates (Sri Lanka time). Payment status is shown separately from fulfillment status.</p><div className="tnt-report-table"><table className="data-table"><thead><tr>{['Order','Placed on','Status','Payment method','Payment status','Total'].map(h => <th key={h}>{h}</th>)}</tr></thead><tbody>{!loading && snapshot && orders.map(o => <tr key={o.id}><td title={o.id}>{String(o.id).slice(0,8)}…</td><td>{date(o.createdAt)}</td><td>{o.status}</td><td>{paymentName(o.paymentMethod)}</td><td>{o.paymentStatus === 'NotRequired' ? 'Cash on delivery' : o.paymentStatus || 'Unknown'}</td><td>{formatMoney(o.total,o.currency)}</td></tr>)}{(loading || !orders.length) && <tr><td colSpan="6">{loading ? 'Loading sales…' : snapshot ? 'No orders match these filters.' : 'Report unavailable. Please refresh.'}</td></tr>}</tbody></table></div></> : <><p className="tnt-report-note">Current active inventory; date and payment filters do not apply to stock. Values use retail prices, not purchase costs. {products.filter(p => p.stockQuantity <= filters.threshold).length} low-stock products · {products.filter(p => p.stockQuantity <= 0).length} out of stock.</p><div className="tnt-report-table"><table className="data-table"><thead><tr>{['SKU','Product','Category','Stock','Retail price','Retail value','Stock status'].map(h => <th key={h}>{h}</th>)}</tr></thead><tbody>{!loading && snapshot && products.map(p => <tr key={p.sku}><td>{p.sku}</td><td>{p.name}</td><td>{p.categoryName}</td><td><strong>{p.stockQuantity}</strong></td><td>{formatMoney(p.price)}</td><td>{formatMoney(p.price * p.stockQuantity)}</td><td><span className={`tnt-stock-badge ${p.stockQuantity <= filters.threshold ? 'is-low' : ''}`}>{p.stockQuantity <= 0 ? 'Out of stock' : p.stockQuantity <= filters.threshold ? 'Low stock' : 'In stock'}</span></td></tr>)}{(loading || !products.length) && <tr><td colSpan="7">{loading ? 'Loading stock…' : snapshot ? 'No products match these filters.' : 'Report unavailable. Please refresh.'}</td></tr>}</tbody></table></div></>}
    </section>
    {snapshot && <p className="tnt-report-note">Updated {date(snapshot.generatedAt)} · Full Report downloads one CSV containing the sales summary, order details and current stock details for the selected filters.</p>}
  </div>;
};
export default AdminReports;
