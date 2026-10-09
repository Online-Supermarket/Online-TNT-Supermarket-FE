import React, { useState, useEffect, useCallback } from 'react';
import { Phone, MapPin, Navigation, CheckCircle, RefreshCw } from 'lucide-react';
import axiosInstance from '../../services/axiosInstance';

export const AssignedDeliveries = () => {
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDeliveries = useCallback(async () => {
    setLoading(true);
    try {
      const data = await axiosInstance.get('/order/rider/orders/assigned');
      setDeliveries(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch assigned deliveries', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDeliveries();
  }, [fetchDeliveries]);

  const updateDeliveryStatus = async (id, newStatus) => {
    try {
      if (newStatus === 'OUT_FOR_DELIVERY') {
        await axiosInstance.post(`/order/orders/${id}/start-delivery`);
      } else if (newStatus === 'DELIVERED') {
        await axiosInstance.post(`/order/orders/${id}/deliver`);
      }
      // Optimistic update
      setDeliveries(deliveries.map(d => d.id === id ? { ...d, status: newStatus } : d));
    } catch (err) {
      console.error('Failed to update status', err);
      // Re-fetch to sync with server
      fetchDeliveries();
    }
  };

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '2.2rem', color: 'var(--color-primary-dark)' }}>
          Active Delivery Dispatch List
        </h1>
        <p style={{ color: 'var(--color-muted)' }}>Customer contact info, doorstep address, and fulfillment status controls.</p>
      </div>

      {loading ? (
        <div style={{ padding: 60, textAlign: 'center', color: 'var(--color-muted)' }}>
          <RefreshCw size={32} className="spin" style={{ margin: '0 auto 16px' }} />
          <p>Loading assigned deliveries...</p>
        </div>
      ) : deliveries.length === 0 ? (
        <div style={{ background: '#ffffff', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: 60, textAlign: 'center' }}>
          <Navigation size={48} color="var(--color-muted)" style={{ margin: '0 auto 16px' }} />
          <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.4rem', marginBottom: 8 }}>No Deliveries Assigned</h3>
          <p style={{ color: 'var(--color-muted)' }}>You have no active deliveries at the moment. Check back once an order is dispatched.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 24 }}>
          {deliveries.map((item) => (
            <div
              key={item.id}
              style={{
                background: '#ffffff',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                padding: 24,
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <div>
                  <span style={{ fontWeight: 800, fontSize: '1.2rem' }}>#{item.id}</span>
                  <div style={{ fontSize: '1.1rem', fontWeight: 700, marginTop: 4 }}>{item.customerName}</div>
                </div>
                <span className={`status-pill status-${item.status.toLowerCase()}`}>{item.status}</span>
              </div>

              <div style={{ display: 'grid', gap: 12, marginBottom: 20, fontSize: '0.95rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <MapPin size={18} color="var(--color-primary)" />
                  <strong>{item.addressLine || 'Address not provided'}</strong>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Phone size={18} color="var(--color-primary)" />
                  <a href={`tel:${item.phone}`} style={{ color: 'var(--color-primary)', fontWeight: 700, textDecoration: 'none' }}>
                    {item.phone} (Tap to Call Customer)
                  </a>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--color-border)', paddingTop: 16 }}>
                <div>
                  <span style={{ color: 'var(--color-muted)', fontSize: '0.85rem' }}>Total Package:</span>{' '}
                  <strong>{item.itemsCount} Items (Rs. {item.total.toFixed(2)})</strong>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Update Status:</label>
                  <select
                    value={item.status}
                    onChange={(e) => updateDeliveryStatus(item.id, e.target.value)}
                    style={{ padding: '8px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', fontWeight: 700 }}
                  >
                    <option value="CONFIRMED">Picked Up at Store</option>
                    <option value="OUT_FOR_DELIVERY">Out for Delivery</option>
                    <option value="DELIVERED">Delivered to Doorstep</option>
                    <option value="CANCELLED">Delivery Failed / Attempted</option>
                  </select>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
