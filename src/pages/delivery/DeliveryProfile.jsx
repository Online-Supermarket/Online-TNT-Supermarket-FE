import React from 'react';
import { Truck, ShieldCheck, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const DeliveryProfile = () => {
  const { user } = useAuth();

  return (
    <div style={{ maxWidth: 700, margin: '0 auto' }}>
      <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '2.2rem', color: 'var(--color-primary-dark)', marginBottom: 24 }}>
        Driver Profile & Vehicle Specs
      </h1>

      <div style={{ background: '#ffffff', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 32, boxShadow: 'var(--shadow-md)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 24, paddingBottom: 20, borderBottom: '1px solid var(--color-border)' }}>
          <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'var(--color-soft-mint)', display: 'grid', placeItems: 'center', color: 'var(--color-primary)' }}>
            <User size={36} />
          </div>
          <div>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.4rem' }}>{user?.displayName || 'Dave Driver'}</h2>
            <p style={{ color: 'var(--color-muted)', fontSize: '0.9rem' }}>TNT Certified Express Courier</p>
          </div>
        </div>

        <div style={{ display: 'grid', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', color: 'var(--color-muted)' }}>Assigned Vehicle</label>
            <div style={{ fontWeight: 700, fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
              <Truck size={18} color="var(--color-primary)" /> —
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', color: 'var(--color-muted)' }}>Driver License ID</label>
            <div style={{ fontWeight: 700, fontSize: '1.05rem', marginTop: 4 }}>—</div>
          </div>

          <div>
            <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', color: 'var(--color-muted)' }}>Fulfillment Rating</label>
            <div style={{ fontWeight: 700, fontSize: '1.05rem', marginTop: 4 }}>—</div>
          </div>
        </div>
      </div>
    </div>
  );
};
