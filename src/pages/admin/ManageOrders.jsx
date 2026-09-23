import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Package, CheckCircle, Clock, AlertTriangle, XCircle, Search,
  Filter, RefreshCw, X, ChevronDown, ChevronUp, Download,
  DollarSign, BarChart2, Eye, Ban, Copy, Check, FileText,
  ShoppingBag, ShieldAlert, ArrowRight, Truck, Info
} from 'lucide-react';
import axiosInstance from '../../services/axiosInstance';

// ── Helpers & Formatters ────────────────────────────────────────────────────
const statusConfig = {
  Confirmed: {
    bg: '#dcfce7',
    color: '#15803d',
    border: '#bbf7d0',
    label: 'Confirmed',
    desc: 'Inventory reserved & payment confirmed. Ready for fulfillment.'
  },
  PendingReservation: {
    bg: '#fef3c7',
    color: '#b45309',
    border: '#fde68a',
    label: 'Pending Reservation',
    desc: 'Waiting for stock reservation reconciliation with Catalog Service.'
  },
  CancellationPending: {
    bg: '#ede9fe',
    color: '#6d28d9',
    border: '#ddd6fe',
    label: 'Cancellation Pending',
    desc: 'Cancellation initiated; stock release in progress.'
  },
  Cancelled: {
    bg: '#fee2e2',
    color: '#b91c1c',
    border: '#fecaca',
    label: 'Cancelled',
    desc: 'Order cancelled and allocated inventory released back to catalog.'
  },
  Rejected: {
    bg: '#ffe4e6',
    color: '#be123c',
    border: '#fecdd3',
    label: 'Rejected',
    desc: 'Inventory allocation failed; order rejected.'
  },
};

const getStatusBadge = (status) => {
  return statusConfig[status] || {
    bg: '#f3f4f6',
    color: '#4b5563',
    border: '#e5e7eb',
    label: status || 'Unknown',
    desc: 'Order status.'
  };
};

const renderStatusIcon = (status, size = 13) => {
  switch (status) {
    case 'Confirmed':
      return <CheckCircle size={size} />;
    case 'PendingReservation':
      return <Clock size={size} />;
    case 'CancellationPending':
      return <AlertTriangle size={size} />;
    case 'Cancelled':
      return <XCircle size={size} />;
    case 'Rejected':
      return <XCircle size={size} />;
    default:
      return <Package size={size} />;
  }
};

const fmtMoney = (val, currency = '$') => {
  const num = Number(val || 0);
  return `${currency}${num.toFixed(2)}`;
};

const fmtDate = (d) => {
  if (!d) return '—';
  try {
    return new Date(d).toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return String(d);
  }
};

const shortId = (id) => (id ? `#${id.slice(0, 8)}…` : '—');

// ── Reusable Modal ──────────────────────────────────────────────────────────
const Modal = ({ title, onClose, children, accent = '#146b45' }) => (
  <div style={{
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
    padding: 16
  }}>
    <div style={{
      background: '#fff', borderRadius: 16, padding: '28px 32px', minWidth: 380,
      maxWidth: 560, width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
      maxHeight: '90vh', overflowY: 'auto'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, color: accent, display: 'flex', alignItems: 'center', gap: 8 }}>
          {title}
        </h3>
        <button
          onClick={onClose}
          aria-label="Close"
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', padding: 4 }}
        >
          <X size={20} />
        </button>
      </div>
      {children}
    </div>
  </div>
);

