import React, { useState, useEffect, useCallback } from 'react';
import axiosInstance from '../../services/axiosInstance';
import { RefreshCw } from 'lucide-react';

export const DeliveryHistory = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    try {
      const data = await axiosInstance.get('/order/rider/orders/assigned');
      setHistory(Array.isArray(data) ? data.filter(d => d.status === 'Delivered') : []);
    } catch (err) {
      console.error('Failed to fetch delivery history', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '2.2rem', color: 'var(--color-primary-dark)' }}>
          Past Delivery Logs
        </h1>
        <p style={{ color: 'var(--color-muted)' }}>Chronological record of completed deliveries and customer ratings.</p>
      </div>

      <div style={{ background: '#ffffff', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: 24 }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Order Ref</th>
              <th>Customer Address</th>
              <th>Status</th>
              <th>Completion Time</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} style={{ textAlign: 'center', padding: 32, color: 'var(--color-muted)' }}>
                  <RefreshCw size={20} className="spin" style={{ marginBottom: 8 }} />
                  <div>Loading history...</div>
                </td>
              </tr>
            ) : history.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ textAlign: 'center', padding: 32, color: 'var(--color-muted)' }}>
                  No delivery history to display.
                </td>
              </tr>
            ) : history.map((d) => (
              <tr key={d.id}>
                <td><strong>#{d.id.substring(0, 8).toUpperCase()}</strong></td>
                <td>{d.addressLine || 'Address not provided'}</td>
                <td><span className="status-pill status-delivered">Delivered</span></td>
                <td>{new Date(d.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
