import React, { useState, useEffect, useRef } from 'react';
import { X, Shield, Lock, Mail, Phone, User, CheckCircle2, Eye, EyeOff, AlertCircle } from 'lucide-react';

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
const strengthColor = ['', '#ef4444', '#f59e0b', '#22c55e', '#0ea5e9'];

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

const selectStyle = (hasError, hasIcon = false) => ({
  ...inputStyle(hasError, hasIcon),
  appearance: 'none',
  cursor: 'pointer',
  background: '#fff',
});

export const StaffFormModal = ({ isOpen, mode = 'create', staff = null, onClose, onSave }) => {
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
    if (staff && mode === 'edit') {
      setFullName(staff.fullName || staff.displayName || '');
      setEmail(staff.email || '');
      setPhoneNumber(staff.contactNumber || '');
      setStatus(staff.active === false ? 'Inactive' : 'Active');
      setPassword('');
      setConfirmPassword('');
    } else {
      setFullName(''); setEmail(''); setPhoneNumber('');
      setPassword(''); setConfirmPassword('');
      setStatus('Active');
    }
    setErrors({}); setTouched({});
  }, [staff, mode, isOpen]);

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
      await onSave({ fullName: fullName.trim(), email: email.trim(), phoneNumber: phoneNumber.trim(), status, role: 'Staff', ...(mode === 'create' ? { password } : {}) });
    } catch (err) {
      setErrors(p => ({ ...p, api: err?.message || 'Operation failed. Please try again.' }));
    } finally { setSubmitting(false); }
  };

  const accentColor = '#7c3aed';
  const accentLight = '#ede9fe';

  return (
    <div
      style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15,23,42,0.7)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1050, padding: 16 }}
      onClick={onClose}
    >
      <div
        style={{ background: '#fff', borderRadius: 20, width: '100%', maxWidth: 560, maxHeight: '92vh', display: 'flex', flexDirection: 'column', boxShadow: '0 32px 64px -12px rgba(0,0,0,0.3)', overflow: 'hidden', animation: 'modalSlideUp 0.22s cubic-bezier(0.16,1,0.3,1)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* ── Modal Header ── */}
        <div style={{ padding: '22px 28px', background: `linear-gradient(135deg, ${accentLight} 0%, #f5f3ff 100%)`, borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 46, height: 46, borderRadius: 14, background: accentColor, color: '#fff', display: 'grid', placeItems: 'center', boxShadow: `0 4px 12px ${accentColor}55` }}>
              <Shield size={22} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#1e293b' }}>
                {mode === 'create' ? 'Add New Staff Member' : 'Edit Staff Account'}
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: '#64748b' }}>
                {mode === 'create' ? 'Create a staff account and set its access status.' : 'Update staff profile and access settings.'}
              </p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(0,0,0,0.06)', border: 'none', width: 34, height: 34, borderRadius: 8, cursor: 'pointer', display: 'grid', placeItems: 'center', color: '#64748b' }}><X size={18} /></button>
        </div>

        {/* ── Form Body ── */}
        <form onSubmit={handleSubmit} style={{ overflowY: 'auto', padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 18 }}>

          {/* API Error */}
          {errors.api && (
            <div style={{ padding: '12px 16px', background: '#fef2f2', border: '1.5px solid #fca5a5', borderRadius: 10, color: '#991b1b', fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
              <AlertCircle size={16} /> {errors.api}
            </div>
          )}

          {/* ─ Section: Personal Info ─ */}
          <div>
            <div style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: accentColor, marginBottom: 12 }}>Personal Information</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <InputField label="Full Name" required icon={User} error={touched.fullName && errors.fullName}>
                <input
                  ref={firstRef}
                  type="text"
                  placeholder="e.g. Kamal Perera"
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
                    placeholder="staff@tnt.lk"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    onBlur={() => touch('email')}
                    style={inputStyle(touched.email && errors.email)}
                  />
                </InputField>
                <InputField label="Phone Number" required icon={Phone} error={touched.phoneNumber && errors.phoneNumber}>
                  <input
                    type="tel"
                    placeholder="+94 77 123 4567"
                    value={phoneNumber}
                    onChange={e => setPhoneNumber(e.target.value)}
                    onBlur={() => touch('phoneNumber')}
                    style={inputStyle(touched.phoneNumber && errors.phoneNumber)}
                  />
                </InputField>
              </div>
            </div>
          </div>

          {/* ─ Section: Assignment ─ */}
          <div>
            <div style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: accentColor, marginBottom: 12 }}>Assignment & Access</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <InputField label="Role" hint="Locked to standard Staff role">
                <div style={{ ...inputStyle(false, false), color: '#6b7280', background: '#f8fafc', cursor: 'not-allowed', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px' }}>
                  <Shield size={14} style={{ color: accentColor }} /> Staff
                </div>
              </InputField>
              <InputField label="Account Status">
                <select
                  value={status}
                  onChange={e => setStatus(e.target.value)}
                  style={selectStyle(false)}
                >
                  <option value="Active">✅ Active</option>
                  <option value="Inactive">❌ Inactive</option>
                </select>
              </InputField>
            </div>

          </div>

          {/* ─ Section: Security (Create only) ─ */}
          {mode === 'create' && (
            <div>
              <div style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: accentColor, marginBottom: 12 }}>Account Security</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <InputField label="Password" required icon={Lock} error={touched.password && errors.password}>
                  <input
                    type={showPw ? 'text' : 'password'}
                    placeholder="Min 8 characters"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    onBlur={() => touch('password')}
                    style={{ ...inputStyle(touched.password && errors.password), paddingRight: 40 }}
                  />
                  <button type="button" onClick={() => setShowPw(v => !v)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: 4 }}>
                    {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                  {/* Strength meter */}
                  {password && (
                    <div style={{ marginTop: 6 }}>
                      <div style={{ display: 'flex', gap: 4 }}>
                        {[1, 2, 3, 4].map(i => (
                          <div key={i} style={{ flex: 1, height: 3, borderRadius: 99, background: i <= strength ? strengthColor[strength] : '#e2e8f0', transition: 'background 0.2s' }} />
                        ))}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: strengthColor[strength], fontWeight: 600, marginTop: 3 }}>{strengthLabel[strength]}</div>
                    </div>
                  )}
                </InputField>
                <InputField label="Confirm Password" required icon={Lock} error={touched.confirmPassword && errors.confirmPassword}>
                  <input
                    type={showCpw ? 'text' : 'password'}
                    placeholder="Repeat password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    onBlur={() => touch('confirmPassword')}
                    style={{ ...inputStyle(touched.confirmPassword && errors.confirmPassword), paddingRight: 40 }}
                  />
                  <button type="button" onClick={() => setShowCpw(v => !v)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: 4 }}>
                    {showCpw ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                  {confirmPassword && password === confirmPassword && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#16a34a', fontSize: '0.7rem', fontWeight: 600, marginTop: 4 }}>
                      <CheckCircle2 size={12} /> Passwords match
                    </div>
                  )}
                </InputField>
              </div>
            </div>
          )}

          {/* ── Footer ── */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 6, borderTop: '1px solid #f1f5f9', marginTop: 4 }}>
            <button type="button" onClick={onClose} disabled={submitting}
              style={{ padding: '10px 20px', fontSize: '0.88rem', borderRadius: 10, border: '1.5px solid #e2e8f0', background: '#fff', color: '#374151', cursor: 'pointer', fontWeight: 600 }}>
              Cancel
            </button>
            <button type="submit" disabled={submitting}
              style={{ padding: '10px 24px', fontSize: '0.88rem', borderRadius: 10, border: 'none', background: submitting ? '#a78bfa' : accentColor, color: '#fff', cursor: submitting ? 'not-allowed' : 'pointer', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, boxShadow: `0 4px 12px ${accentColor}40`, transition: 'all 0.15s' }}>
              {submitting
                ? <><span style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} /> Saving…</>
                : <><CheckCircle2 size={16} /> {mode === 'create' ? 'Create Staff Member' : 'Save Changes'}</>
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
