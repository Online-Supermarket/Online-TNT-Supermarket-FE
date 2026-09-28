import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { DollarSign, ShoppingCart, Users, AlertTriangle, RefreshCw } from 'lucide-react';
import { CSSBarChart } from '../../components/CSSBarChart';
import { CSSDonutChart } from '../../components/CSSDonutChart';
import axiosInstance from '../../services/axiosInstance';

const money = (value) => `Rs. ${Number(value || 0).toFixed(2)}`;
const shortId = (id) => id ? `#${String(id).slice(0, 8)}…` : '—';

export const AdminDashboard = () => {
  const [data, setData] = useState({ orders: [], sales: null, customers: null, inventory: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const load = useCallback(async () => {
    setError('');
    try {
      const [orders, sales, customers, inventory] = await Promise.all([
        axiosInstance.get('/order/staff/orders'), axiosInstance.get('/reporting/reports/sales'),
        axiosInstance.get('/identity/admin/users?role=Customer'), axiosInstance.get('/reporting/reports/inventory'),
      ]);
      setData({ orders: Array.isArray(orders) ? orders : [], sales: sales || null, customers: Array.isArray(customers) ? customers.length : 0, inventory: inventory || null });
    } catch (err) { setError(err.message || 'Unable to load executive dashboard data.'); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const weeklyRevenue = useMemo(() => {
    const days = Array.from({ length: 7 }, (_, index) => { const date = new Date(); date.setHours(0, 0, 0, 0); date.setDate(date.getDate() - (6 - index)); return { key: date.toISOString().slice(0, 10), label: date.toLocaleDateString(undefined, { weekday: 'short' }), value: 0 }; });
    for (const order of data.sales?.orders || []) { if (order.status !== 'Confirmed') continue; const bucket = days.find(day => day.key === String(order.createdAt || '').slice(0, 10)); if (bucket) bucket.value += Number(order.total || 0); }
    return days;
  }, [data.sales]);
  const statusBreakdown = useMemo(() => Object.entries(data.orders.reduce((result, order) => ({ ...result, [order.status]: (result[order.status] || 0) + 1 }), {})).map(([label, value]) => ({ label, value })), [data.orders]);
  const cards = [
    { label: 'TOTAL REVENUE', value: money(data.sales?.recognizedSales), sub: 'Confirmed-order revenue', icon: <DollarSign size={24} /> },
    { label: 'TOTAL ORDERS', value: data.orders.length, sub: 'Orders in the fulfillment pipeline', icon: <ShoppingCart size={24} />, tone: { background: '#dbeafe', color: '#1e40af' } },
    { label: 'ACTIVE CUSTOMERS', value: data.customers ?? '—', sub: 'Active customer accounts', icon: <Users size={24} />, tone: { background: '#fef3c7', color: '#b45309' } },
    { label: 'LOW STOCK ALERTS', value: data.inventory?.lowStockCount ?? '—', sub: 'Products below reorder level', icon: <AlertTriangle size={24} />, tone: { background: '#fee2e2', color: '#dc2626' } },
  ];
  return <div>
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'start', marginBottom: 28 }}><div><h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '2.2rem', color: 'var(--color-primary-dark)', marginBottom: 6 }}>Executive Dashboard Overview</h1><p style={{ color: 'var(--color-muted)', margin: 0 }}>Real-time sales performance, store fulfillment, and inventory health.</p></div><button className="btn btn-outline" onClick={load} disabled={loading}><RefreshCw size={16} className={loading ? 'spin' : ''} /> Refresh</button></div>
    {error && <div role="alert" style={{ marginBottom: 18, color: '#b91c1c' }}>{error}</div>}
    <div className="kpi-grid">{cards.map(card => <div className="kpi-card" key={card.label}><div className="kpi-icon" style={card.tone}>{card.icon}</div><div><div style={{ fontSize: '0.8rem', color: 'var(--color-muted)', fontWeight: 600 }}>{card.label}</div><div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--color-primary-dark)' }}>{loading ? <RefreshCw size={18} className="spin" /> : card.value}</div><div style={{ fontSize: '0.75rem', color: 'var(--color-muted)', fontWeight: 600 }}>{card.sub}</div></div></div>)}</div>
    <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 24, marginBottom: 32 }}><CSSBarChart data={weeklyRevenue} /><CSSDonutChart data={statusBreakdown} /></div>
    <div style={{ background: '#ffffff', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: 24, boxShadow: 'var(--shadow-sm)' }}><h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.3rem', marginBottom: 16 }}>Recent Customer Orders</h3><table className="data-table"><thead><tr><th>Order ID</th><th>Customer</th><th>Total</th><th>Status</th><th>Time</th></tr></thead><tbody>{data.orders.slice(0, 8).map(order => <tr key={order.id}><td>{shortId(order.id)}</td><td>{shortId(order.customerId)}</td><td>{money(order.total)}</td><td><span className={`status-pill status-${String(order.status || '').toLowerCase()}`}>{order.status}</span></td><td>{order.createdAt ? new Date(order.createdAt).toLocaleString() : '—'}</td></tr>)}{!loading && data.orders.length === 0 && <tr><td colSpan={5} style={{ textAlign: 'center', padding: 32, color: 'var(--color-muted)' }}>No recent orders to display.</td></tr>}</tbody></table></div>
  </div>;
};
