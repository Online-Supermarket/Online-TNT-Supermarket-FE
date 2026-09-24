import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Warehouse, RefreshCw, AlertTriangle, CheckCircle, Search,
  Filter, Plus, Minus, Edit3, TrendingDown, TrendingUp,
  Box, History, X, AlertOctagon, Layers, Download, BarChart2
} from 'lucide-react';
import axiosInstance from '../../services/axiosInstance';
import ReplenishmentManager from '../../components/inventory/ReplenishmentManager';

const fmt    = (n) => (typeof n === 'number' ? n.toLocaleString() : '—');
const fmtDate = (d) => d ? new Date(d).toLocaleString() : '—';

const Modal = ({ title, onClose, children, accent = '#2563eb' }) => (
  <div style={{
    position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.65)',
    backdropFilter: 'blur(4px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
  }}>
    <div style={{
      background: '#fff', borderRadius: 16, padding: '28px 32px', minWidth: 420,
      maxWidth: 520, width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
      maxHeight: '90vh', overflowY: 'auto', animation: 'fadeIn 0.2s ease-out'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: accent }}>{title}</h3>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280' }}>
          <X size={20} />
        </button>
      </div>
      {children}
    </div>
  </div>
);

const Feedback = ({ msg, onClose }) => msg ? (
  <div style={{
    padding: '14px 20px', borderRadius: 10, marginBottom: 20, fontSize: '0.88rem', fontWeight: 600,
    background: msg.type === 'success' ? '#f0fdf4' : '#fef2f2',
    border: `1px solid ${msg.type === 'success' ? '#bbf7d0' : '#fecaca'}`,
    color: msg.type === 'success' ? '#166534' : '#991b1b',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      {msg.type === 'success' ? <CheckCircle size={18} /> : <AlertOctagon size={18} />}
      {msg.text}
    </div>
    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', padding: 4 }}>
      <X size={15} />
    </button>
  </div>
) : null;

const NumInput = ({ label, value, onChange, min = 0, required }) => (
  <div style={{ marginBottom: 14 }}>
    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#374151', marginBottom: 4 }}>
      {label}{required && <span style={{ color: '#dc2626' }}> *</span>}
    </label>
    <input type="number" value={value} min={min} onChange={e => onChange(Number(e.target.value))}
      style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #d1d5db', borderRadius: 8, fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box' }} />
  </div>
);
const TextInput = ({ label, value, onChange, placeholder, required }) => (
  <div style={{ marginBottom: 14 }}>
    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#374151', marginBottom: 4 }}>
      {label}{required && <span style={{ color: '#dc2626' }}> *</span>}
    </label>
    <input type="text" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
      style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #d1d5db', borderRadius: 8, fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box' }} />
  </div>
);
const TextArea = ({ label, value, onChange, placeholder }) => (
  <div style={{ marginBottom: 14 }}>
    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#374151', marginBottom: 4 }}>{label}</label>
    <textarea rows={2} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
      style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #d1d5db', borderRadius: 8, fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box', resize: 'vertical' }} />
  </div>
);

export const StaffInventoryManagement = () => {
  const [activeTab, setActiveTab]     = useState('stock');
  const [products, setProducts]       = useState([]);
  const [history, setHistory]         = useState([]);
  const [loading, setLoading]         = useState(true);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [refreshing, setRefreshing]   = useState(false);
  const [feedback, setFeedback]       = useState(null);

  const [search, setSearch]                             = useState('');
  const [statusFilter, setStatusFilter]                 = useState('All');
  const [historyProductFilter, setHistoryProductFilter] = useState('');
  const [historyTypeFilter, setHistoryTypeFilter]       = useState('');

  const [sortKey, setSortKey] = useState('name');
  const [sortDir, setSortDir] = useState('asc');

  const [addModal, setAddModal]       = useState(null);
  const [removeModal, setRemoveModal] = useState(null);
  const [adjustModal, setAdjustModal] = useState(null);
  const [submitting, setSubmitting]   = useState(false);

  const [addQty, setAddQty]           = useState(1);
  const [addNotes, setAddNotes]       = useState('');
  const [removeQty, setRemoveQty]     = useState(1);
  const [removeReason, setRemoveReason] = useState('');
  const [removeNotes, setRemoveNotes] = useState('');
  const [adjustQty, setAdjustQty]     = useState(0);
  const [adjustReason, setAdjustReason] = useState('');
  const [adjustNotes, setAdjustNotes] = useState('');

  const showFeedback = (type, text) => {
    setFeedback({ type, text });
    setTimeout(() => setFeedback(null), 5000);
  };

  const fetchAll = useCallback(async (silent = false) => {
    if (!silent) setLoading(true); else setRefreshing(true);
    try {
      const inv = await axiosInstance.get('/inventory');
      setProducts(Array.isArray(inv) ? inv : []);
    } catch {
      showFeedback('error', 'Failed to load inventory data.');
    } finally { setLoading(false); setRefreshing(false); }
  }, []);

  const fetchHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const params = new URLSearchParams();
      if (historyProductFilter) params.set('productId', historyProductFilter);
      if (historyTypeFilter)    params.set('adjustmentType', historyTypeFilter);
      params.set('limit', '200');
      const data = await axiosInstance.get(`/inventory/history?${params.toString()}`);
      setHistory(Array.isArray(data) ? data : []);
    } catch { showFeedback('error', 'Failed to load stock history.'); }
    finally { setHistoryLoading(false); }
  }, [historyProductFilter, historyTypeFilter]);

  useEffect(() => { fetchAll(); }, [fetchAll]);
  useEffect(() => { if (activeTab === 'history') fetchHistory(); }, [activeTab, fetchHistory]);

  const [reportData, setReportData] = useState(null);
  const [loadingReport, setLoadingReport] = useState(false);

  const fetchInventoryReport = useCallback(async () => {
    setLoadingReport(true);
    try {
      const data = await axiosInstance.get('/catalog/reports/inventory?threshold=10');
      setReportData(data);
    } catch {
      // non-fatal
    } finally {
      setLoadingReport(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'report') {
      fetchInventoryReport();
    }
  }, [activeTab, fetchInventoryReport]);

  const handleExportCsv = async () => {
    try {
      const token = localStorage.getItem('marketflowToken');
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api'}/catalog/reports/inventory/export`, {
        headers: {
          Authorization: token ? `Bearer ${token}` : '',
        }
      });
      if (!res.ok) throw new Error('Export failed');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'inventory-report.csv';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      showFeedback('success', 'Inventory report CSV exported successfully.');
    } catch {
      showFeedback('error', 'Failed to export inventory CSV.');
    }
  };

  // Derive stock status client-side (same logic as Admin Replenishment page)
  const enrichedProducts = useMemo(() => products.map(prod => {
    const stock   = prod.stockQuantity  ?? 0;
    const reorder = prod.reorderLevel   ?? 10;
    const target  = prod.targetStockLevel ?? Math.max(reorder * 5, 50);
    const status  = prod.status || (stock === 0 ? 'Out of Stock' : stock <= reorder ? 'Low Stock' : 'In Stock');
    return { ...prod, stockQuantity: stock, reorderLevel: reorder, targetStockLevel: target, status };
  }), [products]);

  const inStockCount    = useMemo(() => enrichedProducts.filter(p => p.status === 'In Stock').length,    [enrichedProducts]);
  const lowStockCount   = useMemo(() => enrichedProducts.filter(p => p.status === 'Low Stock').length,   [enrichedProducts]);
  const outOfStockCount = useMemo(() => enrichedProducts.filter(p => p.status === 'Out of Stock').length,[enrichedProducts]);
  const totalUnits      = useMemo(() => enrichedProducts.reduce((a, p) => a + (p.stockQuantity || 0), 0),[enrichedProducts]);

  const filtered = useMemo(() => {
    let rows = enrichedProducts;
    if (statusFilter !== 'All') rows = rows.filter(p => p.status === statusFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      rows = rows.filter(p => p.name?.toLowerCase().includes(q) || p.sku?.toLowerCase().includes(q) || p.categoryName?.toLowerCase().includes(q));
    }
    return [...rows].sort((a, b) => {
      let av = a[sortKey], bv = b[sortKey];
      if (typeof av === 'string') { av = av.toLowerCase(); bv = bv.toLowerCase(); }
      return av < bv ? (sortDir === 'asc' ? -1 : 1) : av > bv ? (sortDir === 'asc' ? 1 : -1) : 0;
    });
  }, [enrichedProducts, search, statusFilter, sortKey, sortDir]);

  const toggleSort = (key) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  };

  const openAdd    = (p) => { setAddModal(p);    setAddQty(1);             setAddNotes(''); };
  const openRemove = (p) => { setRemoveModal(p); setRemoveQty(1);          setRemoveReason(''); setRemoveNotes(''); };
  const openAdjust = (p) => { setAdjustModal(p); setAdjustQty(p.stockQuantity); setAdjustReason(''); setAdjustNotes(''); };

  const doAdd = async () => {
    if (addQty <= 0) { showFeedback('error', 'Quantity must be > 0.'); return; }
    setSubmitting(true);
    try {
      const updated = await axiosInstance.post(`/inventory/${addModal.id}/add`, { quantity: addQty, notes: addNotes });
      setProducts(ps => ps.map(p => p.id === addModal.id ? updated : p));
      setAddModal(null);
      showFeedback('success', `Added ${addQty} units to "${addModal.name}".`);
    } catch (e) { showFeedback('error', e?.response?.data?.message || 'Failed to add stock.'); }
    finally { setSubmitting(false); }
  };

  const doRemove = async () => {
    if (removeQty <= 0) { showFeedback('error', 'Quantity must be > 0.'); return; }
    setSubmitting(true);
    try {
      const updated = await axiosInstance.post(`/inventory/${removeModal.id}/remove`, { quantity: removeQty, reason: removeReason, notes: removeNotes });
      setProducts(ps => ps.map(p => p.id === removeModal.id ? updated : p));
      setRemoveModal(null);
      showFeedback('success', `Removed ${removeQty} units from "${removeModal.name}".`);
    } catch (e) { showFeedback('error', e?.response?.data?.message || 'Failed to remove stock.'); }
    finally { setSubmitting(false); }
  };

  const doAdjust = async () => {
    if (!adjustReason.trim()) { showFeedback('error', 'Reason is required.'); return; }
    if (adjustQty < 0)        { showFeedback('error', 'Quantity cannot be negative.'); return; }
    setSubmitting(true);
    try {
      const updated = await axiosInstance.put(`/inventory/${adjustModal.id}/adjust`, { newQuantity: adjustQty, reason: adjustReason, notes: adjustNotes });
      setProducts(ps => ps.map(p => p.id === adjustModal.id ? updated : p));
      setAdjustModal(null);
      showFeedback('success', `Stock for "${adjustModal.name}" adjusted to ${adjustQty}.`);
    } catch (e) { showFeedback('error', e?.response?.data?.message || 'Failed to adjust stock.'); }
    finally { setSubmitting(false); }
  };

  const thStyle = {
    padding: '10px 14px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700,
    color: '#6b7280', background: '#f9fafb', borderBottom: '1px solid #e5e7eb',
    cursor: 'pointer', whiteSpace: 'nowrap', userSelect: 'none'
  };
  const tdStyle = { padding: '12px 14px', borderBottom: '1px solid #f3f4f6', fontSize: '0.875rem', verticalAlign: 'middle' };
  const btnStyle = { padding: '7px 14px', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '0.82rem' };

  const pillStyle = (s) => {
    const sel = statusFilter === s;
    const map = {
      'All':          { border: sel ? '#2563eb' : '#d1d5db', bg: sel ? '#2563eb' : '#fff', color: sel ? '#fff' : '#374151', cb: sel ? 'rgba(255,255,255,0.25)' : '#f1f5f9', cc: sel ? '#fff' : '#475569' },
      'In Stock':     { border: sel ? '#16a34a' : '#d1d5db', bg: sel ? '#dcfce7' : '#fff', color: sel ? '#15803d' : '#374151', cb: sel ? '#bbf7d0' : '#f1f5f9', cc: sel ? '#15803d' : '#475569' },
      'Low Stock':    { border: sel ? '#d97706' : '#d1d5db', bg: sel ? '#fef3c7' : '#fff', color: sel ? '#b45309' : '#374151', cb: sel ? '#fde68a' : '#f1f5f9', cc: sel ? '#b45309' : '#475569' },
      'Out of Stock': { border: sel ? '#dc2626' : '#d1d5db', bg: sel ? '#fee2e2' : '#fff', color: sel ? '#b91c1c' : '#374151', cb: sel ? '#fecaca' : '#f1f5f9', cc: sel ? '#b91c1c' : '#475569' },
    };
    return map[s] || map['All'];
  };
  const pillCount = (s) => s === 'All' ? enrichedProducts.length : s === 'In Stock' ? inStockCount : s === 'Low Stock' ? lowStockCount : outOfStockCount;

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300, color: '#6b7280' }}>
      <RefreshCw size={28} style={{ animation: 'spin 1s linear infinite', marginRight: 12 }} />
      Loading inventory…
    </div>
  );

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
            <div style={{ background: 'var(--color-soft-mint, #e6f4f1)', color: 'var(--color-primary, #2563eb)', padding: 8, borderRadius: 10, display: 'grid', placeItems: 'center' }}>
              <Warehouse size={26} />
            </div>
            <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '2rem', color: 'var(--color-primary-dark)', margin: 0 }}>
              Inventory Management
            </h1>
          </div>
          <p style={{ color: 'var(--color-muted)', marginTop: 0, marginBottom: 0, fontSize: '0.975rem' }}>
            View stock levels, add, remove, or adjust product inventory in real time.
          </p>
        </div>
        <button id="inventory-refresh-btn" onClick={() => fetchAll(true)} disabled={refreshing}
          className="btn btn-outline"
          style={{ display: 'flex', alignItems: 'center', gap: 8, height: 42 }}>
          <RefreshCw size={16} style={refreshing ? { animation: 'spin 1s linear infinite' } : {}} />
          {refreshing ? 'Refreshing…' : 'Refresh Inventory'}
        </button>
      </div>

      <Feedback msg={feedback} onClose={() => setFeedback(null)} />

      {/* Interactive KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 14, marginBottom: 28 }}>
        <div className="kpi-card"
          style={{ borderLeft: lowStockCount > 0 ? '4px solid #f59e0b' : '4px solid var(--color-border)', cursor: 'pointer' }}
          onClick={() => { setActiveTab('stock'); setStatusFilter('Low Stock'); }} title="Filter by Low Stock">
          <div className="kpi-icon" style={{ background: lowStockCount > 0 ? '#fef3c7' : 'var(--color-soft-mint)', color: lowStockCount > 0 ? '#d97706' : 'var(--color-primary)' }}>
            <TrendingDown size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--color-muted)', fontWeight: 700 }}>Low Stock Alert</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: lowStockCount > 0 ? '#d97706' : 'var(--color-ink-dark)' }}>
              {lowStockCount} <span style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--color-muted)' }}>items</span>
            </div>
          </div>
        </div>

        <div className="kpi-card"
          style={{ borderLeft: outOfStockCount > 0 ? '4px solid #b91c1c' : '4px solid var(--color-border)', cursor: 'pointer' }}
          onClick={() => { setActiveTab('stock'); setStatusFilter('Out of Stock'); }} title="Filter by Out of Stock">
          <div className="kpi-icon" style={{ background: outOfStockCount > 0 ? '#fee2e2' : 'var(--color-soft-mint)', color: outOfStockCount > 0 ? '#b91c1c' : 'var(--color-primary)' }}>
            <AlertTriangle size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--color-muted)', fontWeight: 700 }}>Out of Stock</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: outOfStockCount > 0 ? '#b91c1c' : 'var(--color-ink-dark)' }}>
              {outOfStockCount} <span style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--color-muted)' }}>items</span>
            </div>
          </div>
        </div>

        <div className="kpi-card" style={{ borderLeft: '4px solid #16a34a', cursor: 'pointer' }}
          onClick={() => { setActiveTab('stock'); setStatusFilter('In Stock'); }} title="Filter by In Stock">
          <div className="kpi-icon" style={{ background: '#dcfce7', color: '#16a34a' }}><CheckCircle size={24} /></div>
          <div>
            <div style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--color-muted)', fontWeight: 700 }}>In Stock</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#16a34a' }}>
              {inStockCount} <span style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--color-muted)' }}>items</span>
            </div>
          </div>
        </div>

        <div className="kpi-card" style={{ borderLeft: '4px solid #2563eb', cursor: 'pointer' }}
          onClick={() => { setActiveTab('stock'); setStatusFilter('All'); }} title="Show all products">
          <div className="kpi-icon" style={{ background: '#dbeafe', color: '#1d4ed8' }}><Box size={24} /></div>
          <div>
            <div style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--color-muted)', fontWeight: 700 }}>Total Products</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#1d4ed8' }}>
              {enrichedProducts.length} <span style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--color-muted)' }}>SKUs</span>
            </div>
          </div>
        </div>

        <div className="kpi-card" style={{ borderLeft: '4px solid var(--color-primary)' }}>
          <div className="kpi-icon" style={{ background: 'var(--color-soft-mint)', color: 'var(--color-primary)' }}><Layers size={24} /></div>
          <div>
            <div style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--color-muted)', fontWeight: 700 }}>Total Units</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-primary)' }}>
              {fmt(totalUnits)} <span style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--color-muted)' }}>on hand</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Card */}
      <div style={{ background: '#fff', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden' }}>

        {/* Tabs + Controls */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--color-border)', padding: '14px 20px', background: '#fafbfa', flexWrap: 'wrap', gap: 14 }}>
          <div style={{ display: 'flex', gap: 8 }}>
            {[
              { id: 'stock',         icon: <Warehouse size={15} />, label: 'Stock Levels',      count: enrichedProducts.length },
              { id: 'history',       icon: <History   size={15} />, label: 'Stock History',     count: null },
              { id: 'replenishment', icon: <TrendingUp size={15} />, label: 'Replenishment',    count: null },
              { id: 'report',        icon: <Download size={15} />, label: 'Inventory Reports', count: null },
            ].map(({ id, icon, label, count }) => (
              <button key={id} id={`tab-inventory-${id}`} onClick={() => setActiveTab(id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '10px 18px', borderRadius: 'var(--radius-full)',
                  fontWeight: 700, fontSize: '0.925rem', border: 'none', cursor: 'pointer', transition: 'all 0.2s',
                  background: activeTab === id ? 'var(--color-primary, #2563eb)' : 'transparent',
                  color: activeTab === id ? '#fff' : 'var(--color-muted)',
                }}>
                {icon} {label}
                {count !== null && (
                  <span style={{ background: activeTab === id ? 'rgba(255,255,255,0.25)' : '#e2e8f0', color: activeTab === id ? '#fff' : '#475569', borderRadius: 12, padding: '2px 8px', fontSize: '0.75rem', fontWeight: 800 }}>{count}</span>
                )}
              </button>
            ))}
          </div>

          {activeTab === 'stock' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <div style={{ position: 'relative', minWidth: 220 }}>
                <Search size={16} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                <input id="inventory-search" value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Search name, SKU or category…"
                  style={{ width: '100%', padding: '8px 12px 8px 34px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', fontSize: '0.875rem', outline: 'none', background: '#fff', boxSizing: 'border-box' }} />
                {search && <button onClick={() => setSearch('')} style={{ position: 'absolute', right: 9, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af' }}><X size={14} /></button>}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                <Filter size={14} style={{ color: '#9ca3af', marginRight: 2 }} />
                {['All', 'In Stock', 'Low Stock', 'Out of Stock'].map(s => {
                  const p = pillStyle(s);
                  return (
                    <button key={s} id={`filter-stock-${s.toLowerCase().replace(/ /g, '-')}`}
                      onClick={() => setStatusFilter(s)}
                      style={{ padding: '6px 12px', borderRadius: 'var(--radius-full)', border: `1.5px solid ${p.border}`, background: p.bg, color: p.color, fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer', transition: 'all 0.15s', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      {s}
                      <span style={{ fontSize: '0.72rem', padding: '1px 6px', borderRadius: 10, background: p.cb, color: p.cc, fontWeight: 800 }}>{pillCount(s)}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* ALL PRODUCTS TAB */}
        {activeTab === 'stock' && (
          <>
            {filtered.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                <CheckCircle size={48} style={{ color: 'var(--color-primary)', margin: '0 auto 16px' }} />
                <h3 style={{ fontSize: '1.25rem', color: 'var(--color-primary-dark)', marginBottom: 6 }}>
                  {search ? 'No matching products found.'
                    : statusFilter === 'Low Stock' ? 'No low stock products! All levels are healthy.'
                    : statusFilter === 'Out of Stock' ? 'No out-of-stock products!'
                    : statusFilter === 'In Stock' ? 'No in-stock products found.'
                    : 'No products in catalogue.'}
                </h3>
                <p style={{ color: 'var(--color-muted)', maxWidth: 420, margin: '0 auto' }}>
                  {(search || statusFilter !== 'All') ? 'Try adjusting your search or status filter.' : 'Products will appear here once added to the catalogue.'}
                </p>
                {(search || statusFilter !== 'All') && (
                  <button className="btn btn-secondary" onClick={() => { setSearch(''); setStatusFilter('All'); }} style={{ marginTop: 16 }}>Clear Filters</button>
                )}
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th style={thStyle} onClick={() => toggleSort('sku')}>SKU</th>
                      <th style={thStyle} onClick={() => toggleSort('name')}>Product</th>
                      <th style={thStyle} onClick={() => toggleSort('categoryName')}>Category</th>
                      <th style={{ ...thStyle, textAlign: 'center' }} onClick={() => toggleSort('status')}>Status</th>
                      <th style={{ ...thStyle, minWidth: 200 }} onClick={() => toggleSort('stockQuantity')}>Stock Level</th>
                      <th style={{ ...thStyle, textAlign: 'center' }} onClick={() => toggleSort('price')}>Price</th>
                      <th style={{ ...thStyle, textAlign: 'center' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(p => {
                      const isZero = p.stockQuantity === 0;
                      const isLow  = p.stockQuantity <= p.reorderLevel;
                      const pct    = Math.min(100, Math.round((p.stockQuantity / Math.max(1, p.targetStockLevel)) * 100));
                      const barColor = isZero ? '#dc2626' : isLow ? '#ea580c' : '#16a34a';
                      const badgeMap = {
                        'Out of Stock': { bg: '#fee2e2', color: '#b91c1c', border: '#fecaca' },
                        'Low Stock':    { bg: '#fef3c7', color: '#b45309', border: '#fde68a' },
                        'In Stock':     { bg: '#dcfce7', color: '#15803d', border: '#bbf7d0' },
                      };
                      const badge = badgeMap[p.status] || badgeMap['In Stock'];
                      return (
                        <tr key={p.id}
                          onMouseEnter={e => e.currentTarget.style.background = '#f9fafb'}
                          onMouseLeave={e => e.currentTarget.style.background = ''}
                          style={{ transition: 'background 0.1s' }}>
                          <td style={tdStyle}>
                            <code style={{ fontSize: '0.8rem', background: '#f3f4f6', padding: '2px 6px', borderRadius: 4 }}>{p.sku}</code>
                          </td>
                          <td style={tdStyle}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                              {p.imageUrl
                                ? <img src={p.imageUrl} alt={p.name} style={{ width: 40, height: 40, borderRadius: 8, objectFit: 'cover', border: '1px solid #e5e7eb', flexShrink: 0 }} />
                                : <div style={{ width: 40, height: 40, borderRadius: 8, background: 'var(--color-soft-mint)', display: 'grid', placeItems: 'center', color: 'var(--color-primary)', flexShrink: 0 }}><Warehouse size={18} /></div>}
                              <div>
                                <div style={{ fontWeight: 700, color: '#111827' }}>{p.name}</div>
                                {p.lastRestockedAt && <div style={{ fontSize: '0.72rem', color: '#9ca3af', marginTop: 2 }}>Last restocked: {fmtDate(p.lastRestockedAt)}</div>}
                              </div>
                            </div>
                          </td>
                          <td style={tdStyle}>
                            <span style={{ fontSize: '0.8rem', background: '#f1f5f9', padding: '3px 10px', borderRadius: 6, color: '#475569', fontWeight: 600 }}>{p.categoryName || 'General'}</span>
                          </td>
                          <td style={{ ...tdStyle, textAlign: 'center' }}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px', borderRadius: 12, fontSize: '0.78rem', fontWeight: 700, background: badge.bg, color: badge.color, border: `1px solid ${badge.border}` }}>
                              {p.status === 'Out of Stock' && <X size={12} />}
                              {p.status === 'Low Stock'    && <AlertTriangle size={12} />}
                              {p.status === 'In Stock'     && <CheckCircle size={12} />}
                              {p.status}
                            </span>
                          </td>
                          <td style={tdStyle}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                              <strong style={{ fontSize: '1.05rem', color: isZero ? '#dc2626' : isLow ? '#d97706' : '#15803d' }}>{p.stockQuantity}</strong>
                              <span style={{ fontSize: '0.78rem', color: '#9ca3af' }}>/ Reorder: {p.reorderLevel} (Target: {p.targetStockLevel})</span>
                            </div>
                            <div style={{ width: '100%', maxWidth: 160, height: 6, background: '#e2e8f0', borderRadius: 4, overflow: 'hidden' }}>
                              <div style={{ width: `${pct}%`, height: '100%', background: barColor, transition: 'width 0.4s ease' }} />
                            </div>
                          </td>
                          <td style={{ ...tdStyle, textAlign: 'center', fontWeight: 600, color: '#111827' }}>
                            Rs. {p.price?.toFixed(2) ?? '—'}
                          </td>
                          <td style={{ ...tdStyle, textAlign: 'center' }}>
                            <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                              <button id={`add-stock-${p.id}`} title="Add Stock" onClick={() => openAdd(p)} style={{ ...btnStyle, background: '#dcfce7', color: '#16a34a', padding: '6px 10px' }}><Plus size={14} /></button>
                              <button id={`remove-stock-${p.id}`} title="Remove Stock" onClick={() => openRemove(p)} style={{ ...btnStyle, background: '#fee2e2', color: '#dc2626', padding: '6px 10px' }}><Minus size={14} /></button>
                              <button id={`adjust-stock-${p.id}`} title="Adjust Stock" onClick={() => openAdjust(p)} style={{ ...btnStyle, background: '#eff6ff', color: '#2563eb', padding: '6px 10px' }}><Edit3 size={14} /></button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {/* HISTORY TAB */}
        {activeTab === 'history' && (
          <>
            <div style={{ display: 'flex', gap: 12, padding: '16px 20px', flexWrap: 'wrap', alignItems: 'flex-end', borderBottom: '1px solid #f3f4f6' }}>
              <div style={{ flex: '1 1 200px' }}>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#6b7280', display: 'block', marginBottom: 4 }}>Filter by Product</label>
                <select value={historyProductFilter} onChange={e => setHistoryProductFilter(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--color-border)', borderRadius: 10, fontSize: '0.88rem', outline: 'none', background: '#fff' }}>
                  <option value="">All Products</option>
                  {enrichedProducts.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div style={{ flex: '1 1 180px' }}>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#6b7280', display: 'block', marginBottom: 4 }}>Filter by Type</label>
                <select value={historyTypeFilter} onChange={e => setHistoryTypeFilter(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--color-border)', borderRadius: 10, fontSize: '0.88rem', outline: 'none', background: '#fff' }}>
                  <option value="">All Types</option>
                  <option value="Add">Add</option>
                  <option value="Remove">Remove</option>
                  <option value="Adjust">Adjust</option>
                </select>
              </div>
              <button onClick={fetchHistory} disabled={historyLoading} className="btn btn-primary"
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 18px' }}>
                <RefreshCw size={14} style={historyLoading ? { animation: 'spin 1s linear infinite' } : {}} /> Apply Filters
              </button>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={thStyle}>Date / Time</th>
                    <th style={thStyle}>Product</th>
                    <th style={thStyle}>SKU</th>
                    <th style={{ ...thStyle, textAlign: 'center' }}>Type</th>
                    <th style={{ ...thStyle, textAlign: 'center' }}>Delta</th>
                    <th style={{ ...thStyle, textAlign: 'center' }}>Prev &rarr; New</th>
                    <th style={thStyle}>Reason</th>
                    <th style={thStyle}>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {historyLoading ? (
                    <tr><td colSpan={8} style={{ ...tdStyle, textAlign: 'center', padding: 40 }}><RefreshCw size={24} style={{ animation: 'spin 1s linear infinite' }} /></td></tr>
                  ) : history.length === 0 ? (
                    <tr><td colSpan={8} style={{ ...tdStyle, textAlign: 'center', padding: 40, color: '#9ca3af' }}>
                      <History size={36} style={{ display: 'block', margin: '0 auto 10px' }} />
                      No stock movement records found.
                    </td></tr>
                  ) : history.map(h => {
                    const isPos = h.quantityDelta > 0;
                    const adjType = h.adjustmentType;
                    let typeColor = '#6b7280', typeBg = '#f3f4f6';
                    if (adjType === 'Add')    { typeColor = '#15803d'; typeBg = '#dcfce7'; }
                    else if (adjType === 'Remove') { typeColor = '#dc2626'; typeBg = '#fee2e2'; }
                    else if (adjType === 'Adjust') { typeColor = '#2563eb'; typeBg = '#eff6ff'; }
                    return (
                      <tr key={h.id}
                        onMouseEnter={e => e.currentTarget.style.background = '#f9fafb'}
                        onMouseLeave={e => e.currentTarget.style.background = ''}>
                        <td style={{ ...tdStyle, fontSize: '0.8rem', color: '#6b7280', whiteSpace: 'nowrap' }}>{fmtDate(h.occurredAt)}</td>
                        <td style={tdStyle}><div style={{ fontWeight: 600 }}>{h.productName}</div></td>
                        <td style={tdStyle}><code style={{ fontSize: '0.78rem', background: '#f3f4f6', padding: '2px 5px', borderRadius: 4 }}>{h.productSku}</code></td>
                        <td style={{ ...tdStyle, textAlign: 'center' }}>
                          {adjType && <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 700, background: typeBg, color: typeColor }}>{adjType}</span>}
                        </td>
                        <td style={{ ...tdStyle, textAlign: 'center' }}>
                          <span style={{ fontWeight: 800, color: isPos ? '#16a34a' : '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3 }}>
                            {isPos ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                            {isPos ? '+' : ''}{h.quantityDelta}
                          </span>
                        </td>
                        <td style={{ ...tdStyle, textAlign: 'center', fontSize: '0.82rem' }}>{h.previousQuantity != null ? `${h.previousQuantity} \u2192 ${h.newQuantity}` : '—'}</td>
                        <td style={{ ...tdStyle, color: '#374151', fontSize: '0.85rem' }}>{h.reason || '—'}</td>
                        <td style={{ ...tdStyle, color: '#9ca3af', fontSize: '0.8rem' }}>{h.notes || '—'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* REPLENISHMENT TAB */}
        {activeTab === 'replenishment' && (
          <div style={{ padding: '8px 12px 24px' }}>
            <ReplenishmentManager
              portalTitle="Replenishment & Procurement"
              subtitle="Generate replenishment orders, approve pending requests, and receive supplier deliveries."
            />
          </div>
        )}

        {/* INVENTORY REPORT TAB */}
        {activeTab === 'report' && (
          <div style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.3rem', color: 'var(--color-primary-dark)' }}>Live Inventory & Stock Health Report</h3>
                <p style={{ margin: '4px 0 0', color: 'var(--color-muted)', fontSize: '0.88rem' }}>Detailed breakdown of shelf inventory, catalog status, and low-stock items.</p>
              </div>
              <button onClick={handleExportCsv} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Download size={16} /> Export Inventory CSV
              </button>
            </div>

            {loadingReport ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--color-muted)' }}>
                <RefreshCw size={24} style={{ animation: 'spin 1s linear infinite', marginBottom: 12 }} />
                <div>Loading live inventory report...</div>
              </div>
            ) : reportData ? (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 24 }}>
                  <div style={{ background: '#f8fafc', padding: '16px 20px', borderRadius: 10, border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase' }}>Total Active Products</div>
                    <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--color-primary-dark)', marginTop: 4 }}>{reportData.totalProducts ?? 0}</div>
                  </div>
                  <div style={{ background: '#fef2f2', padding: '16px 20px', borderRadius: 10, border: '1px solid #fecaca' }}>
                    <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#dc2626', textTransform: 'uppercase' }}>Low Stock Items</div>
                    <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#dc2626', marginTop: 4 }}>{reportData.lowStockCount ?? 0}</div>
                  </div>
                  <div style={{ background: '#fff7ed', padding: '16px 20px', borderRadius: 10, border: '1px solid #fed7aa' }}>
                    <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#ea580c', textTransform: 'uppercase' }}>Zero Stock Items</div>
                    <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#ea580c', marginTop: 4 }}>{reportData.zeroStockCount ?? 0}</div>
                  </div>
                  <div style={{ background: '#f0fdf4', padding: '16px 20px', borderRadius: 10, border: '1px solid #bbf7d0' }}>
                    <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#166534', textTransform: 'uppercase' }}>Low-Stock Threshold</div>
                    <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#166534', marginTop: 4 }}>{reportData.threshold ?? 10} units</div>
                  </div>
                </div>

                <div style={{ overflowX: 'auto', border: '1px solid var(--color-border)', borderRadius: 10 }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: '#f8fafc', textAlign: 'left', borderBottom: '1px solid var(--color-border)' }}>
                        <th style={{ padding: '12px 16px', fontSize: '0.8rem', fontWeight: 700, color: '#475569' }}>SKU</th>
                        <th style={{ padding: '12px 16px', fontSize: '0.8rem', fontWeight: 700, color: '#475569' }}>Product Name</th>
                        <th style={{ padding: '12px 16px', fontSize: '0.8rem', fontWeight: 700, color: '#475569' }}>Category</th>
                        <th style={{ padding: '12px 16px', fontSize: '0.8rem', fontWeight: 700, color: '#475569' }}>Price</th>
                        <th style={{ padding: '12px 16px', fontSize: '0.8rem', fontWeight: 700, color: '#475569', textAlign: 'center' }}>Stock</th>
                        <th style={{ padding: '12px 16px', fontSize: '0.8rem', fontWeight: 700, color: '#475569', textAlign: 'center' }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(reportData.products || []).map((row) => (
                        <tr key={row.sku} style={{ borderBottom: '1px solid var(--color-border)' }}>
                          <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontWeight: 600 }}>{row.sku}</td>
                          <td style={{ padding: '12px 16px', fontWeight: 600 }}>{row.name}</td>
                          <td style={{ padding: '12px 16px', color: '#6b7280' }}>{row.categoryName}</td>
                          <td style={{ padding: '12px 16px', fontWeight: 700 }}>Rs. {Number(row.price).toFixed(2)}</td>
                          <td style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 800 }}>{row.stockQuantity}</td>
                          <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                            <span style={{
                              padding: '3px 10px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 700,
                              background: row.stockQuantity === 0 ? '#fee2e2' : row.lowStock ? '#fef3c7' : '#dcfce7',
                              color: row.stockQuantity === 0 ? '#991b1b' : row.lowStock ? '#92400e' : '#166534',
                            }}>
                              {row.stockQuantity === 0 ? 'Out of Stock' : row.lowStock ? 'Low Stock' : 'Healthy'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--color-muted)' }}>
                No report data currently available.
              </div>
            )}
          </div>
        )}
      </div>

      {/* ADD MODAL */}
      {addModal && (
        <Modal title={`Add Stock \u2014 ${addModal.name}`} onClose={() => setAddModal(null)} accent="#16a34a">
          <div style={{ background: '#f9fafb', borderRadius: 10, padding: '10px 14px', marginBottom: 18, fontSize: '0.85rem' }}>
            <span style={{ color: '#6b7280' }}>Current Stock: </span>
            <strong style={{ fontSize: '1.1rem', color: '#111827' }}>{addModal.stockQuantity}</strong>
          </div>
          <NumInput label="Quantity to Add" value={addQty} onChange={setAddQty} min={1} required />
          <TextArea label="Notes (optional)" value={addNotes} onChange={setAddNotes} placeholder="e.g. Received from warehouse, invoice #\u2026" />
          <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
            <button onClick={() => setAddModal(null)} style={{ ...btnStyle, flex: 1, background: '#f3f4f6', color: '#374151' }}>Cancel</button>
            <button id="confirm-add-stock" onClick={doAdd} disabled={submitting} style={{ ...btnStyle, flex: 1, background: '#16a34a', color: '#fff' }}>
              {submitting ? <RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} /> : `Add ${addQty > 0 ? addQty : ''} Units`}
            </button>
          </div>
        </Modal>
      )}

      {/* REMOVE MODAL */}
      {removeModal && (
        <Modal title={`Remove Stock \u2014 ${removeModal.name}`} onClose={() => setRemoveModal(null)} accent="#dc2626">
          <div style={{ background: '#f9fafb', borderRadius: 10, padding: '10px 14px', marginBottom: 18, fontSize: '0.85rem' }}>
            <span style={{ color: '#6b7280' }}>Current Stock: </span>
            <strong style={{ fontSize: '1.1rem', color: '#111827' }}>{removeModal.stockQuantity}</strong>
          </div>
          <NumInput label="Quantity to Remove" value={removeQty} onChange={setRemoveQty} min={1} required />
          <TextInput label="Reason" value={removeReason} onChange={setRemoveReason} placeholder="e.g. Damaged goods, shrinkage\u2026" />
          <TextArea label="Notes (optional)" value={removeNotes} onChange={setRemoveNotes} placeholder="Any additional context\u2026" />
          {removeQty > removeModal.stockQuantity && (
            <div style={{ background: '#fee2e2', color: '#dc2626', borderRadius: 8, padding: '8px 12px', fontSize: '0.82rem', marginBottom: 10, fontWeight: 600 }}>
              \u26a0 Quantity exceeds current stock of {removeModal.stockQuantity}.
            </div>
          )}
          <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
            <button onClick={() => setRemoveModal(null)} style={{ ...btnStyle, flex: 1, background: '#f3f4f6', color: '#374151' }}>Cancel</button>
            <button id="confirm-remove-stock" onClick={doRemove} disabled={submitting || removeQty > removeModal.stockQuantity}
              style={{ ...btnStyle, flex: 1, background: '#dc2626', color: '#fff', opacity: (submitting || removeQty > removeModal.stockQuantity) ? 0.5 : 1 }}>
              {submitting ? <RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} /> : `Remove ${removeQty > 0 ? removeQty : ''} Units`}
            </button>
          </div>
        </Modal>
      )}

      {/* ADJUST MODAL */}
      {adjustModal && (
        <Modal title={`Adjust Stock \u2014 ${adjustModal.name}`} onClose={() => setAdjustModal(null)} accent="#2563eb">
          <div style={{ background: '#f9fafb', borderRadius: 10, padding: '10px 14px', marginBottom: 18, fontSize: '0.85rem' }}>
            <span style={{ color: '#6b7280' }}>Current Stock: </span>
            <strong style={{ fontSize: '1.1rem', color: '#111827' }}>{adjustModal.stockQuantity}</strong>
            {adjustQty !== adjustModal.stockQuantity && (
              <span style={{ marginLeft: 12, color: adjustQty > adjustModal.stockQuantity ? '#16a34a' : '#dc2626', fontWeight: 700 }}>
                \u2192 {adjustQty} ({adjustQty > adjustModal.stockQuantity ? '+' : ''}{adjustQty - adjustModal.stockQuantity})
              </span>
            )}
          </div>
          <NumInput label="New Stock Quantity" value={adjustQty} onChange={setAdjustQty} min={0} required />
          <TextInput label="Reason" value={adjustReason} onChange={setAdjustReason} placeholder="e.g. Stocktake correction, system discrepancy\u2026" required />
          <TextArea label="Notes (optional)" value={adjustNotes} onChange={setAdjustNotes} placeholder="Any additional context\u2026" />
          <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
            <button onClick={() => setAdjustModal(null)} style={{ ...btnStyle, flex: 1, background: '#f3f4f6', color: '#374151' }}>Cancel</button>
            <button id="confirm-adjust-stock" onClick={doAdjust} disabled={submitting} style={{ ...btnStyle, flex: 1, background: '#2563eb', color: '#fff' }}>
              {submitting ? <RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} /> : 'Set Stock Level'}
            </button>
          </div>
        </Modal>
      )}

      <style>{"@keyframes spin { from { transform:rotate(0deg); } to { transform:rotate(360deg); } } @keyframes fadeIn { from { opacity:0; transform:translateY(-6px); } to { opacity:1; transform:translateY(0); } }"}</style>
    </div>
  );
};

export default StaffInventoryManagement;
