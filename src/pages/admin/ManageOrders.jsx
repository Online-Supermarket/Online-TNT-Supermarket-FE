import React, { useState } from 'react';
import { ShoppingCart } from 'lucide-react';

export const ManageOrders = () => {
  const [orders, setOrders] = useState([]);

  const updateStatus = (id, newStatus) => {
    setOrders(orders.map(o => o.id === id ? { ...o, status: newStatus } : o));
  };

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '2.2rem', color: 'var(--color-primary-dark)' }}>
          Order Management Pipeline
        </h1>
        <p style={{ color: 'var(--color-muted)' }}>Advance order fulfillment workflow statuses from Pending through Delivery.</p>
      </div>

      <div style={{ background: '#ffffff', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: 24, boxShadow: 'var(--shadow-sm)' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Order Ref</th>
              <th>Customer</th>
              <th>Total</th>
              <th>Current Status</th>
              <th>Advance Workflow Status</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: 32, color: 'var(--color-muted)' }}>
                  No orders to display.
                </td>
              </tr>
            ) : orders.map((o) => (
              <tr key={o.id}>
                <td><strong>#{o.id}</strong></td>
                <td>{o.customerName}</td>
                <td><strong>${Number(o.total).toFixed(2)}</strong></td>
                <td>
                  <span className={`status-pill status-${o.status.toLowerCase()}`}>{o.status}</span>
                </td>
                <td>
                  <select
                    value={o.status}
                    onChange={(e) => updateStatus(o.id, e.target.value)}
                    style={{ padding: '6px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', fontWeight: 600 }}
                  >
                    <option value="PENDING">Pending</option>
                    <option value="CONFIRMED">Confirmed</option>
                    <option value="PROCESSING">Processing</option>
                    <option value="OUT_FOR_DELIVERY">Out for Delivery</option>
                    <option value="DELIVERED">Delivered</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
