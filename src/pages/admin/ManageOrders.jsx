import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Package, CheckCircle, Clock, AlertTriangle, XCircle, Search,
  Filter, RefreshCw, X, ChevronDown, ChevronUp, Download,
  DollarSign, BarChart2, Eye, Copy, Check, FileText,
  ShoppingBag, ArrowRight, Truck, Info,
  Building2, Banknote
} from 'lucide-react';
import axiosInstance, { apiUrl } from '../../services/axiosInstance';

// ── Helpers & Formatters ────────────────────────────────────────────────────
const statusConfig = {
  Pending: {
    bg: '#fef3c7', color: '#b45309', border: '#fde68a', label: 'Pending',
    desc: 'Waiting for staff confirmation.'
  },
  Confirmed: {
    bg: '#dcfce7',
    color: '#15803d',
    border: '#bbf7d0',
    label: 'Confirmed',
    desc: 'Inventory reserved & payment confirmed. Ready for fulfillment.'
  },
  Delivery: {
    bg: '#dbeafe',
    color: '#1d4ed8',
    border: '#bfdbfe',
    label: 'Delivery',
    desc: 'The assigned rider is delivering this order.'
  },
  Delivered: {
    bg: '#dcfce7',
    color: '#15803d',
    border: '#bbf7d0',
    label: 'Delivered',
    desc: 'This order has been delivered.'
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
    case 'Delivery':
      return <Truck size={size} />;
    case 'Delivered':
      return <CheckCircle size={size} />;
    case 'Pending':
      return <Clock size={size} />;
    case 'Cancelled':
      return <XCircle size={size} />;
    case 'Rejected':
      return <XCircle size={size} />;
    default:
      return <Package size={size} />;
  }
};