// ── Feedback Banner ────────────────────────────────────────────────────────
const Feedback = ({ msg }) => {
  if (!msg) return null;
  const isSuccess = msg.type === 'success';
  return (
    <div style={{
      padding: '12px 18px', borderRadius: 8, marginBottom: 20, fontSize: '0.9rem', fontWeight: 600,
      background: isSuccess ? '#dcfce7' : '#fee2e2',
      color: isSuccess ? '#166534' : '#dc2626',
      border: `1px solid ${isSuccess ? '#bbf7d0' : '#fecaca'}`,
      display: 'flex', alignItems: 'center', gap: 8
    }}>
      {isSuccess ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
      <span>{msg.text}</span>
    </div>
  );
};

// ── Main ManageOrders Component ─────────────────────────────────────────────
export const ManageOrders = () => {
  const [activeTab, setActiveTab] = useState('pipeline');
  const [orders, setOrders] = useState([]);
  const [salesReport, setSalesReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [reportLoading, setReportLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);

  // Filters for Pipeline Tab
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sortKey, setSortKey] = useState('createdAt');
  const [sortDir, setSortDir] = useState('desc');

  // Filters for Sales Report Tab
  const [reportFrom, setReportFrom] = useState('');
  const [reportTo, setReportTo] = useState('');
  const [reportStatus, setReportStatus] = useState('');
  const [exporting, setExporting] = useState(false);

  // Modals
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [cancelModalOrder, setCancelModalOrder] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  const showFeedback = (type, text) => {
    setFeedback({ type, text });
    setTimeout(() => setFeedback(null), 5000);
  };

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    setCopiedId(label || text);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // ── Data Fetching ─────────────────────────────────────────────────────────
  const fetchOrdersAndSummary = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);

    try {
      const [ordersData, salesData] = await Promise.all([
        axiosInstance.get('/order/staff/orders').catch((err) => {
          console.error('Error fetching staff orders:', err);
          return [];
        }),
        axiosInstance.get('/order/reports/sales').catch((err) => {
          console.error('Error fetching sales report:', err);
          return null;
        }),
      ]);

      setOrders(Array.isArray(ordersData) ? ordersData : []);
      setSalesReport(salesData || null);
    } catch (e) {
      showFeedback('error', 'Failed to retrieve order pipeline data.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const fetchSalesReport = useCallback(async () => {
    setReportLoading(true);
    try {
      const params = new URLSearchParams();
      if (reportFrom) params.set('from', new Date(reportFrom).toISOString());
      if (reportTo) {
        const toDate = new Date(reportTo);
        toDate.setHours(23, 59, 59, 999);
        params.set('to', toDate.toISOString());
      }
      if (reportStatus) params.set('status', reportStatus);

      const qs = params.toString() ? `?${params.toString()}` : '';
      const data = await axiosInstance.get(`/order/reports/sales${qs}`);
      setSalesReport(data || null);
    } catch (err) {
      showFeedback('error', err.message || 'Failed to load sales report.');
    } finally {
      setReportLoading(false);
    }
  }, [reportFrom, reportTo, reportStatus]);

  useEffect(() => {
    fetchOrdersAndSummary();
  }, [fetchOrdersAndSummary]);

  // ── CSV Export ────────────────────────────────────────────────────────────
  const handleExportCsv = async () => {
    setExporting(true);
    try {
      const params = new URLSearchParams();
      if (reportFrom) params.set('from', new Date(reportFrom).toISOString());
      if (reportTo) {
        const toDate = new Date(reportTo);
        toDate.setHours(23, 59, 59, 999);
        params.set('to', toDate.toISOString());
      }
      if (reportStatus) params.set('status', reportStatus);

      const qs = params.toString() ? `?${params.toString()}` : '';
      const token = localStorage.getItem('marketflowToken');
      const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';
      
      const response = await fetch(`${baseUrl}/order/reports/sales/export${qs}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });

      if (!response.ok) {
        throw new Error(`Export failed with status ${response.status}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `marketflow-sales-report-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      showFeedback('success', 'Sales report exported successfully.');
    } catch (err) {
      showFeedback('error', err.message || 'Failed to export CSV report.');
    } finally {
      setExporting(false);
    }
  };

  // ── Cancellation Handler ──────────────────────────────────────────────────
  const handleCancelOrder = async () => {
    if (!cancelModalOrder) return;
    if (!cancelReason.trim()) {
      showFeedback('error', 'Please provide a reason for cancelling this order.');
      return;
    }

    setCancelling(true);
    try {
      await axiosInstance.post(`/order/staff/orders/${cancelModalOrder.id}/cancel`, {
        reason: cancelReason.trim()
      });

      showFeedback('success', `Order ${shortId(cancelModalOrder.id)} cancelled successfully. Inventory released.`);
      setCancelModalOrder(null);
      setCancelReason('');
      if (selectedOrder?.id === cancelModalOrder.id) {
        setSelectedOrder(prev => prev ? { ...prev, status: 'Cancelled' } : null);
      }
      // Refresh pipeline
      await fetchOrdersAndSummary(true);
    } catch (err) {
      showFeedback('error', err.message || 'Failed to cancel order.');
    } finally {
      setCancelling(false);
    }
  };

  // ── Sorted and Filtered Orders ────────────────────────────────────────────
  const filteredOrders = useMemo(() => {
    let rows = orders;

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      rows = rows.filter(o =>
        (o.id && o.id.toLowerCase().includes(q)) ||
        (o.customerId && o.customerId.toLowerCase().includes(q)) ||
        (o.status && o.status.toLowerCase().includes(q))
      );
    }

    if (statusFilter && statusFilter !== 'All') {
      rows = rows.filter(o => o.status === statusFilter);
    }

    return [...rows].sort((a, b) => {
      let av = a[sortKey], bv = b[sortKey];
      if (sortKey === 'createdAt') {
        av = new Date(av).getTime();
        bv = new Date(bv).getTime();
      } else if (sortKey === 'total') {
        av = Number(av || 0);
        bv = Number(bv || 0);
      } else if (typeof av === 'string') {
        av = av.toLowerCase();
        bv = (bv || '').toLowerCase();
      }

      if (av < bv) return sortDir === 'asc' ? -1 : 1;
      if (av > bv) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
  }, [orders, search, statusFilter, sortKey, sortDir]);

  const toggleSort = (key) => {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const SortIcon = ({ k }) => {
    if (sortKey !== k) return null;
    return sortDir === 'asc' ? <ChevronUp size={13} /> : <ChevronDown size={13} />;
  };

  // ── KPI Summary Cards ─────────────────────────────────────────────────────
  const confirmedOrders = orders.filter(o => o.status === 'Confirmed');
  const pendingOrders = orders.filter(o => o.status === 'PendingReservation');
  const cancelledOrders = orders.filter(o => o.status === 'Cancelled' || o.status === 'CancellationPending');

  const recognizedSalesTotal = salesReport?.recognizedSales !== undefined
    ? Number(salesReport.recognizedSales)
    : confirmedOrders.reduce((sum, o) => sum + Number(o.total || 0), 0);

  const kpiCards = [
    {
      label: 'TOTAL ORDERS',
      value: orders.length,
      sub: 'All lifetime orders',
      bg: '#eff6ff',
      color: '#1d4ed8',
      icon: <Package size={22} />
    },
    {
      label: 'RECOGNIZED REVENUE',
      value: fmtMoney(recognizedSalesTotal),
      sub: `${confirmedOrders.length} Confirmed orders`,
      bg: '#dcfce7',
      color: '#16a34a',
      icon: <DollarSign size={22} />
    },
    {
      label: 'PENDING RESERVATION',
      value: pendingOrders.length,
      sub: 'Inventory reconciliations',
      bg: '#fef3c7',
      color: '#d97706',
      icon: <Clock size={22} />
    },
    {
      label: 'CANCELLED ORDERS',
      value: cancelledOrders.length,
      sub: 'Released stock items',
      bg: '#fee2e2',
      color: '#dc2626',
      icon: <XCircle size={22} />
    },
    {
      label: 'TAX & FEES COLLECTED',
      value: salesReport ? fmtMoney(Number(salesReport.tax || 0) + Number(salesReport.deliveryFee || 0)) : '$0.00',
      sub: 'Fulfillment & duties',
      bg: '#f3e8ff',
      color: '#7c3aed',
      icon: <BarChart2 size={22} />
    },
  ];

  // ── Styles ────────────────────────────────────────────────────────────────
  const thStyle = {
    padding: '12px 16px', textAlign: 'left', fontSize: '0.76rem', fontWeight: 700,
    color: '#6b7280', background: '#f9fafb', borderBottom: '1px solid #e5e7eb',
    cursor: 'pointer', whiteSpace: 'nowrap', userSelect: 'none'
  };
  const tdStyle = {
    padding: '13px 16px', borderBottom: '1px solid #f3f4f6', fontSize: '0.875rem',
    verticalAlign: 'middle'
  };
  const btnPrimary = {
    padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer',
    fontWeight: 700, fontSize: '0.84rem'
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: 360, color: '#6b7280', gap: 12 }}>
        <RefreshCw size={32} style={{ animation: 'spin 1s linear infinite', color: 'var(--color-primary, #146b45)' }} />
        <span style={{ fontSize: '0.95rem', fontWeight: 600 }}>Loading order pipeline…</span>
      </div>
    );
  }

  return (
    <div>
      {/* ── Page Header ── */}
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 14 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '2.1rem', color: 'var(--color-primary-dark, #19372c)', margin: 0 }}>
            Order Management Pipeline
          </h1>
          <p style={{ color: 'var(--color-muted, #6f8079)', marginTop: 4, marginBottom: 0, fontSize: '0.95rem' }}>
            Monitor real-time fulfillment pipelines, track sales revenue, and manage order lifecycle states.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <button
            id="order-refresh-btn"
            onClick={() => fetchOrdersAndSummary(true)}
            disabled={refreshing}
            style={{
              ...btnPrimary,
              background: '#ffffff',
              color: 'var(--color-primary-dark, #19372c)',
              border: '1.5px solid var(--color-border, #e3ebe6)',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              boxShadow: 'var(--shadow-sm)'
            }}
          >
            <RefreshCw size={14} style={refreshing ? { animation: 'spin 1s linear infinite' } : {}} />
            {refreshing ? 'Refreshing…' : 'Refresh Data'}
          </button>
        </div>
      </div>

      <Feedback msg={feedback} />

      {/* ── Summary KPI Cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 14, marginBottom: 28 }}>
        {kpiCards.map((c) => (
          <div
            key={c.label}
            style={{
              background: c.bg,
              borderRadius: 14,
              padding: '18px 20px',
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
              border: `1px solid ${c.bg}`
            }}
          >
            <div style={{ color: c.color, flexShrink: 0, background: '#ffffff', padding: 10, borderRadius: 12 }}>
              {c.icon}
            </div>
            <div>
              <div style={{ fontSize: '0.7rem', fontWeight: 700, color: c.color, letterSpacing: '0.04em' }}>
                {c.label}
              </div>
              <div style={{ fontSize: '1.65rem', fontWeight: 800, color: c.color, lineHeight: 1.15, marginTop: 2 }}>
                {c.value}
              </div>
              <div style={{ fontSize: '0.72rem', color: '#6b7280', marginTop: 2 }}>
                {c.sub}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Navigation Tabs ── */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 20, borderBottom: '2px solid #e5e7eb' }}>
        {[
          ['pipeline', <Package size={16} />, `Order Pipeline (${orders.length})`],
          ['sales', <BarChart2 size={16} />, 'Financial & Sales Report'],
        ].map(([id, icon, label]) => (
          <button
            key={id}
            id={`tab-orders-${id}`}
            onClick={() => setActiveTab(id)}
            style={{
              padding: '11px 22px', border: 'none', background: 'none', cursor: 'pointer',
              fontWeight: 700, fontSize: '0.9rem',
              color: activeTab === id ? 'var(--color-primary, #146b45)' : '#6b7280',
              borderBottom: activeTab === id ? '3px solid var(--color-primary, #146b45)' : '3px solid transparent',
              display: 'flex', alignItems: 'center', gap: 8, transition: 'all 0.15s'
            }}
          >
            {icon} {label}
          </button>
        ))}
      </div>

      {/* ═════════════════ TAB 1: ORDER PIPELINE ═════════════════ */}
      {activeTab === 'pipeline' && (
        <div>
          {/* Filter Bar */}
          <div style={{
            background: '#ffffff', border: '1px solid var(--color-border, #e3ebe6)',
            borderRadius: 'var(--radius-md, 14px)', padding: '16px 20px', marginBottom: 20,
            display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center',
            boxShadow: 'var(--shadow-sm)'
          }}>
            {/* Search Input */}
            <div style={{ position: 'relative', flex: '1 1 260px' }}>
              <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
              <input
                id="order-search"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search by Order ID or Customer ID…"
                style={{
                  width: '100%', padding: '9px 12px 9px 36px', border: '1.5px solid #d1d5db',
                  borderRadius: 10, fontSize: '0.88rem', outline: 'none', boxSizing: 'border-box'
                }}
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af' }}
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Status Quick Filters */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              <Filter size={14} style={{ color: '#9ca3af', marginRight: 4 }} />
              {['All', 'Confirmed', 'PendingReservation', 'CancellationPending', 'Cancelled', 'Rejected'].map((status) => {
                const isSelected = statusFilter === status;
                return (
                  <button
                    key={status}
                    id={`filter-${status.toLowerCase()}`}
                    onClick={() => setStatusFilter(status)}
                    style={{
                      padding: '6px 12px', borderRadius: 20, border: '1.5px solid',
                      borderColor: isSelected ? 'var(--color-primary, #146b45)' : '#d1d5db',
                      background: isSelected ? '#eaf5ef' : '#ffffff',
                      color: isSelected ? 'var(--color-primary, #146b45)' : '#6b7280',
                      fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer',
                      transition: 'all 0.15s'
                    }}
                  >
                    {status === 'PendingReservation' ? 'Pending' : status === 'CancellationPending' ? 'Cancelling' : status}
                  </button>
                );
              })}
            </div>

            <div style={{ marginLeft: 'auto', fontSize: '0.82rem', color: '#6b7280', flexShrink: 0 }}>
              Showing <strong>{filteredOrders.length}</strong> of {orders.length} order{orders.length !== 1 ? 's' : ''}
            </div>
          </div>

          {/* Orders Table */}
          <div style={{
            background: '#ffffff', borderRadius: 14, border: '1px solid #e5e7eb',
            overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
          }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={thStyle} onClick={() => toggleSort('id')}>
                      Order Ref <SortIcon k="id" />
                    </th>
                    <th style={thStyle} onClick={() => toggleSort('customerId')}>
                      Customer ID <SortIcon k="customerId" />
                    </th>
                    <th style={thStyle} onClick={() => toggleSort('createdAt')}>
                      Placed At <SortIcon k="createdAt" />
                    </th>
                    <th style={thStyle} onClick={() => toggleSort('total')}>
                      Total Amount <SortIcon k="total" />
                    </th>
                    <th style={thStyle} onClick={() => toggleSort('status')}>
                      Fulfillment Status <SortIcon k="status" />
                    </th>
                    <th style={{ ...thStyle, cursor: 'default', textAlign: 'right' }}>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ padding: 48, textAlign: 'center', color: '#6b7280' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                          <div style={{ background: '#f3f4f6', borderRadius: '50%', padding: 18, color: '#9ca3af' }}>
                            <ShoppingBag size={36} />
                          </div>
                          <div>
                            <p style={{ fontWeight: 700, fontSize: '1rem', color: '#374151', margin: 0 }}>
                              {orders.length === 0 ? 'No orders in system yet' : 'No matching orders found'}
                            </p>
                            <p style={{ fontSize: '0.85rem', color: '#6b7280', marginTop: 4 }}>
                              {orders.length === 0
                                ? 'Orders placed by customers will flow through this fulfillment pipeline in real time.'
                                : 'Try changing your search terms or adjusting the status filters.'}
                            </p>
                          </div>
                          {(search || statusFilter !== 'All') && (
                            <button
                              onClick={() => { setSearch(''); setStatusFilter('All'); }}
                              style={{
                                ...btnPrimary, background: '#eff6ff', color: '#2563eb',
                                border: '1px solid #bfdbfe', marginTop: 8
                              }}
                            >
                              Clear Filters
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredOrders.map((o) => {
                      const badge = getStatusBadge(o.status);
                      const isConfirmed = o.status === 'Confirmed';
                      return (
                        <tr key={o.id} style={{ transition: 'background-color 0.15s' }}>
                          <td style={tdStyle}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <strong style={{ fontFamily: 'monospace', fontSize: '0.9rem', color: 'var(--color-primary-dark, #19372c)' }}>
                                {shortId(o.id)}
                              </strong>
                              <button
                                onClick={() => copyToClipboard(o.id, `order-${o.id}`)}
                                title="Copy Full Order ID"
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: 2 }}
                              >
                                {copiedId === `order-${o.id}` ? <Check size={13} color="#16a34a" /> : <Copy size={13} />}
                              </button>
                            </div>
                          </td>
                          <td style={tdStyle}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#4b5563' }}>
                              <span style={{ fontFamily: 'monospace', fontSize: '0.82rem' }}>
                                {shortId(o.customerId)}
                              </span>
                              <button
                                onClick={() => copyToClipboard(o.customerId, `cust-${o.customerId}`)}
                                title="Copy Customer ID"
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: 2 }}
                              >
                                {copiedId === `cust-${o.customerId}` ? <Check size={13} color="#16a34a" /> : <Copy size={13} />}
                              </button>
                            </div>
                          </td>
                          <td style={tdStyle}>
                            <span style={{ color: '#4b5563', fontSize: '0.85rem' }}>
                              {fmtDate(o.createdAt)}
                            </span>
                          </td>
                          <td style={tdStyle}>
                            <strong style={{ color: 'var(--color-primary-dark, #19372c)', fontSize: '0.95rem' }}>
                              {fmtMoney(o.total)}
                            </strong>
                          </td>
                          <td style={tdStyle}>
                            <span style={{
                              display: 'inline-flex', alignItems: 'center', gap: 6,
                              padding: '4px 10px', borderRadius: 20, fontSize: '0.78rem',
                              fontWeight: 700, background: badge.bg, color: badge.color,
                              border: `1px solid ${badge.border}`
                            }}>
                              {renderStatusIcon(o.status, 12)}
                              {badge.label}
                            </span>
                          </td>
                          <td style={{ ...tdStyle, textAlign: 'right' }}>
                            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', alignItems: 'center' }}>
                              {/* Details button */}
                              <button
                                onClick={() => setSelectedOrder(o)}
                                title="View Order Details"
                                style={{
                                  ...btnPrimary,
                                  background: '#f3f4f6',
                                  color: '#374151',
                                  border: '1px solid #e5e7eb',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 5,
                                  padding: '6px 11px',
                                  fontSize: '0.78rem'
                                }}
                              >
                                <Eye size={13} />
                                Details
                              </button>

                              {/* Cancel button */}
                              {isConfirmed ? (
                                <button
                                  onClick={() => { setCancelModalOrder(o); setCancelReason(''); }}
                                  title="Cancel order and release reserved stock"
                                  style={{
                                    ...btnPrimary,
                                    background: '#fee2e2',
                                    color: '#b91c1c',
                                    border: '1px solid #fecaca',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 5,
                                    padding: '6px 11px',
                                    fontSize: '0.78rem'
                                  }}
                                >
                                  <Ban size={13} />
                                  Cancel
                                </button>
                              ) : (
                                <button
                                  disabled
                                  title={
                                    o.status === 'Cancelled'
                                      ? 'Order is already cancelled'
                                      : 'Only Confirmed orders can be cancelled by Operations Admin'
                                  }
                                  style={{
                                    ...btnPrimary,
                                    background: '#f9fafb',
                                    color: '#9ca3af',
                                    border: '1px solid #e5e7eb',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 5,
                                    padding: '6px 11px',
                                    fontSize: '0.78rem',
                                    cursor: 'not-allowed',
                                    opacity: 0.65
                                  }}
                                >
                                  <Ban size={13} />
                                  Cancel
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ═════════════════ TAB 2: FINANCIAL & SALES REPORT ═════════════════ */}
      {activeTab === 'sales' && (
        <div>
          {/* Date & Filter controls */}
          <div style={{
            background: '#ffffff', border: '1px solid var(--color-border, #e3ebe6)',
            borderRadius: 'var(--radius-md, 14px)', padding: 20, marginBottom: 24,
            boxShadow: 'var(--shadow-sm)'
          }}>
            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'flex-end' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#4b5563', marginBottom: 4 }}>
                    From Date
                  </label>
                  <input
                    type="date"
                    value={reportFrom}
                    onChange={e => setReportFrom(e.target.value)}
                    style={{
                      padding: '8px 12px', border: '1.5px solid #d1d5db', borderRadius: 8,
                      fontSize: '0.88rem', outline: 'none'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#4b5563', marginBottom: 4 }}>
                    To Date
                  </label>
                  <input
                    type="date"
                    value={reportTo}
                    onChange={e => setReportTo(e.target.value)}
                    style={{
                      padding: '8px 12px', border: '1.5px solid #d1d5db', borderRadius: 8,
                      fontSize: '0.88rem', outline: 'none'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#4b5563', marginBottom: 4 }}>
                    Status Filter
                  </label>
                  <select
                    value={reportStatus}
                    onChange={e => setReportStatus(e.target.value)}
                    style={{
                      padding: '8px 12px', border: '1.5px solid #d1d5db', borderRadius: 8,
                      fontSize: '0.88rem', outline: 'none', background: '#fff'
                    }}
                  >
                    <option value="">All Statuses</option>
                    <option value="Confirmed">Confirmed</option>
                    <option value="PendingReservation">Pending Reservation</option>
                    <option value="CancellationPending">Cancellation Pending</option>
                    <option value="Cancelled">Cancelled</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>
                <button
                  id="btn-filter-report"
                  onClick={fetchSalesReport}
                  disabled={reportLoading}
                  style={{
                    ...btnPrimary,
                    background: 'var(--color-primary, #146b45)',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6
                  }}
                >
                  <Filter size={14} />
                  {reportLoading ? 'Filtering…' : 'Apply Filter'}
                </button>
                {(reportFrom || reportTo || reportStatus) && (
                  <button
                    onClick={() => {
                      setReportFrom('');
                      setReportTo('');
                      setReportStatus('');
                      fetchOrdersAndSummary(true);
                    }}
                    style={{
                      ...btnPrimary,
                      background: '#f3f4f6',
                      color: '#4b5563',
                      border: '1px solid #d1d5db'
                    }}
                  >
                    Reset
                  </button>
                )}
              </div>

              {/* CSV Export Button */}
              <button
                id="btn-export-csv"
                onClick={handleExportCsv}
                disabled={exporting}
                style={{
                  ...btnPrimary,
                  background: '#15803d',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  boxShadow: '0 2px 4px rgba(21,128,61,0.2)'
                }}
              >
                <Download size={15} />
                {exporting ? 'Exporting…' : 'Export CSV Report'}
              </button>
            </div>
          </div>

          {/* Financial Breakdown Cards */}
          {salesReport && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, marginBottom: 24 }}>
              <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 18 }}>
                <div style={{ fontSize: '0.74rem', fontWeight: 700, color: '#6b7280' }}>RECOGNIZED SALES</div>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#15803d', marginTop: 4 }}>
                  {fmtMoney(salesReport.recognizedSales)}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: 4 }}>From confirmed orders</div>
              </div>
              <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 18 }}>
                <div style={{ fontSize: '0.74rem', fontWeight: 700, color: '#6b7280' }}>SALES TAX</div>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#374151', marginTop: 4 }}>
                  {fmtMoney(salesReport.tax)}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: 4 }}>Collected sales taxes</div>
              </div>
              <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 18 }}>
                <div style={{ fontSize: '0.74rem', fontWeight: 700, color: '#6b7280' }}>DELIVERY FEES</div>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#374151', marginTop: 4 }}>
                  {fmtMoney(salesReport.deliveryFee)}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: 4 }}>Shipping & logistics fees</div>
              </div>
              <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 18 }}>
                <div style={{ fontSize: '0.74rem', fontWeight: 700, color: '#6b7280' }}>TOTAL TRANSACTIONS</div>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#1d4ed8', marginTop: 4 }}>
                  {salesReport.orderCount}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: 4 }}>Orders in queried range</div>
              </div>
            </div>
          )}

          {/* Sales Report Table */}
          <div style={{
            background: '#ffffff', borderRadius: 14, border: '1px solid #e5e7eb',
            overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
          }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={thStyle}>Order Ref</th>
                    <th style={thStyle}>Date & Time</th>
                    <th style={thStyle}>Status</th>
                    <th style={thStyle}>Subtotal</th>
                    <th style={thStyle}>Tax</th>
                    <th style={thStyle}>Delivery Fee</th>
                    <th style={thStyle}>Total Amount</th>
                    <th style={thStyle}>Currency</th>
                  </tr>
                </thead>
                <tbody>
                  {(!salesReport?.orders || salesReport.orders.length === 0) ? (
                    <tr>
                      <td colSpan={8} style={{ padding: 48, textAlign: 'center', color: '#6b7280' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                          <BarChart2 size={36} color="#9ca3af" />
                          <p style={{ fontWeight: 700, fontSize: '0.95rem', color: '#374151', margin: 0 }}>
                            No sales records found for this period
                          </p>
                          <p style={{ fontSize: '0.85rem', color: '#6b7280', margin: 0 }}>
                            Adjust your date range or status filters to view historical sales data.
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    salesReport.orders.map((row) => {
                      const badge = getStatusBadge(row.status);
                      return (
                        <tr key={row.id}>
                          <td style={tdStyle}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <strong style={{ fontFamily: 'monospace', fontSize: '0.88rem' }}>
                                {shortId(row.id)}
                              </strong>
                              <button
                                onClick={() => copyToClipboard(row.id, `report-${row.id}`)}
                                title="Copy Order ID"
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: 2 }}
                              >
                                {copiedId === `report-${row.id}` ? <Check size={12} color="#16a34a" /> : <Copy size={12} />}
                              </button>
                            </div>
                          </td>
                          <td style={tdStyle}>
                            <span style={{ color: '#4b5563', fontSize: '0.85rem' }}>
                              {fmtDate(row.createdAt)}
                            </span>
                          </td>
                          <td style={tdStyle}>
                            <span style={{
                              display: 'inline-flex', alignItems: 'center', gap: 5,
                              padding: '3px 9px', borderRadius: 20, fontSize: '0.76rem',
                              fontWeight: 700, background: badge.bg, color: badge.color,
                              border: `1px solid ${badge.border}`
                            }}>
                              {badge.label}
                            </span>
                          </td>
                          <td style={tdStyle}>{fmtMoney(row.subtotal)}</td>
                          <td style={tdStyle}>{fmtMoney(row.tax)}</td>
                          <td style={tdStyle}>{fmtMoney(row.deliveryFee)}</td>
                          <td style={tdStyle}>
                            <strong style={{ color: 'var(--color-primary-dark, #19372c)' }}>
                              {fmtMoney(row.total)}
                            </strong>
                          </td>
                          <td style={tdStyle}>
                            <span style={{ fontSize: '0.8rem', color: '#6b7280', fontWeight: 600 }}>
                              {row.currency || 'USD'}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ═════════════════ MODAL: ORDER DETAILS ═════════════════ */}
      {selectedOrder && (
        <Modal
          title={`Order Details: ${shortId(selectedOrder.id)}`}
          onClose={() => setSelectedOrder(null)}
          accent="var(--color-primary-dark, #19372c)"
        >
          <div>
            {/* Status notification banner inside modal */}
            {(() => {
              const badge = getStatusBadge(selectedOrder.status);
              return (
                <div style={{
                  padding: '12px 16px', borderRadius: 10, background: badge.bg,
                  border: `1px solid ${badge.border}`, marginBottom: 20,
                  display: 'flex', alignItems: 'center', gap: 10
                }}>
                  <div style={{ color: badge.color }}>{renderStatusIcon(selectedOrder.status, 20)}</div>
                  <div>
                    <div style={{ fontWeight: 800, color: badge.color, fontSize: '0.92rem' }}>
                      {badge.label}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#4b5563', marginTop: 2 }}>
                      {badge.desc}
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Field breakdown */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 20 }}>
              <div style={{ background: '#f9fafb', padding: '12px 14px', borderRadius: 8, border: '1px solid #e5e7eb' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#6b7280', display: 'block' }}>ORDER ID</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                  <span style={{ fontFamily: 'monospace', fontSize: '0.82rem', wordBreak: 'break-all', color: '#111827' }}>
                    {selectedOrder.id}
                  </span>
                  <button
                    onClick={() => copyToClipboard(selectedOrder.id, 'modal-order-id')}
                    title="Copy Order ID"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', padding: 2 }}
                  >
                    {copiedId === 'modal-order-id' ? <Check size={13} color="#16a34a" /> : <Copy size={13} />}
                  </button>
                </div>
              </div>

              <div style={{ background: '#f9fafb', padding: '12px 14px', borderRadius: 8, border: '1px solid #e5e7eb' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#6b7280', display: 'block' }}>CUSTOMER ID</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                  <span style={{ fontFamily: 'monospace', fontSize: '0.82rem', wordBreak: 'break-all', color: '#111827' }}>
                    {selectedOrder.customerId || '—'}
                  </span>
                  {selectedOrder.customerId && (
                    <button
                      onClick={() => copyToClipboard(selectedOrder.customerId, 'modal-cust-id')}
                      title="Copy Customer ID"
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', padding: 2 }}
                    >
                      {copiedId === 'modal-cust-id' ? <Check size={13} color="#16a34a" /> : <Copy size={13} />}
                    </button>
                  )}
                </div>
              </div>

              <div style={{ background: '#f9fafb', padding: '12px 14px', borderRadius: 8, border: '1px solid #e5e7eb' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#6b7280', display: 'block' }}>DATE CREATED</span>
                <span style={{ fontSize: '0.88rem', fontWeight: 600, color: '#111827', marginTop: 4, display: 'block' }}>
                  {fmtDate(selectedOrder.createdAt)}
                </span>
              </div>

              <div style={{ background: '#f9fafb', padding: '12px 14px', borderRadius: 8, border: '1px solid #e5e7eb' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#6b7280', display: 'block' }}>ORDER TOTAL</span>
                <span style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--color-primary-dark, #19372c)', marginTop: 2, display: 'block' }}>
                  {fmtMoney(selectedOrder.total)}
                </span>
              </div>
            </div>

            {/* Modal Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 24, paddingTop: 16, borderTop: '1px solid #e5e7eb' }}>
              <button
                onClick={() => setSelectedOrder(null)}
                style={{
                  ...btnPrimary, background: '#f3f4f6', color: '#374151',
                  border: '1px solid #d1d5db'
                }}
              >
                Close
              </button>
              {selectedOrder.status === 'Confirmed' && (
                <button
                  onClick={() => {
                    const toCancel = selectedOrder;
                    setSelectedOrder(null);
                    setCancelModalOrder(toCancel);
                    setCancelReason('');
                  }}
                  style={{
                    ...btnPrimary, background: '#fee2e2', color: '#b91c1c',
                    border: '1px solid #fecaca', display: 'flex', alignItems: 'center', gap: 6
                  }}
                >
                  <Ban size={14} />
                  Cancel Order
                </button>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* ═════════════════ MODAL: CANCEL ORDER ═════════════════ */}
      {cancelModalOrder && (
        <Modal
          title="Cancel Confirmed Order"
          onClose={() => { setCancelModalOrder(null); setCancelReason(''); }}
          accent="#b91c1c"
        >
          <div>
            <div style={{
              background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10,
              padding: '14px 16px', marginBottom: 18, display: 'flex', gap: 10
            }}>
              <ShieldAlert size={20} color="#b91c1c" style={{ flexShrink: 0, marginTop: 2 }} />
              <div style={{ fontSize: '0.85rem', color: '#991b1b', lineHeight: 1.45 }}>
                <strong>Attention:</strong> Cancelling this order will trigger an automated stock release
                in the Catalog Service and mark this order as Cancelled. This action cannot be undone.
              </div>
            </div>

            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: '0.8rem', color: '#6b7280', marginBottom: 4 }}>
                Target Order: <strong style={{ color: '#111827', fontFamily: 'monospace' }}>{cancelModalOrder.id}</strong>
              </div>
              <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>
                Total: <strong style={{ color: '#111827' }}>{fmtMoney(cancelModalOrder.total)}</strong>
              </div>
            </div>

            {/* Quick reason chips */}
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#374151', marginBottom: 6 }}>
                Common Reasons:
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {[
                  'Customer requested prior to dispatch',
                  'Payment authorization issue',
                  'Warehouse stock discrepancy',
                  'Delivery address unreachable'
                ].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setCancelReason(preset)}
                    style={{
                      padding: '4px 10px', borderRadius: 14, fontSize: '0.76rem',
                      fontWeight: 600, border: '1px solid #d1d5db',
                      background: cancelReason === preset ? '#fee2e2' : '#f9fafb',
                      color: cancelReason === preset ? '#991b1b' : '#4b5563',
                      cursor: 'pointer'
                    }}
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>

            {/* Textarea for reason */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#374151', marginBottom: 4 }}>
                Cancellation Reason <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <textarea
                id="cancel-reason-input"
                rows={3}
                value={cancelReason}
                onChange={e => setCancelReason(e.target.value)}
                placeholder="State the justification for cancelling this order…"
                style={{
                  width: '100%', padding: '10px 12px', border: '1.5px solid #d1d5db',
                  borderRadius: 8, fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box',
                  resize: 'vertical'
                }}
              />
            </div>

            {/* Dialog buttons */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button
                type="button"
                onClick={() => { setCancelModalOrder(null); setCancelReason(''); }}
                disabled={cancelling}
                style={{
                  ...btnPrimary, background: '#f3f4f6', color: '#374151',
                  border: '1px solid #d1d5db'
                }}
              >
                Keep Order
              </button>
              <button
                id="confirm-cancel-order-btn"
                type="button"
                onClick={handleCancelOrder}
                disabled={cancelling || !cancelReason.trim()}
                style={{
                  ...btnPrimary,
                  background: !cancelReason.trim() ? '#9ca3af' : '#dc2626',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  cursor: !cancelReason.trim() || cancelling ? 'not-allowed' : 'pointer'
                }}
              >
                <Ban size={14} />
                {cancelling ? 'Cancelling & Releasing…' : 'Confirm Cancellation'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Global CSS spinner rule if not present */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};
