import React, { useState, useEffect, useCallback } from 'react';
import {
  ClipboardList, RefreshCw, AlertCircle, PackageCheck,
  Clock, CheckCircle, XCircle, Truck, Ban, ChevronDown, ChevronUp,
  ShoppingBag, DollarSign, Calendar, User
} from 'lucide-react';
import axiosInstance from '../../services/axiosInstance';

/* ─── Order status config ────────────────────────────────────────────── */
const STATUS_CONFIG = {
  PendingReservation: { label: 'Pending',      color: '#f59e0b', bg: '#fef3c7', icon: Clock        },
  Confirmed:          { label: 'Confirmed',    color: '#2563eb', bg: '#dbeafe', icon: CheckCircle   },
  CancellationPending:{ label: 'Cancelling…',  color: '#7c3aed', bg: '#ede9fe', icon: Clock        },
  Cancelled:          { label: 'Cancelled',    color: '#dc2626', bg: '#fee2e2', icon: XCircle       },
  Rejected:           { label: 'Rejected',     color: '#6b7280', bg: '#f3f4f6', icon: Ban           },
  Delivered:          { label: 'Delivered',    color: '#16a34a', bg: '#dcfce7', icon: Truck         },
};

const PIPELINE_STEPS = ['PendingReservation', 'Confirmed', 'Delivered'];

const STATUS_ORDER = ['PendingReservation', 'Confirmed', 'CancellationPending', 'Cancelled', 'Rejected', 'Delivered'];

function StatusPill({ status }) {
  const cfg = STATUS_CONFIG[status] || { label: status, color: '#6b7280', bg: '#f3f4f6', icon: Clock };
  const Icon = cfg.icon;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      background: cfg.bg, color: cfg.color,
      padding: '4px 10px', borderRadius: 20,
      fontSize: '0.78rem', fontWeight: 700, whiteSpace: 'nowrap',
    }}>
      <Icon size={12} /> {cfg.label}
    </span>
  );
}

