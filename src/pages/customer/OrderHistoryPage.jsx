import React, { useState, useEffect } from 'react';
import { Package } from 'lucide-react';
import axiosInstance from '../../services/axiosInstance';

export const OrderHistoryPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axiosInstance.get('/order/orders')
      .then((data) => {
        if (data && data.length > 0) setOrders(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const getStatusBadge = (status) => {
    const key = status.toUpperCase();
    if (key === 'OUT_FOR_DELIVERY') return <span className="status-pill status-out_for_delivery">Out for Delivery</span>;
    if (key === 'DELIVERED') return <span className="status-pill status-delivered">Delivered</span>;
    if (key === 'CONFIRMED') return <span className="status-pill status-confirmed">Confirmed</span>;
    if (key === 'PROCESSING') return <span className="status-pill status-processing">Processing</span>;
    if (key === 'CANCELLED') return <span className="status-pill status-cancelled">Cancelled</span>;
    return <span className="status-pill status-pending">Pending</span>;
  };

  return (
    <div style={{ maxWidth: 1280, margin: '0 auto', padding: '40px 24px 80px' }}>
      <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '2.5rem', color: 'var(--color-primary-dark)', marginBottom: 8 }}>
        My Order History
      </h1>
      <p style={{ color: 'var(--color-muted)', marginBottom: 32 }}>Track active doorstep deliveries and past grocery receipts.</p>

      {loading ? (
        <div style={{ background: '#ffffff', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: 60, textAlign: 'center' }}>
          <p style={{ color: 'var(--color-muted)' }}>Loading your orders...</p>
        </div>
      ) : orders.length === 0 ? (
        <div style={{ background: '#ffffff', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 60, textAlign: 'center' }}>
          <Package size={48} color="var(--color-muted)" style={{ margin: '0 auto 16px' }} />
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.8rem', marginBottom: 8 }}>No Orders Yet</h2>
          <p style={{ color: 'var(--color-muted)' }}>Your order history will appear here once you place your first order.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 20 }}>
          {orders.map((o) => (
            <div
              key={o.id}
              style={{
                background: '#ffffff',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                padding: 24,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                  <span style={{ fontWeight: 800, fontSize: '1.1rem' }}>#{o.id}</span>
                  {getStatusBadge(o.status)}
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--color-muted)' }}>
                  Ordered on {new Date(o.createdAt).toLocaleString()} · {o.itemsCount || 0} items
                </div>
                {o.driverName && (
                  <div style={{ fontSize: '0.85rem', color: 'var(--color-primary)', fontWeight: 600, marginTop: 4 }}>
                    🚚 Driver: {o.driverName} {o.estimatedMinutes ? `(Arriving in ~${o.estimatedMinutes} mins)` : ''}
                  </div>
                )}
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-primary-dark)' }}>
                  ${Number(o.total).toFixed(2)}
                </div>
                <button className="btn btn-outline" style={{ marginTop: 8, fontSize: '0.8rem', padding: '6px 12px' }}>
                  View Receipt
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
