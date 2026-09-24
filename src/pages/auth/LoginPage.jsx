import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth, DEMO_USERS } from '../../context/AuthContext';
import { Leaf, Lock, Mail, ShieldAlert, Package, Truck, User, ArrowLeft } from 'lucide-react';

export const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const loggedUser = await login(email, password);
      const roles = loggedUser.roles || [];

      if (roles.includes('OperationsAdmin') || roles.includes('ADMIN')) {
        navigate('/admin/dashboard');
      } else if (roles.includes('Staff') || roles.includes('STAFF') || roles.includes('CatalogStaff') || roles.includes('InventoryStaff')) {
        navigate('/staff/dashboard');
      } else if (roles.some(r => ['DeliveryDriver', 'DELIVERY', 'Rider', 'Courier', 'Dispatcher'].includes(r))) {
        navigate('/delivery/dashboard');
      } else {
        const from = location.state?.from?.pathname || '/';
        navigate(from);
      }
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoFill = (roleKey) => {
    const demo = DEMO_USERS[roleKey];
    if (demo) {
      setEmail(demo.email);
      setPassword(demo.password);
    }
  };

  return (
    <div className="auth-split-container">
      {/* Left Banner */}
      <div className="auth-banner-side">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ background: 'var(--color-primary)', width: 44, height: 44, borderRadius: 12, display: 'grid', placeItems: 'center', color: '#fff' }}>
            <Leaf size={24} />
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1.4rem', fontWeight: 700 }}>TNT ONLINE</div>
            <div style={{ fontSize: '0.75rem', letterSpacing: '0.1em', opacity: 0.8 }}>SUPERMARKET</div>
          </div>
        </div>

        <div>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '2.5rem', lineHeight: '1.2', marginBottom: 16 }}>
            Freshness redefined, <br />
            delivered happy.
          </h2>
          <p style={{ fontSize: '1.1rem', opacity: 0.9, maxWidth: 460 }}>
            Log in to manage your orders, inspect store analytics, or coordinate local doorstep deliveries.
          </p>
        </div>

        <div style={{ fontSize: '0.85rem', opacity: 0.7 }}>
          © TNT Online Supermarket. All rights reserved.
        </div>
      </div>

      {/* Right Form */}
      <div className="auth-form-side">
        <div className="auth-form-box">
          <Link
            to="/"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              color: 'var(--color-muted)',
              fontSize: '0.875rem',
              fontWeight: 600,
              textDecoration: 'none',
              marginBottom: 20,
              padding: '6px 12px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--color-bg)',
              transition: 'all 0.2s ease',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.color = 'var(--color-primary)';
              e.currentTarget.style.background = 'var(--color-soft-mint)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.color = 'var(--color-muted)';
              e.currentTarget.style.background = 'var(--color-bg)';
            }}
          >
            <ArrowLeft size={16} /> Back to Home
          </Link>

          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '2rem', marginBottom: 8, color: 'var(--color-primary-dark)' }}>
            Welcome Back
          </h1>
          <p style={{ color: 'var(--color-muted)', marginBottom: 24 }}>Please enter your credentials to access your account.</p>

          {/* Quick Demo Autofill Bar */}
          <div style={{ background: 'var(--color-soft-mint)', padding: 16, borderRadius: 'var(--radius-md)', marginBottom: 24 }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-primary)', marginBottom: 10 }}>
              ⚡ Quick Demo Login (Click to Auto-fill):
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <button className="btn btn-outline" style={{ fontSize: '0.75rem', padding: '6px 8px' }} type="button" onClick={() => handleDemoFill('CUSTOMER')}>
                <User size={14} /> Customer
              </button>
              <button className="btn btn-outline" style={{ fontSize: '0.75rem', padding: '6px 8px' }} type="button" onClick={() => handleDemoFill('ADMIN')}>
                <ShieldAlert size={14} /> Admin
              </button>
              <button className="btn btn-outline" style={{ fontSize: '0.75rem', padding: '6px 8px' }} type="button" onClick={() => handleDemoFill('STAFF')}>
                <Package size={14} /> Staff
              </button>
              <button className="btn btn-outline" style={{ fontSize: '0.75rem', padding: '6px 8px' }} type="button" onClick={() => handleDemoFill('DELIVERY')}>
                <Truck size={14} /> Rider / Driver
              </button>
            </div>
          </div>

          {error && (
            <div style={{ background: '#fee2e2', color: '#991b1b', padding: 12, borderRadius: 'var(--radius-sm)', marginBottom: 16, fontSize: '0.875rem' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontWeight: 600, fontSize: '0.875rem', marginBottom: 6 }}>Email Address</label>
              <div style={{ position: 'relative' }}>
                <Mail size={18} style={{ position: 'absolute', left: 12, top: 12, color: 'var(--color-muted)' }} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  required
                  style={{ width: '100%', padding: '12px 14px 12px 40px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', outline: 'none' }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: 600, fontSize: '0.875rem', marginBottom: 6 }}>Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={18} style={{ position: 'absolute', left: 12, top: 12, color: 'var(--color-muted)' }} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  style={{ width: '100%', padding: '12px 14px 12px 40px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', outline: 'none' }}
                />
              </div>
            </div>

            <button className="btn btn-primary" style={{ width: '100%', marginTop: 8 }} disabled={loading}>
              {loading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>

          <p style={{ marginTop: 24, textAlign: 'center', fontSize: '0.9rem', color: 'var(--color-muted)' }}>
            Don't have an account? <Link to="/register" style={{ color: 'var(--color-primary)', fontWeight: 700 }}>Register now</Link>
          </p>
        </div>
      </div>
    </div>
  );
};
