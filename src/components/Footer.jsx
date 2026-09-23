import React from 'react';
import { Leaf, Phone, Mail, MapPin, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Footer = () => {
  return (
    <footer style={{ background: 'var(--color-primary-dark)', color: '#ffffff', paddingTop: '60px', paddingBottom: '30px' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 24px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '40px' }}>
        <div>
          <div className="brand-logo" style={{ marginBottom: '16px', color: '#ffffff' }}>
            <div className="brand-badge" style={{ background: 'var(--color-primary)' }}>
              <Leaf size={24} />
            </div>
            <div className="brand-text">
              <span className="brand-title" style={{ color: '#ffffff' }}>TNT ONLINE</span>
              <span className="brand-subtitle" style={{ color: 'var(--color-soft-mint)' }}>SUPERMARKET</span>
            </div>
          </div>
          <p style={{ color: 'var(--color-soft-mint)', fontSize: '0.9rem', lineHeight: '1.6' }}>
            From farm-fresh produce to everyday essentials, experience luxury grocery shopping delivered to your door with care.
          </p>
        </div>

        <div>
          <h4 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.2rem', marginBottom: '16px', color: '#ffffff' }}>Quick Links</h4>
          <ul style={{ listStyle: 'none', display: 'grid', gap: '10px', fontSize: '0.9rem' }}>
            <li><Link to="/categories" style={{ color: 'var(--color-soft-mint)', textDecoration: 'none' }}>Shop All Products</Link></li>
            <li><Link to="/offers" style={{ color: 'var(--color-soft-mint)', textDecoration: 'none' }}>Weekly Offers</Link></li>
            <li><Link to="/about" style={{ color: 'var(--color-soft-mint)', textDecoration: 'none' }}>Our Farm Story</Link></li>
            <li><Link to="/contact" style={{ color: 'var(--color-soft-mint)', textDecoration: 'none' }}>Customer Support</Link></li>
          </ul>
        </div>



        <div>
          <h4 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.2rem', marginBottom: '16px', color: '#ffffff' }}>Contact Us</h4>
          <div style={{ display: 'grid', gap: '12px', fontSize: '0.9rem', color: 'var(--color-soft-mint)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><MapPin size={16} /> 100 Market St, Fresh City, FC 90210</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><Phone size={16} /> +1 (800) 868-3737</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><Mail size={16} /> support@tntmarket.local</div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '1280px', margin: '40px auto 0', padding: '24px 24px 0', borderTop: '1px solid rgba(255,255,255,0.1)', textAlign: 'center', fontSize: '0.85rem', color: 'var(--color-soft-mint)' }}>
        © {new Date().getFullYear()} TNT Online Supermarket. Built with <Heart size={14} style={{ display: 'inline', color: '#ef4444' }} /> for fresh, happy homes.
      </div>
    </footer>
  );
};