function PipelineBar({ status }) {
  const activeStep = PIPELINE_STEPS.indexOf(status);
  const isTerminal = status === 'Cancelled' || status === 'Rejected';

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0, margin: '8px 0 2px' }}>
      {PIPELINE_STEPS.map((step, i) => {
        const cfg = STATUS_CONFIG[step];
        const done   = !isTerminal && activeStep > i;
        const active = !isTerminal && activeStep === i;
        const lineColor = done ? '#16a34a' : '#e5e7eb';
        return (
          <React.Fragment key={step}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 64 }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%',
                background: done ? '#16a34a' : active ? (isTerminal ? '#dc2626' : STATUS_CONFIG[status]?.bg || '#dbeafe') : '#f3f4f6',
                border: `2px solid ${done ? '#16a34a' : active ? (isTerminal ? '#dc2626' : STATUS_CONFIG[status]?.color || '#2563eb') : '#d1d5db'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: done ? '#fff' : active ? (isTerminal ? '#dc2626' : STATUS_CONFIG[status]?.color || '#2563eb') : '#9ca3af',
                fontSize: '0.7rem', fontWeight: 800, transition: 'all 0.2s',
              }}>
                {done ? <CheckCircle size={14} /> : <span>{i + 1}</span>}
              </div>
              <span style={{ fontSize: '0.65rem', color: done || active ? '#374151' : '#9ca3af', fontWeight: 600, marginTop: 2, textAlign: 'center' }}>
                {cfg.label}
              </span>
            </div>
            {i < PIPELINE_STEPS.length - 1 && (
              <div style={{ flex: 1, height: 2, background: lineColor, minWidth: 16, marginBottom: 14, transition: 'background 0.3s' }} />
            )}
          </React.Fragment>
        );
      })}
      {isTerminal && (
        <div style={{ marginLeft: 12, display: 'flex', alignItems: 'center', gap: 4, color: '#dc2626', fontSize: '0.75rem', fontWeight: 700 }}>
          <XCircle size={14} /> {STATUS_CONFIG[status]?.label || status}
        </div>
      )}
    </div>
  );
}

function OrderRow({ order, onCancel, cancelling }) {
  const [expanded, setExpanded] = useState(false);
  const [reason, setReason] = useState('');
  const [showCancel, setShowCancel] = useState(false);

  const canCancel = order.status === 'Confirmed';
  const createdAt = new Date(order.createdAt);

  return (
    <div style={{
      background: '#fff', border: '1px solid var(--color-border)',
      borderRadius: 'var(--radius-md)', marginBottom: 12,
      boxShadow: 'var(--shadow-sm)',
      transition: 'box-shadow 0.2s',
    }}
      onMouseEnter={e => e.currentTarget.style.boxShadow = 'var(--shadow-md)'}
      onMouseLeave={e => e.currentTarget.style.boxShadow = 'var(--shadow-sm)'}
    >
      {/* ── Row Header ── */}
      <div
        style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 20px', cursor: 'pointer' }}
        onClick={() => setExpanded(e => !e)}
      >
        {/* Order ID */}
        <div style={{ minWidth: 120 }}>
          <div style={{ fontSize: '0.68rem', color: 'var(--color-muted)', fontWeight: 700, letterSpacing: '0.05em' }}>ORDER ID</div>
          <div style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: '0.85rem', color: 'var(--color-primary-dark)' }}>
            #{order.id.slice(0, 8).toUpperCase()}
          </div>
        </div>

        {/* Customer */}
        <div style={{ minWidth: 140, flex: 1 }}>
          <div style={{ fontSize: '0.68rem', color: 'var(--color-muted)', fontWeight: 700 }}>CUSTOMER ID</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#374151', fontSize: '0.82rem', fontWeight: 600 }}>
            <User size={12} /> {order.customerId?.slice(0, 8).toUpperCase() || '—'}…
          </div>
        </div>

        {/* Pipeline bar */}
        <div style={{ flex: 2 }}>
          <PipelineBar status={order.status} />
        </div>

        {/* Total */}
        <div style={{ minWidth: 90, textAlign: 'right' }}>
          <div style={{ fontSize: '0.68rem', color: 'var(--color-muted)', fontWeight: 700 }}>TOTAL</div>
          <div style={{ fontWeight: 800, color: 'var(--color-primary-dark)', fontSize: '1rem' }}>
            ${Number(order.total).toFixed(2)}
          </div>
        </div>

        {/* Date */}
        <div style={{ minWidth: 100, textAlign: 'right' }}>
          <div style={{ fontSize: '0.68rem', color: 'var(--color-muted)', fontWeight: 700 }}>PLACED</div>
          <div style={{ fontSize: '0.78rem', color: '#374151' }}>
            {createdAt.toLocaleDateString()}<br />
            <span style={{ color: 'var(--color-muted)' }}>{createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        </div>

        {/* Expand icon */}
        <div style={{ color: 'var(--color-muted)', marginLeft: 8 }}>
          {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </div>
      </div>

      {/* ── Expanded Detail ── */}
      {expanded && (
        <div style={{ borderTop: '1px solid var(--color-border)', padding: '16px 20px', background: '#fafafa', borderRadius: '0 0 var(--radius-md) var(--radius-md)' }}>
          <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap', marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--color-muted)', fontWeight: 700, marginBottom: 2 }}>STATUS</div>
              <StatusPill status={order.status} />
            </div>
            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--color-muted)', fontWeight: 700, marginBottom: 2 }}>SUBTOTAL</div>
              <span style={{ fontWeight: 700 }}>${Number(order.subtotal ?? order.total).toFixed(2)}</span>
            </div>
            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--color-muted)', fontWeight: 700, marginBottom: 2 }}>FULL ORDER ID</div>
              <span style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{order.id}</span>
            </div>
          </div>

          {/* Cancel Panel */}
          {canCancel && (
            <div style={{ marginTop: 8 }}>
              {!showCancel ? (
                <button
                  className="btn btn-outline"
                  style={{ borderColor: '#dc2626', color: '#dc2626', fontSize: '0.8rem', padding: '6px 14px' }}
                  onClick={e => { e.stopPropagation(); setShowCancel(true); }}
                >
                  <XCircle size={14} /> Cancel Order
                </button>
              ) : (
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}
                  onClick={e => e.stopPropagation()}>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Cancellation reason (required)"
                    value={reason}
                    onChange={e => setReason(e.target.value)}
                    style={{ flex: 1, minWidth: 220 }}
                  />
                  <button
                    className="btn btn-primary"
                    style={{ background: '#dc2626', borderColor: '#dc2626', fontSize: '0.8rem', padding: '6px 14px' }}
                    disabled={cancelling || !reason.trim()}
                    onClick={() => onCancel(order.id, reason.trim())}
                  >
                    {cancelling ? <RefreshCw size={13} className="spin" /> : <XCircle size={13} />} Confirm Cancel
                  </button>
                  <button
                    className="btn btn-outline"
                    style={{ fontSize: '0.8rem', padding: '6px 12px' }}
                    onClick={() => { setShowCancel(false); setReason(''); }}
                  >
                    Keep
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── KPI cards ─────────────────────────────────────────────────────── */
function KpiCard({ icon: Icon, label, value, iconBg, iconColor }) {
  return (
    <div className="kpi-card">
      <div className="kpi-icon" style={{ background: iconBg, color: iconColor }}><Icon size={22} /></div>
      <div>
        <div style={{ fontSize: '0.75rem', color: 'var(--color-muted)', fontWeight: 700, letterSpacing: '0.05em' }}>{label}</div>
        <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--color-primary-dark)' }}>{value}</div>
      </div>
    </div>
  );
}

/* ─── Main Page ──────────────────────────────────────────────────────── */
export const StaffOrders = () => {
  const [orders, setOrders]         = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');
  const [cancelling, setCancelling] = useState(null); // orderId being cancelled
  const [toast, setToast]           = useState('');
  const [filter, setFilter]         = useState('ALL');

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await axiosInstance.get('/order/staff/orders');
      const list = Array.isArray(data) ? data : (data?.items || []);
      // sort newest first
      setOrders(list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
    } catch (err) {
      setError(err.message || 'Could not load orders. Check that the Order API is running.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const handleCancel = async (orderId, reason) => {
    setCancelling(orderId);
    try {
      await axiosInstance.post(`/order/staff/orders/${orderId}/cancel`, { reason });
      showToast('Order cancelled successfully.');
      fetchOrders();
    } catch (err) {
      showToast(`Cancel failed: ${err.message}`);
    } finally {
      setCancelling(null);
    }
  };

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 4000);
  };

  /* KPI counts */
  const counts = {
    total:     orders.length,
    confirmed: orders.filter(o => o.status === 'Confirmed').length,
    pending:   orders.filter(o => o.status === 'PendingReservation').length,
    cancelled: orders.filter(o => o.status === 'Cancelled' || o.status === 'Rejected').length,
  };

  const filtered = filter === 'ALL' ? orders : orders.filter(o => o.status === filter);

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>

      {/* ── Toast ── */}
      {toast && (
        <div style={{
          position: 'fixed', top: 24, right: 24, zIndex: 9999,
          background: 'var(--color-primary-dark)', color: '#fff',
          padding: '12px 20px', borderRadius: 'var(--radius-md)',
          boxShadow: 'var(--shadow-lg)', fontWeight: 600, fontSize: '0.9rem',
          animation: 'fadeIn 0.2s ease',
        }}>
          {toast}
        </div>
      )}

      {/* ── Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <ClipboardList size={28} style={{ color: 'var(--color-primary)' }} />
            <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '2.2rem', color: 'var(--color-primary-dark)', margin: 0 }}>
              Order Management Pipeline
            </h1>
          </div>
          <p style={{ color: 'var(--color-muted)', margin: 0 }}>
            Live view of all customer orders — track status, pipeline stage, and manage cancellations.
          </p>
        </div>
        <button className="btn btn-outline" onClick={fetchOrders} disabled={loading} style={{ marginTop: 4 }}>
          <RefreshCw size={15} className={loading ? 'spin' : ''} /> Refresh
        </button>
      </div>

      {/* ── KPI Cards ── */}
      <div className="kpi-grid" style={{ marginBottom: 24 }}>
        <KpiCard icon={ShoppingBag}   label="TOTAL ORDERS"     value={loading ? '—' : counts.total}     iconBg="#dbeafe" iconColor="#1e40af" />
        <KpiCard icon={CheckCircle}   label="CONFIRMED"        value={loading ? '—' : counts.confirmed} iconBg="#dcfce7" iconColor="#166534" />
        <KpiCard icon={Clock}         label="PENDING"          value={loading ? '—' : counts.pending}   iconBg="#fef3c7" iconColor="#92400e" />
        <KpiCard icon={XCircle}       label="CANCELLED/REJECT" value={loading ? '—' : counts.cancelled} iconBg="#fee2e2" iconColor="#dc2626" />
      </div>

      {/* ── Error ── */}
      {error && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', padding: '12px 16px', borderRadius: 'var(--radius-md)', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
          <AlertCircle size={18} /> <span>{error}</span>
        </div>
      )}

      {/* ── Filter Tabs ── */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {['ALL', ...STATUS_ORDER].map(s => {
          const cfg = s === 'ALL' ? { label: 'All Orders', color: '#374151', bg: '#f3f4f6' } : STATUS_CONFIG[s] || { label: s, color: '#6b7280', bg: '#f3f4f6' };
          const count = s === 'ALL' ? counts.total : orders.filter(o => o.status === s).length;
          return (
            <button
              key={s}
              onClick={() => setFilter(s)}
              style={{
                padding: '6px 14px', borderRadius: 20, fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer',
                border: `2px solid ${filter === s ? cfg.color : '#e5e7eb'}`,
                background: filter === s ? cfg.bg : '#fff',
                color: filter === s ? cfg.color : '#6b7280',
                transition: 'all 0.15s',
              }}
            >
              {cfg.label} {count > 0 && <span style={{ opacity: 0.7 }}>({count})</span>}
            </button>
          );
        })}
      </div>

      {/* ── Orders List ── */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 48, color: 'var(--color-muted)' }}>
          <RefreshCw size={28} className="spin" style={{ marginBottom: 12 }} />
          <div style={{ fontWeight: 600 }}>Loading orders…</div>
        </div>
      ) : filtered.length === 0 ? (
        <div style={{
          background: '#fff', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)',
          padding: 48, textAlign: 'center', color: 'var(--color-muted)',
        }}>
          <PackageCheck size={40} style={{ marginBottom: 12, opacity: 0.4 }} />
          <div style={{ fontWeight: 700, fontSize: '1.05rem', marginBottom: 4 }}>No orders found</div>
          <div style={{ fontSize: '0.85rem' }}>
            {filter === 'ALL' ? 'No orders have been placed yet.' : `No orders with status "${STATUS_CONFIG[filter]?.label || filter}".`}
          </div>
        </div>
      ) : (
        <div>
          {filtered.map(order => (
            <OrderRow
              key={order.id}
              order={order}
              onCancel={handleCancel}
              cancelling={cancelling === order.id}
            />
          ))}
        </div>
      )}
    </div>
  );
};
