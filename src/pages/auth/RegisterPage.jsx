import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Leaf, Lock, Mail, User, Phone, MapPin, CreditCard, ArrowLeft, CheckCircle } from 'lucide-react';

const SL_DISTRICTS = [
  'Ampara','Anuradhapura','Badulla','Batticaloa','Colombo','Galle','Gampaha',
  'Hambantota','Jaffna','Kalutara','Kandy','Kegalle','Kilinochchi','Kurunegala',
  'Mannar','Matale','Matara','Monaragala','Mullaitivu','Nuwara Eliya',
  'Polonnaruwa','Puttalam','Ratnapura','Trincomalee','Vavuniya',
];

const field = (label, id, input, error) => (
  <div>
    <label htmlFor={id} style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: 6, color: 'var(--color-primary-dark)' }}>
      {label}
    </label>
    {input}
    {error && <div style={{ color: '#dc2626', fontSize: '0.78rem', marginTop: 4 }}>{error}</div>}
  </div>
);

export const RegisterPage = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    fullName: '', email: '', idNumber: '', contactNumber: '',
    district: '', address: '', password: '', confirmPassword: '',
  });
  const [errors, setErrors]   = useState({});
  const [apiError, setApiError] = useState('');
  const [loading, setLoading]  = useState(false);
  const [success, setSuccess]  = useState(false);

  const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }));

  /* ── Validation ─────────────────────────────────── */
  const validate = () => {
    const e = {};
    if (!form.fullName.trim())           e.fullName      = 'Full name is required.';
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
                                          e.email         = 'A valid email address is required.';
    if (!form.idNumber.trim())            e.idNumber      = 'NIC / ID number is required.';
    if (!form.contactNumber.trim())       e.contactNumber = 'Contact number is required.';
    else if (!/^0[0-9]{9}$/.test(form.contactNumber.trim()))
                                          e.contactNumber = 'Enter a valid Sri Lankan number (e.g. 07XXXXXXXX).';
    if (!form.district)                   e.district      = 'Please select a district.';
    if (!form.address.trim())             e.address       = 'Address is required.';
    if (!form.password)                   e.password      = 'Password is required.';
    else if (form.password.length < 8)    e.password      = 'Password must be at least 8 characters.';
    if (!form.confirmPassword)            e.confirmPassword = 'Please confirm your password.';
    else if (form.password !== form.confirmPassword)
                                          e.confirmPassword = 'Passwords do not match.';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError('');
    const v = validate();
    setErrors(v);
    if (Object.keys(v).length > 0) return;

    setLoading(true);
    try {
      await register(form.email.trim(), form.fullName.trim(), form.password, {
        fullName:      form.fullName.trim(),
        idNumber:      form.idNumber.trim(),
        contactNumber: form.contactNumber.trim(),
        district:      form.district,
        address:       form.address.trim(),
      });
      setSuccess(true);
      setTimeout(() => navigate('/'), 2000);
    } catch (err) {
      const msg = err.message || 'Registration failed. Please try again.';
      if (msg.toLowerCase().includes('exist')) {
        setApiError('An account with that email already exists. Try logging in.');
      } else {
        setApiError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = (hasErr) => ({
    width: '100%', padding: '11px 14px 11px 40px',
    border: `1.5px solid ${hasErr ? '#dc2626' : 'var(--color-border)'}`,
    borderRadius: 'var(--radius-sm)', outline: 'none', fontSize: '0.9rem',
    boxSizing: 'border-box', background: '#fff',
    transition: 'border-color 0.2s',
  });
  const iconStyle = { position: 'absolute', left: 12, top: 11, color: 'var(--color-muted)', pointerEvents: 'none' };

  /* ── Success state ─────────────────────────────── */
  if (success) {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: 'var(--color-bg)' }}>
        <div style={{ textAlign: 'center', padding: 40 }}>
          <CheckCircle size={56} style={{ color: 'var(--color-primary)', marginBottom: 16 }} />
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '2rem', color: 'var(--color-primary-dark)', marginBottom: 8 }}>
            Account Created!
          </h2>
          <p style={{ color: 'var(--color-muted)' }}>Welcome to TNT Online Supermarket. Redirecting you now…</p>
        </div>
      </div>
    );
  }

  /* ── Form ─────────────────────────────────────── */
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
            Join our fresh grocery <br />family today.
          </h2>
          <p style={{ fontSize: '1.1rem', opacity: 0.9, maxWidth: 460 }}>
            Enjoy express 30-minute delivery, exclusive discounts, and farm-fresh organic produce.
          </p>
        </div>

        <div style={{ fontSize: '0.85rem', opacity: 0.7 }}>
          © TNT Online Supermarket. All rights reserved.
        </div>
      </div>

      {/* Right Form */}
      <div className="auth-form-side">
        <div className="auth-form-box" style={{ maxWidth: 560 }}>
          <Link
            to="/"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: 'var(--color-muted)', fontSize: '0.875rem', fontWeight: 600, textDecoration: 'none', marginBottom: 20, padding: '6px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--color-bg)', transition: 'all 0.2s ease' }}
            onMouseOver={e => { e.currentTarget.style.color = 'var(--color-primary)'; e.currentTarget.style.background = 'var(--color-soft-mint)'; }}
            onMouseOut={e => { e.currentTarget.style.color = 'var(--color-muted)'; e.currentTarget.style.background = 'var(--color-bg)'; }}
          >
            <ArrowLeft size={16} /> Back to Home
          </Link>

          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '2rem', marginBottom: 4, color: 'var(--color-primary-dark)' }}>
            Create Customer Account
          </h1>
          <p style={{ color: 'var(--color-muted)', marginBottom: 24, fontSize: '0.9rem' }}>
            Fill in your details below to get started.
          </p>

          {apiError && (
            <div style={{ background: '#fee2e2', color: '#991b1b', padding: '12px 16px', borderRadius: 'var(--radius-sm)', marginBottom: 20, fontSize: '0.875rem', borderLeft: '4px solid #dc2626' }}>
              {apiError}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            {/* ── Row 1: Full Name | Email ── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 16 }}>
              {field('Full Name *', 'fullName',
                <div style={{ position: 'relative' }}>
                  <User size={16} style={iconStyle} />
                  <input id="fullName" type="text" value={form.fullName} onChange={set('fullName')}
                    placeholder="e.g. Kasun Perera" autoComplete="name" style={inputStyle(errors.fullName)} />
                </div>, errors.fullName
              )}
              {field('Email Address *', 'email',
                <div style={{ position: 'relative' }}>
                  <Mail size={16} style={iconStyle} />
                  <input id="email" type="email" value={form.email} onChange={set('email')}
                    placeholder="name@example.com" autoComplete="email" style={inputStyle(errors.email)} />
                </div>, errors.email
              )}
            </div>

            {/* ── Row 2: NIC | Contact ── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 16 }}>
              {field('NIC / ID Number *', 'idNumber',
                <div style={{ position: 'relative' }}>
                  <CreditCard size={16} style={iconStyle} />
                  <input id="idNumber" type="text" value={form.idNumber} onChange={set('idNumber')}
                    placeholder="e.g. 199012345678 or 901234567V" autoComplete="off" style={inputStyle(errors.idNumber)} />
                </div>, errors.idNumber
              )}
              {field('Contact Number *', 'contactNumber',
                <div style={{ position: 'relative' }}>
                  <Phone size={16} style={iconStyle} />
                  <input id="contactNumber" type="tel" value={form.contactNumber} onChange={set('contactNumber')}
                    placeholder="07XXXXXXXX" autoComplete="tel" maxLength={10} style={inputStyle(errors.contactNumber)} />
                </div>, errors.contactNumber
              )}
            </div>

            {/* ── Row 3: District ── */}
            <div style={{ marginBottom: 16 }}>
              {field('District *', 'district',
                <div style={{ position: 'relative' }}>
                  <MapPin size={16} style={{ ...iconStyle, top: 12 }} />
                  <select
                    id="district" value={form.district} onChange={set('district')}
                    style={{ ...inputStyle(errors.district), appearance: 'none', cursor: 'pointer', paddingRight: 32 }}
                  >
                    <option value="">Select District</option>
                    {SL_DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>, errors.district
              )}
            </div>

            {/* ── Row 4: Address ── */}
            <div style={{ marginBottom: 16 }}>
              {field('Full Address *', 'address',
                <textarea
                  id="address" value={form.address} onChange={set('address')} rows={3}
                  placeholder="House number, street, city"
                  autoComplete="street-address"
                  style={{ ...inputStyle(errors.address), padding: '11px 14px', resize: 'vertical', minHeight: 80 }}
                />, errors.address
              )}
            </div>

            {/* ── Row 5: Password | Confirm ── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 24 }}>
              {field('Password *', 'password',
                <div style={{ position: 'relative' }}>
                  <Lock size={16} style={iconStyle} />
                  <input id="password" type="password" value={form.password} onChange={set('password')}
                    placeholder="Min. 8 characters" autoComplete="new-password" style={inputStyle(errors.password)} />
                </div>, errors.password
              )}
              {field('Confirm Password *', 'confirmPassword',
                <div style={{ position: 'relative' }}>
                  <Lock size={16} style={iconStyle} />
                  <input id="confirmPassword" type="password" value={form.confirmPassword} onChange={set('confirmPassword')}
                    placeholder="Re-enter password" autoComplete="new-password" style={inputStyle(errors.confirmPassword)} />
                </div>, errors.confirmPassword
              )}
            </div>

            <button className="btn btn-primary" type="submit" style={{ width: '100%', padding: '13px' }} disabled={loading}>
              {loading ? 'Creating Account…' : 'Create Account'}
            </button>
          </form>

          <p style={{ marginTop: 20, textAlign: 'center', fontSize: '0.9rem', color: 'var(--color-muted)' }}>
            Already have an account? <Link to="/login" style={{ color: 'var(--color-primary)', fontWeight: 700 }}>Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
};
