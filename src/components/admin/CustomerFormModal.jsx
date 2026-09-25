import React, { useState, useEffect, useRef } from 'react';
import { X, Lock, Mail, Phone, User, CheckCircle2, Eye, EyeOff, AlertCircle, UserCheck } from 'lucide-react';

/* ── helpers ── */
const pwStrength = (p) => {
  if (!p) return 0;
  let s = 0;
  if (p.length >= 8) s++;
  if (/[A-Z]/.test(p)) s++;
  if (/[0-9]/.test(p)) s++;
  if (/[^A-Za-z0-9]/.test(p)) s++;
  return s; // 0-4
};
const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong'];
const strengthColor = ['', '#ef4444', '#f59e0b', '#22c55e', '#059669'];

const InputField = ({ label, required, icon: Icon, error, hint, children }) => (
  <div>
    <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', fontWeight: 700, color: '#374151', marginBottom: 6 }}>
      {label} {required && <span style={{ color: '#ef4444', lineHeight: 1 }}>*</span>}
    </label>
    <div style={{ position: 'relative' }}>
      {Icon && <Icon size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: error ? '#ef4444' : '#9ca3af', pointerEvents: 'none' }} />}
      {children}
    </div>
    {error
      ? <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#ef4444', fontSize: '0.75rem', marginTop: 5, fontWeight: 500 }}><AlertCircle size={12} />{error}</div>
      : hint && <div style={{ fontSize: '0.72rem', color: '#9ca3af', marginTop: 4 }}>{hint}</div>
    }
  </div>
);

const inputStyle = (hasError, hasIcon = true) => ({
  width: '100%',
  padding: `10px 12px 10px ${hasIcon ? 36 : 12}px`,
  border: `1.5px solid ${hasError ? '#ef4444' : '#e2e8f0'}`,
  borderRadius: 10,
  fontSize: '0.9rem',
  outline: 'none',
  boxSizing: 'border-box',
  background: '#fff',
  color: '#0f172a',
  transition: 'border-color 0.15s, box-shadow 0.15s',
});

const selectStyle = (hasError) => ({
  ...inputStyle(hasError, false),
  appearance: 'none',
  cursor: 'pointer',
  background: '#fff',
});

