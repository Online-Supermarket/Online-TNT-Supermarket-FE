import React, { useState, useEffect } from 'react';
import { Tag } from 'lucide-react';
import { ProductCard } from '../../components/ProductCard';
import axiosInstance from '../../services/axiosInstance';

export const OffersPage = () => {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axiosInstance.get('/catalog/offers')
      .then((data) => {
        if (data && data.length > 0) setOffers(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ maxWidth: 1280, margin: '0 auto', padding: '40px 24px 80px' }}>
      <div style={{ background: 'var(--color-primary-dark)', borderRadius: 'var(--radius-lg)', padding: 48, color: '#ffffff', marginBottom: 48, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'relative', zIndex: 2 }}>
          <div className="kicker-badge" style={{ background: 'rgba(255,255,255,0.15)', color: '#ffffff' }}>
            <Tag size={16} /> WEEKLY HARVEST PROMOTIONS
          </div>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '3rem', margin: '16px 0' }}>
            Exclusive Deals &amp; Bundles
          </h1>
          <p style={{ fontSize: '1.1rem', color: 'var(--color-soft-mint)', maxWidth: 540 }}>
            Save up to 35% on fresh seasonal farm picks, artisanal baking bundles, and cold-pressed organic juices.
          </p>
        </div>
      </div>

      <h2 className="section-title">Active Promotional Offers</h2>
      {loading ? (
        <div style={{ background: '#ffffff', borderRadius: 'var(--radius-md)', padding: 60, textAlign: 'center', border: '1px solid var(--color-border)' }}>
          <p style={{ color: 'var(--color-muted)' }}>Loading offers...</p>
        </div>
      ) : offers.length > 0 ? (
        <div className="products-grid">
          {offers.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      ) : (
        <div style={{ background: '#ffffff', borderRadius: 'var(--radius-md)', padding: 60, textAlign: 'center', border: '1px solid var(--color-border)' }}>
          <p style={{ color: 'var(--color-muted)', fontSize: '1.05rem' }}>No active promotions at the moment. Check back soon!</p>
        </div>
      )}
    </div>
  );
};
