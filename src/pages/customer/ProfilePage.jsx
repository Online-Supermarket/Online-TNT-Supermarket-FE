import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { User, Mail, MapPin, ShieldCheck, Camera } from 'lucide-react';

export const ProfilePage = () => {
  const { user } = useAuth();
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    displayName: user?.displayName || 'Sarah Customer',
    email: user?.email || 'customer@marketflow.local',
    phone: '',
    address: '',
  });

  const handleSave = (e) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div style={{ maxWidth: 800, margin: '40px auto', padding: '0 24px 80px' }}>
      <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '2.5rem', color: 'var(--color-primary-dark)', marginBottom: 24 }}>
        Customer Account Settings
      </h1>

      <div style={{ background: '#ffffff', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 36, boxShadow: 'var(--shadow-md)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 32, paddingBottom: 24, borderBottom: '1px solid var(--color-border)' }}>
          <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'var(--color-soft-mint)', display: 'grid', placeItems: 'center', color: 'var(--color-primary)', fontSize: '2rem', position: 'relative' }}>
            <User size={36} />
            <button style={{ position: 'absolute', bottom: 0, right: 0, background: 'var(--color-primary)', color: '#fff', border: 'none', borderRadius: '50%', width: 26, height: 26, display: 'grid', placeItems: 'center', cursor: 'pointer' }}>
              <Camera size={14} />
            </button>
          </div>
          <div>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.5rem' }}>{form.displayName}</h2>
            <p style={{ color: 'var(--color-muted)', fontSize: '0.9rem' }}>Verified Customer Account</p>
          </div>
        </div>

        {saved && (
          <div style={{ background: 'var(--color-soft-mint)', color: 'var(--color-primary)', padding: 12, borderRadius: 'var(--radius-sm)', marginBottom: 20, fontWeight: 600 }}>
            ✓ Account settings updated successfully!
          </div>
        )}

        <form onSubmit={handleSave} style={{ display: 'grid', gap: 20 }}>
          <div>
            <label style={{ display: 'block', fontWeight: 600, fontSize: '0.875rem', marginBottom: 6 }}>Full Name</label>
            <input
              type="text"
              value={form.displayName}
              onChange={(e) => setForm({ ...form, displayName: e.target.value })}
              style={{ width: '100%', padding: '12px 14px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', outline: 'none' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontWeight: 600, fontSize: '0.875rem', marginBottom: 6 }}>Email Address</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              style={{ width: '100%', padding: '12px 14px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', outline: 'none' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontWeight: 600, fontSize: '0.875rem', marginBottom: 6 }}>Phone Number</label>
            <input
              type="text"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              style={{ width: '100%', padding: '12px 14px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', outline: 'none' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontWeight: 600, fontSize: '0.875rem', marginBottom: 6 }}>Default Shipping Address</label>
            <input
              type="text"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              style={{ width: '100%', padding: '12px 14px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', outline: 'none' }}
            />
          </div>

          <button className="btn btn-primary" style={{ marginTop: 8 }}>Save Changes</button>
        </form>
      </div>
    </div>
  );
};
