import React, { useState } from 'react';

export const StaffInventory = () => {
  const [items, setItems] = useState([]);

  const addStock = (id) => {
    setItems(items.map(i => i.id === id ? { ...i, stockQuantity: (i.stockQuantity || 0) + 20 } : i));
  };

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '2.2rem', color: 'var(--color-primary-dark)' }}>
          Inventory Stock Replenishment
        </h1>
        <p style={{ color: 'var(--color-muted)' }}>Staff floor inventory updates.</p>
      </div>

      <div style={{ background: '#ffffff', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: 24 }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Item</th>
              <th>Current Stock</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {items.map(p => (
              <tr key={p.id}>
                <td><strong>{p.name}</strong></td>
                <td>{p.stockQuantity} units</td>
                <td>
                  <button className="btn btn-outline" style={{ padding: '4px 10px', fontSize: '0.8rem' }} onClick={() => addStock(p.id)}>
                    +20 Restock Floor
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