export const CustomerFormModal = ({ isOpen, mode = 'create', customer = null, onClose, onSave }) => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState('Active');
  const [showPw, setShowPw] = useState(false);
  const [showCpw, setShowCpw] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const firstRef = useRef(null);

  const strength = pwStrength(password);

  useEffect(() => {
    if (!isOpen) return;
    setTimeout(() => firstRef.current?.focus(), 80);
    if (customer && mode === 'edit') {
      setFullName(customer.fullName || customer.displayName || '');
      setEmail(customer.email || '');
      setPhoneNumber(customer.contactNumber || '');
      setStatus(customer.active === false ? 'Inactive' : 'Active');
      setPassword('');
      setConfirmPassword('');
    } else {
      setFullName('');
      setEmail('');
      setPhoneNumber('');
      setPassword('');
      setConfirmPassword('');
      setStatus('Active');
    }
    setErrors({});
    setTouched({});
  }, [customer, mode, isOpen]);

  if (!isOpen) return null;

  const touch = (f) => setTouched(t => ({ ...t, [f]: true }));

  const validate = () => {
    const errs = {};
    if (!fullName.trim()) errs.fullName = 'Full name is required.';
    if (!email.trim()) errs.email = 'Email is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) errs.email = 'Enter a valid email address.';
    if (!phoneNumber.trim()) errs.phoneNumber = 'Phone number is required.';
    if (mode === 'create') {
      if (!password) errs.password = 'Password is required.';
      else if (password.length < 8) errs.password = 'Min 8 characters.';
      if (password !== confirmPassword) errs.confirmPassword = 'Passwords do not match.';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched({ fullName: true, email: true, phoneNumber: true, password: true, confirmPassword: true });
    if (!validate()) return;

    setSubmitting(true);
    try {
      await onSave({
        fullName: fullName.trim(),
        displayName: fullName.trim(),
        email: email.trim().toLowerCase(),
        contactNumber: phoneNumber.trim(),
        active: status === 'Active',
        ...(mode === 'create' ? { password } : {}),
      });
      onClose();
    } catch (err) {
      setErrors(prev => ({ ...prev, api: err?.message || 'Action failed. Please try again.' }));
    } finally {
      setSubmitting(false);
    }
  };

  const isEdit = mode === 'edit';

  return (
    <div
      style={{
        position: 'fixed', inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.7)',
        backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1050, padding: 16,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#ffffff',
          borderRadius: 20,
          width: '100%',
          maxWidth: 540,
          boxShadow: '0 32px 64px -12px rgba(0,0,0,0.35)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '92vh',
          animation: 'modalSlideUp 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
          padding: '24px 28px',
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'relative',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12,
              background: 'rgba(255,255,255,0.18)',
              display: 'grid', placeItems: 'center',
            }}>
              <UserCheck size={22} color="#fff" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>
                {isEdit ? 'Edit Customer Account' : 'Register New Customer'}
              </h3>
              <p style={{ margin: '3px 0 0', fontSize: '0.8rem', opacity: 0.85 }}>
                {isEdit ? 'Update customer profile information and status' : 'Create a new customer profile for online shopping'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.15)', border: 'none',
              width: 32, height: 32, borderRadius: 8,
              cursor: 'pointer', display: 'grid', placeItems: 'center',
              color: '#fff',
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ padding: '24px 28px', overflowY: 'auto', flex: 1 }}>
          {errors.api && (
            <div style={{
              background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b',
              padding: '12px 16px', borderRadius: 10, fontSize: '0.84rem',
              display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18,
            }}>
              <AlertCircle size={16} /> {errors.api}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {/* Section 1: Customer Details */}
            <div style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#059669', borderBottom: '1px solid #e2e8f0', paddingBottom: 6 }}>
              1. Customer Profile
            </div>

            <InputField label="Full Name" required icon={User} error={touched.fullName && errors.fullName}>
              <input
                ref={firstRef}
                type="text"
                placeholder="e.g. Priyantha Silva"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                onBlur={() => touch('fullName')}
                style={inputStyle(touched.fullName && errors.fullName)}
              />
            </InputField>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <InputField label="Email Address" required icon={Mail} error={touched.email && errors.email}>
                <input
                  type="email"
                  placeholder="customer@domain.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  onBlur={() => touch('email')}
                  style={inputStyle(touched.email && errors.email)}
                />
              </InputField>

              <InputField label="Phone Number" required icon={Phone} error={touched.phoneNumber && errors.phoneNumber}>
                <input
                  type="tel"
                  placeholder="e.g. +94 77 123 4567"
                  value={phoneNumber}
                  onChange={e => setPhoneNumber(e.target.value)}
                  onBlur={() => touch('phoneNumber')}
                  style={inputStyle(touched.phoneNumber && errors.phoneNumber)}
                />
              </InputField>
            </div>

            {/* Section 2: Account Status */}
            <div style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#059669', borderBottom: '1px solid #e2e8f0', paddingBottom: 6, marginTop: 4 }}>
              2. Account Status
            </div>

            <InputField label="Account Status" required>
              <select
                value={status}
                onChange={e => setStatus(e.target.value)}
                style={selectStyle(false)}
              >
                <option value="Active">Active — Can login and place orders</option>
                <option value="Inactive">Inactive — Account locked</option>
              </select>
            </InputField>

            {/* Section 3: Password (create only) */}
            {!isEdit && (
              <>
                <div style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#059669', borderBottom: '1px solid #e2e8f0', paddingBottom: 6, marginTop: 4 }}>
                  3. Security & Credentials
                </div>

                <InputField label="Initial Password" required icon={Lock} error={touched.password && errors.password}>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPw ? 'text' : 'password'}
                      placeholder="Min 8 characters with numbers & symbols"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      onBlur={() => touch('password')}
                      style={{ ...inputStyle(touched.password && errors.password), paddingRight: 38 }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw(v => !v)}
                      style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: 4 }}
                    >
                      {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                  {/* password strength meter */}
                  {password && (
                    <div style={{ marginTop: 8 }}>
                      <div style={{ display: 'flex', gap: 4, height: 4 }}>
                        {[1, 2, 3, 4].map(step => (
                          <div
                            key={step}
                            style={{
                              flex: 1,
                              borderRadius: 2,
                              background: strength >= step ? strengthColor[strength] : '#e2e8f0',
                              transition: 'background 0.2s',
                            }}
                          />
                        ))}
                      </div>
                      <div style={{ fontSize: '0.71rem', color: strengthColor[strength], fontWeight: 600, marginTop: 4 }}>
                        Strength: {strengthLabel[strength]}
                      </div>
                    </div>
                  )}
                </InputField>

                <InputField label="Confirm Password" required icon={Lock} error={touched.confirmPassword && errors.confirmPassword}>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showCpw ? 'text' : 'password'}
                      placeholder="Re-enter password to confirm"
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      onBlur={() => touch('confirmPassword')}
                      style={{ ...inputStyle(touched.confirmPassword && errors.confirmPassword), paddingRight: 38 }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowCpw(v => !v)}
                      style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: 4 }}
                    >
                      {showCpw ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </InputField>
              </>
            )}
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 28, paddingTop: 18, borderTop: '1px solid #e2e8f0' }}>
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              style={{
                padding: '9px 18px', borderRadius: 10,
                border: '1.5px solid #cbd5e1', background: '#fff',
                fontSize: '0.88rem', fontWeight: 600, color: '#64748b',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              style={{
                padding: '9px 24px', borderRadius: 10,
                background: '#059669', border: 'none',
                fontSize: '0.88rem', fontWeight: 700, color: '#fff',
                cursor: submitting ? 'not-allowed' : 'pointer',
                opacity: submitting ? 0.7 : 1,
                display: 'flex', alignItems: 'center', gap: 8,
              }}
            >
              <CheckCircle2 size={16} />
              {submitting ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