const fmtMoney = (val, currency = 'Rs. ') => {
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
  const [confirmModalOrder, setConfirmModalOrder] = useState(null);
  const [rejectModalOrder, setRejectModalOrder] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [copiedId, setCopiedId] = useState(null);
  const [availableRiders, setAvailableRiders] = useState([]);
  const [ridersLoading, setRidersLoading] = useState(false);
  const [selectedRiderId, setSelectedRiderId] = useState('');
  const [assigning, setAssigning] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const showFeedback = (type, text) => {
    setFeedback({ type, text });
    setTimeout(() => setFeedback(null), 5000);
  };

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    setCopiedId(label || text);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const openOrder = async (order) => {
    setSelectedOrder(order);
    setAvailableRiders([]);
    setSelectedRiderId('');
    try {
      const detail = await axiosInstance.get(`/order/staff/orders/${order.id}`);
      const fullOrder = { ...order, ...detail };
      setSelectedOrder(fullOrder);
      if (fullOrder.status === 'Confirmed') await loadRiders();
    } catch (err) { showFeedback('error', err.message || 'Unable to load order details.'); }
  };
  const confirmOrder = async (order = selectedOrder) => {
    if (!order || order.status !== 'Pending') return;
    setActionLoading(true);
    try {
      await axiosInstance.post(`/order/staff/orders/${order.id}/confirm`, { notes: 'Confirmed by operations' });
      showFeedback('success', 'Order confirmed. It is ready for rider assignment.');
      setConfirmModalOrder(null);
      if (selectedOrder?.id === order.id) setSelectedOrder(current => current ? { ...current, status: 'Confirmed' } : null);
      await fetchOrdersAndSummary(true);
    } catch (err) { showFeedback('error', err.message || 'Confirmation failed.'); }
    finally { setActionLoading(false); }
  };
  const rejectOrder = async (order = selectedOrder) => {
    if (!order || order.status !== 'Pending' || !rejectReason.trim()) return;
    setActionLoading(true);
    try {
      await axiosInstance.post(`/order/staff/orders/${order.id}/reject`, { reason: rejectReason.trim() });
      showFeedback('success', 'Order rejected.');
      setRejectModalOrder(null);
      if (selectedOrder?.id === order.id) setSelectedOrder(current => current ? { ...current, status: 'Rejected' } : null);
      setRejectReason('');
      await fetchOrdersAndSummary(true);
    } catch (err) { showFeedback('error', err.message || 'Rejection failed.'); }
    finally { setActionLoading(false); }
  };
  const loadRiders = async () => {
    setRidersLoading(true);
    try {
      const riders = await axiosInstance.get('/order/staff/riders/available');
      setAvailableRiders(Array.isArray(riders) ? riders : []);
    } catch (err) {
      setAvailableRiders([]);
      showFeedback('error', err.message || 'Unable to load available riders.');
    } finally { setRidersLoading(false); }
  };
  const assignRider = async () => {
    if (!selectedOrder || !selectedRiderId) return;
    setAssigning(true);
    try {
      await axiosInstance.post(`/order/staff/orders/${selectedOrder.id}/assign`, { riderId: selectedRiderId });
      showFeedback('success', 'Rider assigned successfully.');
      setSelectedOrder({ ...selectedOrder, assignedRiderId: selectedRiderId });
      await fetchOrdersAndSummary(true);
    } catch (err) { showFeedback('error', err.message || 'Rider assignment failed.'); } finally { setAssigning(false); }
  };
  const startDelivery = async () => {
    if (!selectedOrder?.assignedRiderId) {
      showFeedback('error', 'Please assign a rider before starting delivery.');
      return;
    }
    setActionLoading(true);
    try {
      await axiosInstance.post(`/order/staff/orders/${selectedOrder.id}/start-delivery`);
      setSelectedOrder({ ...selectedOrder, status: 'Delivery' });
      showFeedback('success', 'Delivery started successfully.');
      await fetchOrdersAndSummary(true);
    } catch (err) { showFeedback('error', err.message || 'Unable to start delivery.'); } finally { setActionLoading(false); }
  };
  const markDelivered = async () => {
    if (!selectedOrder) return;
    setActionLoading(true);
    try {
      await axiosInstance.post(`/order/staff/orders/${selectedOrder.id}/deliver`);
      setSelectedOrder({ ...selectedOrder, status: 'Delivered' });
      showFeedback('success', 'Order marked as delivered.');
      await fetchOrdersAndSummary(true);
    } catch (err) { showFeedback('error', err.message || 'Unable to mark this order as delivered.'); } finally { setActionLoading(false); }
  };

  const [receiptLoading, setReceiptLoading] = useState(false);

  const viewReceipt = async (orderId, fileName) => {
    if (receiptLoading) return;
    setReceiptLoading(true);
    try {
      const response = await axiosInstance.get(`/order/orders/${orderId}/payment/receipt`, {
        responseType: 'blob',
      });
      const blob = response instanceof Blob ? response : new Blob([response], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch (err) {
      showFeedback('error', err.message || 'Unable to load payment receipt.');
    } finally {
      setReceiptLoading(false);
    }
  };

  const verifyPayment = async () => {
    if (!selectedOrder) return;
    setActionLoading(true);
    try {
      await axiosInstance.post(`/order/staff/orders/${selectedOrder.id}/payment/verify`);
      showFeedback('success', 'Payment verified successfully.');
      await fetchOrdersAndSummary(true);
      await openOrder({ ...selectedOrder, paymentStatus: 'Verified' });
    } catch (err) {
      showFeedback('error', err.message || 'Payment verification failed.');
    } finally {
      setActionLoading(false);
    }
  };

  const rejectPayment = async () => {
    if (!selectedOrder) return;
    const reason = window.prompt('Reason for rejecting this payment receipt:');
    if (!reason?.trim()) return;
    setActionLoading(true);
    try {
      await axiosInstance.post(`/order/staff/orders/${selectedOrder.id}/payment/reject`, { reason: reason.trim() });
      showFeedback('success', 'Payment rejected.');
      await fetchOrdersAndSummary(true);
      await openOrder({ ...selectedOrder, paymentStatus: 'Rejected', rejectionReason: reason.trim() });
    } catch (err) {
      showFeedback('error', err.message || 'Payment rejection failed.');
    } finally {
      setActionLoading(false);
    }
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
      const response = await fetch(apiUrl(`/order/reports/sales/export${qs}`), {
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
  const pendingOrders = orders.filter(o => o.status === 'Pending');
  const cancelledOrders = orders.filter(o => o.status === 'Cancelled');

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
      label: 'DELIVERY FEES COLLECTED',
      value: salesReport ? fmtMoney(Number(salesReport.deliveryFee || 0)) : 'Rs. 0.00',
      sub: 'Shipping & logistics',
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
              {['All', 'Pending', 'Confirmed', 'Delivery', 'Delivered', 'Cancelled', 'Rejected'].map((status) => {
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
                    {status}
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
                    <th style={thStyle} onClick={() => toggleSort('paymentStatus')}>
                      Payment <SortIcon k="paymentStatus" />
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
                      <td colSpan={7} style={{ padding: 48, textAlign: 'center', color: '#6b7280' }}>
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
                      const isPending = o.status === 'Pending';
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
                            {o.paymentMethod === 'BankTransfer' ? (
                              <span style={{
                                display: 'inline-flex', alignItems: 'center', gap: 5,
                                padding: '3px 8px', borderRadius: 14, fontSize: '0.75rem',
                                fontWeight: 700,
                                background: o.paymentStatus === 'Verified' ? '#dcfce7' : o.paymentStatus === 'Rejected' ? '#fee2e2' : '#fef3c7',
                                color: o.paymentStatus === 'Verified' ? '#15803d' : o.paymentStatus === 'Rejected' ? '#b91c1c' : '#b45309',
                                border: `1px solid ${o.paymentStatus === 'Verified' ? '#bbf7d0' : o.paymentStatus === 'Rejected' ? '#fecaca' : '#fde68a'}`
                              }}>
                                <Building2 size={11} />
                                {o.paymentStatus === 'Verified' ? 'Bank · Verified' : o.paymentStatus === 'Rejected' ? 'Bank · Rejected' : 'Bank · Pending'}
                              </span>
                            ) : (
                              <span style={{
                                display: 'inline-flex', alignItems: 'center', gap: 5,
                                padding: '3px 8px', borderRadius: 14, fontSize: '0.75rem',
                                fontWeight: 600, background: '#f3f4f6', color: '#4b5563',
                                border: '1px solid #e5e7eb'
                              }}>
                                <Banknote size={11} />
                                COD
                              </span>
                            )}
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
                                onClick={() => openOrder(o)}
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

                              {/* Pending orders have the same operational actions for Admin and Staff. */}
                              {isPending ? (
                                <>
                                  <button
                                    onClick={() => setConfirmModalOrder(o)}
                                    disabled={actionLoading || (o.paymentMethod === 'BankTransfer' && o.paymentStatus !== 'Verified')}
                                    title={o.paymentMethod === 'BankTransfer' && o.paymentStatus !== 'Verified' ? 'Verify bank-transfer payment before confirmation' : 'Confirm pending order'}
                                    style={{ ...btnPrimary, background: '#15803d', color: '#fff', display: 'inline-flex', alignItems: 'center', gap: 5, padding: '6px 11px', fontSize: '0.78rem', opacity: actionLoading || (o.paymentMethod === 'BankTransfer' && o.paymentStatus !== 'Verified') ? 0.65 : 1 }}
                                  >
                                    <CheckCircle size={13} /> Confirm
                                  </button>
                                  <button
                                    onClick={() => { setRejectModalOrder(o); setRejectReason(''); }}
                                    disabled={actionLoading}
                                    title="Reject pending order"
                                    style={{ ...btnPrimary, background: '#fff1f2', color: '#be123c', border: '1px solid #fecdd3', display: 'inline-flex', alignItems: 'center', gap: 5, padding: '6px 11px', fontSize: '0.78rem', opacity: actionLoading ? 0.65 : 1 }}
                                  >
                                    <XCircle size={13} /> Reject
                                  </button>
                                </>
                              ) : (
                                o.status === 'Confirmed' && !o.assignedRiderId ? (
                                  <button
                                    onClick={() => openOrder(o)}
                                    title="Assign an available rider"
                                    style={{ ...btnPrimary, background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', display: 'inline-flex', alignItems: 'center', gap: 5, padding: '6px 11px', fontSize: '0.78rem' }}
                                  >
                                    <Truck size={13} /> Assign Rider
                                  </button>
                                ) : <span style={{ color: '#6b7280', fontSize: '0.78rem' }}>No pending actions</span>
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
                    <option value="Pending">Pending</option>
                    <option value="Confirmed">Confirmed</option>
                    <option value="Delivery">Delivery</option>
                    <option value="Delivered">Delivered</option>
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
                    <th style={thStyle}>Delivery Fee</th>
                    <th style={thStyle}>Total Amount</th>
                    <th style={thStyle}>Currency</th>
                  </tr>
                </thead>
                <tbody>
                  {(!salesReport?.orders || salesReport.orders.length === 0) ? (
                    <tr>
                      <td colSpan={7} style={{ padding: 48, textAlign: 'center', color: '#6b7280' }}>
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
                          <td style={tdStyle}>{fmtMoney(row.deliveryFee)}</td>
                          <td style={tdStyle}>
                            <strong style={{ color: 'var(--color-primary-dark, #19372c)' }}>
                              {fmtMoney(row.total)}
                            </strong>
                          </td>
                          <td style={tdStyle}>
                            <span style={{ fontSize: '0.8rem', color: '#6b7280', fontWeight: 600 }}>
                              Rs.
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

            {(() => {
              const address = selectedOrder.address || selectedOrder.Address || {};
              const customerName = address.recipientName || address.RecipientName || '—';
              const phone = address.phone || address.Phone || '—';
              const addressText = [address.line1 || address.Line1, address.line2 || address.Line2, address.city || address.City, address.zone || address.Zone].filter(Boolean).join(', ');
              return (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 20 }}>
                  <div style={{ background: '#f0fdf4', padding: '12px 14px', borderRadius: 8, border: '1px solid #bbf7d0' }}>
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#166534', display: 'block' }}>CUSTOMER DETAILS</span>
                    <strong style={{ display: 'block', marginTop: 5, color: '#111827' }}>{customerName}</strong>
                    <span style={{ display: 'block', marginTop: 3, color: '#475569', fontSize: '0.86rem' }}>Phone: {phone}</span>
                  </div>
                  <div style={{ background: '#eff6ff', padding: '12px 14px', borderRadius: 8, border: '1px solid #bfdbfe' }}>
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#1d4ed8', display: 'block' }}>DELIVERY ADDRESS</span>
                    <span style={{ display: 'block', marginTop: 5, color: '#111827', fontSize: '0.86rem', lineHeight: 1.45 }}>{addressText || 'Address unavailable'}</span>
                  </div>
                </div>
              );
            })()}

            {/* Payment Information Card */}
            <div style={{ background: '#f8fafc', padding: '14px 16px', borderRadius: 8, border: '1px solid #e2e8f0', marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', display: 'flex', alignItems: 'center', gap: 5 }}>
                  {selectedOrder.paymentMethod === 'BankTransfer' ? <Building2 size={14} color="#1d4ed8" /> : <Banknote size={14} color="#16a34a" />}
                  PAYMENT INFORMATION
                </span>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  padding: '3px 10px', borderRadius: 12, fontSize: '0.78rem', fontWeight: 700,
                  background: selectedOrder.paymentStatus === 'Verified' ? '#dcfce7' : selectedOrder.paymentStatus === 'Rejected' ? '#fee2e2' : selectedOrder.paymentMethod === 'BankTransfer' ? '#fef3c7' : '#f3f4f6',
                  color: selectedOrder.paymentStatus === 'Verified' ? '#15803d' : selectedOrder.paymentStatus === 'Rejected' ? '#b91c1c' : selectedOrder.paymentMethod === 'BankTransfer' ? '#b45309' : '#4b5563',
                  border: `1px solid ${selectedOrder.paymentStatus === 'Verified' ? '#bbf7d0' : selectedOrder.paymentStatus === 'Rejected' ? '#fecaca' : selectedOrder.paymentMethod === 'BankTransfer' ? '#fde68a' : '#e5e7eb'}`
                }}>
                  {selectedOrder.paymentMethod === 'BankTransfer' ? (
                    selectedOrder.paymentStatus === 'Verified' ? 'Payment Verified' :
                    selectedOrder.paymentStatus === 'Rejected' ? 'Payment Rejected' :
                    'Pending Verification'
                  ) : 'Cash on Delivery'}
                </span>
              </div>

              <div style={{ fontSize: '0.88rem', color: '#334155' }}>
                <div>Method: <strong>{selectedOrder.paymentMethod === 'BankTransfer' ? 'Direct Bank Transfer' : 'Cash on Delivery'}</strong></div>
                {selectedOrder.paymentMethod === 'BankTransfer' && (
                  <div style={{ marginTop: 8 }}>
                    {selectedOrder.receiptFileName && (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, background: '#fff', padding: '10px 12px', borderRadius: 6, border: '1px solid #cbd5e1', marginTop: 6 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden' }}>
                          <FileText size={16} color="#3b82f6" />
                          <span style={{ fontSize: '0.85rem', fontWeight: 600, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                            {selectedOrder.receiptFileName}
                          </span>
                          {selectedOrder.receiptUploadedAt && (
                            <small style={{ color: '#64748b' }}>({fmtDate(selectedOrder.receiptUploadedAt)})</small>
                          )}
                        </div>
                        <button
                          className="btn btn-outline"
                          style={{ padding: '4px 10px', fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                          disabled={receiptLoading}
                          onClick={() => viewReceipt(selectedOrder.id, selectedOrder.receiptFileName)}
                        >
                          <Eye size={13} /> {receiptLoading ? 'Loading…' : 'View Receipt'}
                        </button>
                      </div>
                    )}

                    {selectedOrder.rejectionReason && selectedOrder.paymentStatus === 'Rejected' && (
                      <div style={{ marginTop: 8, color: '#b91c1c', fontSize: '0.85rem', background: '#fee2e2', padding: '6px 10px', borderRadius: 6 }}>
                        <strong>Rejection Reason:</strong> {selectedOrder.rejectionReason}
                      </div>
                    )}

                    {/* Staff payment verification actions if pending */}
                    {selectedOrder.paymentStatus === 'PendingVerification' && selectedOrder.status === 'Pending' && (
                      <div style={{ display: 'flex', gap: 8, marginTop: 12, paddingTop: 10, borderTop: '1px dashed #cbd5e1' }}>
                        <button
                          className="btn btn-primary"
                          style={{ fontSize: '0.82rem', padding: '6px 12px', background: '#15803d', borderColor: '#15803d' }}
                          disabled={actionLoading}
                          onClick={verifyPayment}
                        >
                          <CheckCircle size={14} /> Verify Payment
                        </button>
                        <button
                          className="btn btn-outline"
                          style={{ fontSize: '0.82rem', padding: '6px 12px', color: '#b91c1c', borderColor: '#fca5a5' }}
                          disabled={actionLoading}
                          onClick={rejectPayment}
                        >
                          <XCircle size={14} /> Reject Payment
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {selectedOrder.items?.length > 0 && <div style={{ marginBottom: 18 }}><strong>Order items</strong>{selectedOrder.items.map((item) => <div key={item.productId} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}><span>{item.name} × {item.quantity}<small style={{ display: 'block', color: '#6b7280' }}>SKU: {item.sku} · Unit: {fmtMoney(item.unitPrice)}</small></span><strong>{fmtMoney(item.lineTotal)}</strong></div>)}</div>}

            {selectedOrder.status === 'Pending' && (
              <div style={{ marginBottom: 16 }}>
                {selectedOrder.paymentMethod === 'BankTransfer' && selectedOrder.paymentStatus !== 'Verified' ? (
                  <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, padding: '10px 14px', marginBottom: 10, fontSize: '0.85rem', color: '#92400e' }}>
                    <strong>Notice:</strong> Bank Transfer orders cannot be confirmed until the payment receipt has been verified above.
                  </div>
                ) : null}
                <select value={rejectReason} onChange={(event) => setRejectReason(event.target.value)} aria-label="Reason for rejecting this order" style={{ width: '100%', maxWidth: 580, height: 48, boxSizing: 'border-box', marginBottom: 10, padding: '10px 12px', border: '1px solid #fecaca', borderRadius: 8, color: rejectReason ? '#7f1d1d' : '#6b7280', background: '#fff', font: 'inherit', fontSize: '1rem', lineHeight: 1.4 }}>
                  <option value="">Select a reason for rejecting this order</option>
                  <option>Customer requested prior to dispatch</option>
                  <option>Payment authorization issue</option>
                  <option>Warehouse stock discrepancy</option>
                  <option>Delivery address unreachable</option>
                </select>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    className="btn btn-primary"
                    disabled={actionLoading || (selectedOrder.paymentMethod === 'BankTransfer' && selectedOrder.paymentStatus !== 'Verified')}
                    onClick={() => setConfirmModalOrder(selectedOrder)}
                    title={selectedOrder.paymentMethod === 'BankTransfer' && selectedOrder.paymentStatus !== 'Verified' ? 'Verify payment first' : 'Confirm Order'}
                  >
                    <CheckCircle size={14} /> Confirm Order
                  </button>
                  <button
                    className="btn btn-outline"
                    disabled={actionLoading || !rejectReason}
                    onClick={() => setRejectModalOrder(selectedOrder)}
                    style={{ color: '#b91c1c' }}
                  >
                    <XCircle size={14} /> Reject
                  </button>
                </div>
              </div>
            )}
            {selectedOrder.status === 'Confirmed' && !selectedOrder.assignedRiderId && (
              <section style={{ marginBottom: 16, padding: 16, background: '#f8fafc', border: '1px solid #dbeafe', borderRadius: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                  <div>
                    <strong style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Truck size={16} /> Assign a rider</strong>
                    <small style={{ color: '#64748b' }}>Select from riders who are currently available.</small>
                  </div>
                  <button className="btn btn-outline" onClick={loadRiders} disabled={ridersLoading || assigning}>
                    <RefreshCw size={14} className={ridersLoading ? 'spin' : ''} /> Refresh
                  </button>
                </div>

                {ridersLoading ? (
                  <p style={{ margin: '12px 0 0', color: '#64748b' }}>Loading available riders…</p>
                ) : availableRiders.length === 0 ? (
                  <p style={{ margin: '12px 0 0', color: '#64748b' }}>No riders are available right now.</p>
                ) : (
                  <>
                    <div role="radiogroup" aria-label="Available riders" style={{ display: 'grid', gap: 8 }}>
                      {availableRiders.map((rider) => {
                        const riderId = rider.riderId || rider.id;
                        const isSelected = selectedRiderId === riderId;
                        return (
                          <label key={riderId} style={{ display: 'flex', alignItems: 'center', gap: 10, border: `1px solid ${isSelected ? '#15803d' : '#e5e7eb'}`, background: isSelected ? '#f0fdf4' : '#fff', borderRadius: 8, padding: 10, cursor: assigning ? 'not-allowed' : 'pointer' }}>
                            <input type="radio" name="rider" value={riderId} checked={isSelected} disabled={assigning} onChange={() => setSelectedRiderId(riderId)} />
                            <span>
                              <strong>{rider.fullName || rider.displayName || 'Unnamed rider'}</strong>
                              <small style={{ display: 'block', color: '#6b7280' }}>{rider.district || 'Any zone'} · {rider.phoneNumber || 'No phone'}{rider.vehicleType ? ` · ${rider.vehicleType}` : ''}</small>
                            </span>
                          </label>
                        );
                      })}
                    </div>
                    <button className="btn btn-primary" style={{ marginTop: 12 }} disabled={!selectedRiderId || assigning} onClick={assignRider}>
                      <Truck size={15} /> {assigning ? 'Assigning…' : 'Assign Selected Rider'}
                    </button>
                  </>
                )}
              </section>
            )}
            {selectedOrder.status === 'Confirmed' && selectedOrder.assignedRiderId && (
              <section style={{ marginBottom: 16, padding: 14, background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10 }}>
                <strong style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#166534' }}><Truck size={16} /> Rider assigned</strong>
                <small style={{ display: 'block', color: '#475569', marginTop: 4 }}>The order is ready to begin delivery.</small>
                <button className="btn btn-primary" style={{ marginTop: 12 }} disabled={actionLoading} onClick={startDelivery}>
                  <Truck size={15} /> {actionLoading ? 'Starting…' : 'Start Delivery'}
                </button>
              </section>
            )}
            {selectedOrder.status === 'Delivery' && (
              <section style={{ marginBottom: 16, padding: 14, background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 10 }}>
                <strong style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#1d4ed8' }}><Truck size={16} /> Delivery in progress</strong>
                <button className="btn btn-primary" style={{ marginTop: 12 }} disabled={actionLoading} onClick={markDelivered}>
                  <CheckCircle size={15} /> {actionLoading ? 'Updating…' : 'Mark Delivered'}
                </button>
              </section>
            )}

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
            </div>
          </div>
        </Modal>
      )}

      {confirmModalOrder && (
        <Modal title="Confirm Pending Order" onClose={() => setConfirmModalOrder(null)} accent="#15803d">
          <p>Confirm {shortId(confirmModalOrder.id)}? This reserves it for fulfillment and enables rider assignment.</p>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <button className="btn btn-outline" disabled={actionLoading} onClick={() => setConfirmModalOrder(null)}>Back</button>
            <button className="btn btn-primary" disabled={actionLoading} onClick={() => confirmOrder(confirmModalOrder)}><CheckCircle size={14} /> {actionLoading ? 'Confirming…' : 'Confirm Order'}</button>
          </div>
        </Modal>
      )}

      {rejectModalOrder && (
        <Modal title="Reject Pending Order" onClose={() => { setRejectModalOrder(null); setRejectReason(''); }} accent="#be123c">
          <label htmlFor="reject-order-reason" style={{ display: 'block', fontWeight: 700, marginBottom: 6 }}>Rejection reason</label>
          <textarea id="reject-order-reason" rows={3} value={rejectReason} onChange={event => setRejectReason(event.target.value)} placeholder="Explain why this order cannot be fulfilled." style={{ width: '100%', boxSizing: 'border-box', padding: 10, borderRadius: 8, border: '1px solid #fecdd3', resize: 'vertical' }} />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
            <button className="btn btn-outline" disabled={actionLoading} onClick={() => { setRejectModalOrder(null); setRejectReason(''); }}>Back</button>
            <button className="btn btn-outline" style={{ color: '#be123c' }} disabled={actionLoading || !rejectReason.trim()} onClick={() => rejectOrder(rejectModalOrder)}><XCircle size={14} /> {actionLoading ? 'Rejecting…' : 'Reject Order'}</button>
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
