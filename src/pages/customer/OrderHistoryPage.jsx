import React, { useCallback, useEffect, useState } from 'react';
import { Building2, Banknote, CheckCircle, Clock, Download, FileText, Package, XCircle, AlertCircle } from 'lucide-react';
import axiosInstance from '../../services/axiosInstance';

export const OrderHistoryPage = () => {
  const [orders, setOrders] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [downloadingReceipt, setDownloadingReceipt] = useState(false);
  const [pollingEnabled, setPollingEnabled] = useState(true);

  const load = useCallback(async () => {
    setError('');
    try {
      const data = await axiosInstance.get('/order/orders/my');
      setOrders(Array.isArray(data) ? data : []);
      setPollingEnabled(true);
    } catch (err) {
      setError(err.message || 'Unable to load orders.');
      // Do not hammer a failing order endpoint every five seconds. The order is already
      // persisted; the customer can retry explicitly by reloading the page.
      setPollingEnabled(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    if (!pollingEnabled) return undefined;
    const timer = window.setInterval(load, 5000);
    return () => window.clearInterval(timer);
  }, [load, pollingEnabled]);

  const open = async (id) => {
    setError('');
    try {
      const details = await axiosInstance.get(`/order/orders/${id}`);
      setSelected(details);
    } catch (err) {
      setError(err.message || 'Unable to load order details.');
    }
  };

  useEffect(() => {
    if (!selected?.id) return undefined;
    const timer = window.setInterval(async () => {
      try {
        const refreshed = await axiosInstance.get(`/order/orders/${selected.id}`);
        setSelected(refreshed);
      } catch {
        /* Keep existing view */
      }
    }, 5000);
    return () => window.clearInterval(timer);
  }, [selected?.id]);

  const cancel = async () => {
    if (!selected) return;
    setCancelling(true);
    try {
      await axiosInstance.post(`/order/orders/${selected.id}/cancel`, { reason: 'Cancelled by customer' });
      await load();
      await open(selected.id);
    } catch (err) {
      setError(err.message || 'Unable to cancel this order.');
    } finally {
      setCancelling(false);
    }
  };

  const downloadReceipt = async (orderId, fileName) => {
    setDownloadingReceipt(true);
    try {
      const response = await axiosInstance.get(`/order/orders/${orderId}/payment/receipt`, {
        responseType: 'blob',
      });
      const blob = new Blob([response], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName || `receipt-${orderId}.pdf`;
      document.body.appendChild(link);
      link.click();
      window.setTimeout(() => {
        link.remove();
        URL.revokeObjectURL(url);
      }, 0);
    } catch (err) {
      setError(err.message || 'Unable to download payment receipt.');
    } finally {
      setDownloadingReceipt(false);
    }
  };

  const badge = (status) => (
    <span className={`status-pill status-${String(status || 'pending').toLowerCase()}`}>
      {status}
    </span>
  );

  const paymentBadge = (method, status) => {
    if (method === 'BankTransfer') {
      if (status === 'Verified') {
        return <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#dcfce7', color: '#15803d', border: '1px solid #bbf7d0', padding: '2px 8px', borderRadius: 12, fontSize: '0.78rem', fontWeight: 600 }}><CheckCircle size={12} /> Bank Transfer · Verified</span>;
      }
      if (status === 'Rejected') {
        return <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#fee2e2', color: '#b91c1c', border: '1px solid #fecaca', padding: '2px 8px', borderRadius: 12, fontSize: '0.78rem', fontWeight: 600 }}><XCircle size={12} /> Bank Transfer · Rejected</span>;
      }
      return <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#fef3c7', color: '#b45309', border: '1px solid #fde68a', padding: '2px 8px', borderRadius: 12, fontSize: '0.78rem', fontWeight: 600 }}><Clock size={12} /> Bank Transfer · Pending Review</span>;
    }
    return <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#f3f4f6', color: '#4b5563', border: '1px solid #e5e7eb', padding: '2px 8px', borderRadius: 12, fontSize: '0.78rem', fontWeight: 600 }}><Banknote size={12} /> Cash on Delivery</span>;
  };

  return (
    <div style={{ maxWidth: 1280, margin: '0 auto', padding: '40px 24px 80px' }}>
      <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '2.5rem', color: 'var(--color-primary-dark)', marginBottom: 8 }}>
        My Order History
      </h1>
      <p style={{ color: 'var(--color-muted)', marginBottom: 32 }}>
        Track active deliveries, monitor payment status, and review order details.
      </p>

      {error && <div role="alert" style={{ color: '#b91c1c', background: '#fee2e2', border: '1px solid #fecaca', padding: '12px 16px', borderRadius: 8, marginBottom: 16 }}>{error}</div>}

      {loading ? (
        <div>Loading your orders…</div>
      ) : orders.length === 0 ? (
        <div style={{ background: '#fff', padding: 60, textAlign: 'center', borderRadius: 12, border: '1px solid var(--color-border)' }}>
          <Package size={48} color="var(--color-muted)" style={{ margin: '0 auto 16px' }} />
          <h2>No Orders Yet</h2>
          <p style={{ color: 'var(--color-muted)' }}>Your order history will appear here after checkout.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 16 }}>
          {orders.map((order) => (
            <div
              key={order.id}
              style={{
                background: '#fff',
                border: '1px solid var(--color-border)',
                borderRadius: 10,
                padding: 22,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 16,
              }}
            >
              <div>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                  <strong>#{order.id}</strong>
                  {badge(order.status)}
                  {paymentBadge(order.paymentMethod, order.paymentStatus)}
                </div>
                <div style={{ color: 'var(--color-muted)', marginTop: 8, fontSize: '0.92rem' }}>
                  {new Date(order.createdAt).toLocaleString()} · {order.itemCount || 0} items
                </div>
                <div style={{ color: 'var(--color-muted)', fontSize: '0.88rem', marginTop: 4 }}>
                  {order.address?.recipientName ? `${order.address.recipientName} — ` : ''}{order.address?.line1}, {order.address?.city}
                </div>
                {order.paymentMethod === 'BankTransfer' && order.paymentStatus === 'Rejected' && order.rejectionReason && (
                  <div style={{ color: '#b91c1c', fontSize: '0.85rem', marginTop: 6, fontWeight: 500 }}>
                    Reason for payment rejection: {order.rejectionReason}
                  </div>
                )}
              </div>
              <div style={{ textAlign: 'right' }}>
                <strong style={{ fontSize: '1.3rem', color: 'var(--color-primary-dark)' }}>
                  {order.currency || 'Rs.'} {Number(order.total || 0).toFixed(2)}
                </strong>
                <br />
                <button className="btn btn-outline" style={{ marginTop: 8 }} onClick={() => open(order.id)}>
                  View Details
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {selected && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)', display: 'grid', placeItems: 'center', padding: 20, zIndex: 1000 }}>
          <div style={{ background: '#fff', borderRadius: 12, padding: 28, maxWidth: 680, width: '100%', maxHeight: '85vh', overflow: 'auto', boxShadow: '0 8px 24px rgba(0,0,0,0.15)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--color-border)', paddingBottom: 16, marginBottom: 16 }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.4rem' }}>Order #{selected.id}</h2>
                <div style={{ color: 'var(--color-muted)', fontSize: '0.88rem', marginTop: 4 }}>
                  Placed on {new Date(selected.createdAt).toLocaleString()}
                </div>
              </div>
              <button className="btn btn-ghost" onClick={() => setSelected(null)}>Close</button>
            </div>

            <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', marginBottom: 16 }}>
              <span>Status: {badge(selected.status)}</span>
              <span>Payment: {paymentBadge(selected.paymentMethod, selected.paymentStatus)}</span>
            </div>

            {/* Bank Transfer specific status info */}
            {selected.paymentMethod === 'BankTransfer' && (
              <div style={{ background: selected.paymentStatus === 'Verified' ? '#ecfdf5' : selected.paymentStatus === 'Rejected' ? '#fef2f2' : '#fffbeb', border: `1px solid ${selected.paymentStatus === 'Verified' ? '#a7f3d0' : selected.paymentStatus === 'Rejected' ? '#fecaca' : '#fde68a'}`, borderRadius: 8, padding: 14, marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                  <div>
                    <strong style={{ fontSize: '0.92rem', color: selected.paymentStatus === 'Verified' ? '#065f46' : selected.paymentStatus === 'Rejected' ? '#991b1b' : '#92400e' }}>
                      {selected.paymentStatus === 'Verified' ? 'Payment Verified' : selected.paymentStatus === 'Rejected' ? 'Payment Receipt Rejected' : 'Payment Verification Pending'}
                    </strong>
                    <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'var(--color-muted)' }}>
                      {selected.paymentStatus === 'Verified'
                        ? 'Your payment was successfully verified by our staff.'
                        : selected.paymentStatus === 'Rejected'
                        ? `Reason: ${selected.rejectionReason || 'Receipt was invalid or unreadable.'}`
                        : 'Your receipt is currently being verified by our operations team before order confirmation.'}
                    </p>
                  </div>
                  {selected.receiptFileName && (
                    <button
                      className="btn btn-outline"
                      style={{ fontSize: '0.82rem', padding: '6px 12px' }}
                      disabled={downloadingReceipt}
                      onClick={() => downloadReceipt(selected.id, selected.receiptFileName)}
                    >
                      <Download size={14} /> {downloadingReceipt ? 'Loading…' : 'My Receipt'}
                    </button>
                  )}
                </div>
              </div>
            )}

            <h3 style={{ fontSize: '1.1rem', marginBottom: 10 }}>Delivery Address</h3>
            <div style={{ background: '#f8fafc', padding: 12, borderRadius: 8, fontSize: '0.9rem', marginBottom: 16 }}>
              <strong>{selected.address?.recipientName}</strong><br />
              {selected.address?.line1}{selected.address?.line2 ? `, ${selected.address.line2}` : ''}, {selected.address?.city} ({selected.address?.zone})<br />
              Phone: {selected.address?.phone}
            </div>

            <h3 style={{ fontSize: '1.1rem', marginBottom: 10 }}>Order Items</h3>
            <div style={{ borderTop: '1px solid var(--color-border)', borderBottom: '1px solid var(--color-border)', padding: '8px 0', marginBottom: 16 }}>
              {selected.items?.map((item) => (
                <div key={item.productId} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
                  <span>{item.name} × {item.quantity}</span>
                  <strong>{selected.currency} {Number(item.lineTotal).toFixed(2)}</strong>
                </div>
              ))}
              <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px dashed var(--color-border)', display: 'grid', gap: 4, textAlign: 'right', fontSize: '0.9rem' }}>
                <div>Subtotal: {selected.currency} {Number(selected.subtotal).toFixed(2)}</div>
                <div>Delivery Fee: {selected.currency} {Number(selected.deliveryFee).toFixed(2)}</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-primary-dark)' }}>
                  Total: {selected.currency} {Number(selected.total).toFixed(2)}
                </div>
              </div>
            </div>

            <h3 style={{ fontSize: '1.1rem', marginBottom: 10 }}>Status History</h3>
            <div style={{ marginBottom: 20 }}>
              {selected.statusHistory?.map((entry, index) => (
                <div key={`${entry.changedAt}-${index}`} style={{ padding: '6px 0', color: 'var(--color-muted)', fontSize: '0.88rem' }}>
                  {new Date(entry.changedAt).toLocaleString()} — <strong>{entry.status}</strong>{entry.reason ? ` (${entry.reason})` : ''}
                </div>
              ))}
            </div>

            {selected.status === 'Pending' && <button className="btn btn-outline" disabled={cancelling} onClick={cancel} style={{ color: '#b91c1c', borderColor: '#fca5a5' }}>{cancelling ? 'Cancelling…' : 'Cancel Order'}</button>}
          </div>
        </div>
      )}
    </div>
  );
};
