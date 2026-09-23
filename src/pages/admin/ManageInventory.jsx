import React, { useState } from 'react';
import { Warehouse, RefreshCw } from 'lucide-react';

export const ManageInventory = () => {
  const [stock, setStock] = useState([]);

  const handleStockChange = (id, delta) => {
    setStock(stock.map(s => s.id === id ? { ...s, stockQuantity: Math.max(0, (s.stockQuantity || 0) + delta) } : s));
  };

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '2.2rem', color: 'var(--color-primary-dark)' }}>
          Inventory Stock Replenishment
        </h1>
        <p style={{ color: 'var(--color-muted)' }}>Monitor shelf thresholds and perform quick batch stock additions.</p>
      </div>

      <div style={{ background: '#ffffff', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: 24, boxShadow: 'var(--shadow-sm)' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>SKU / Product</th>
              <th>Category</th>
              <th>Current Stock</th>
              <th>Status</th>
              <th>Quick Restock</th>
            </tr>
          </thead>
          <tbody>
            {stock.map((item) => (
              <tr key={item.id}>
                <td><strong>{item.name}</strong></td>
                <td>{item.category?.name || item.category}</td>
                <td><strong style={{ fontSize: '1.1rem' }}>{item.stockQuantity}</strong> units</td>
                <td>
                  {item.stockQuantity < 15 ? (
                    <span className="status-pill status-cancelled">Low Stock Alert</span>
                  ) : (
                    <span className="status-pill status-delivered">Optimal</span>
                  )}
                </td>
                <td>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn btn-outline" style={{ padding: '4px 10px', fontSize: '0.8rem' }} onClick={() => handleStockChange(item.id, +10)}>+10 Units</button>
                    <button className="btn btn-outline" style={{ padding: '4px 10px', fontSize: '0.8rem' }} onClick={() => handleStockChange(item.id, +50)}>+50 Restock</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
