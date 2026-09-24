import React, { useState } from 'react';
import { Tag, Plus } from 'lucide-react';

export const ManageOffers = () => {
  const [offers, setOffers] = useState([]);

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '2.2rem', color: 'var(--color-primary-dark)' }}>
          Promotional Banners & Deals
        </h1>
        <p style={{ color: 'var(--color-muted)' }}>Configure active discounts, coupon codes, and harvest bundles.</p>
      </div>

      <div style={{ background: '#ffffff', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: 24, boxShadow: 'var(--shadow-sm)' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Offer Title</th>
              <th>Category</th>
              <th>Promo Price</th>
              <th>Badge Label</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {offers.map(o => (
              <tr key={o.id}>
                <td><strong>{o.name}</strong></td>
                <td>{o.category}</td>
                <td><strong>Rs. {o.price.toFixed(2)}</strong> (was Rs. {o.originalPrice.toFixed(2)})</td>
                <td><span className="product-card-badge" style={{ position: 'static' }}>{o.discountBadge}</span></td>
                <td><span className="status-pill status-delivered">Active Promo</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
