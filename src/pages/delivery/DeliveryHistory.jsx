import React from 'react';

export const DeliveryHistory = () => {
  const history = [];

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
            {history.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ textAlign: 'center', padding: 32, color: 'var(--color-muted)' }}>
                  No delivery history to display.
                </td>
              </tr>
            ) : history.map((d) => (
              <tr key={d.id}>
                <td><strong>#{d.id}</strong></td>
                <td>{d.address}</td>
                <td><span className="status-pill status-delivered">Delivered</span></td>
                <td>{d.completionTime}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
