import React, { useState, useEffect, useRef } from 'react';
import { X, Truck, Lock, Mail, Phone, User, CheckCircle2, Eye, EyeOff, AlertCircle, Zap, Clock, WifiOff, Car, Hash, FileText, MapPin, Home } from 'lucide-react';

const VEHICLE_TYPES = [
  { value: '', label: 'Select vehicle type…' },
  { value: 'Motorcycle', label: '🏍️ Motorcycle' },
  { value: 'Bicycle', label: '🚲 Bicycle' },
  { value: 'Car', label: '🚗 Car' },
  { value: 'Van', label: '🚐 Van' },
  { value: 'Three-Wheeler', label: '🛺 Three-Wheeler' },
  { value: 'Other', label: '🚛 Other' },
];

/* ── helpers ── */
const pwStrength = (p) => {
  if (!p) return 0;
  let s = 0;
  if (p.length >= 8) s++;
  if (/[A-Z]/.test(p)) s++;
  if (/[0-9]/.test(p)) s++;
  if (/[^A-Za-z0-9]/.test(p)) s++;
  return s;
};
const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong'];
const strengthColor = ['', '#ef4444', '#f59e0b', '#22c55e', '#0ea5e9'];

const AVAILABILITY_OPTIONS = [
  { value: 'Available', label: '🟢 Available', icon: Zap, color: '#16a34a' },
  { value: 'Busy', label: '🟡 Busy / Delivering', icon: Clock, color: '#d97706' },
  { value: 'Offline', label: '⚫ Offline', icon: WifiOff, color: '#6b7280' },
];

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
});

export const RiderFormModal = ({ isOpen, mode = 'create', rider = null, onClose, onSave }) => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [district, setDistrict] = useState('');
  const [address, setAddress] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState('Active');
  const [availabilityStatus, setAvailabilityStatus] = useState('Available');
  // Vehicle fields
  const [vehicleType, setVehicleType] = useState('');
  const [vehicleModel, setVehicleModel] = useState('');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
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
    if (rider && mode === 'edit') {
      setFullName(rider.fullName || rider.displayName || '');
      setEmail(rider.email || '');
      setPhoneNumber(rider.contactNumber || '');
      setDistrict(rider.district || '');
      setAddress(rider.address || '');
      setStatus(rider.active === false ? 'Inactive' : 'Active');
      setAvailabilityStatus(rider.availabilityStatus || 'Available');
      setVehicleType(rider.vehicleType || '');
      setVehicleModel(rider.vehicleModel || '');
      setVehicleNumber(rider.vehicleNumber || '');
      setLicenseNumber(rider.licenseNumber || '');
      setPassword(''); setConfirmPassword('');
    } else {
      setFullName(''); setEmail(''); setPhoneNumber(''); setDistrict(''); setAddress('');
      setPassword(''); setConfirmPassword('');
      setStatus('Active'); setAvailabilityStatus('Available');
      setVehicleType(''); setVehicleModel(''); setVehicleNumber(''); setLicenseNumber('');
    }
    setErrors({}); setTouched({});
  }, [rider, mode, isOpen]);

  if (!isOpen) return null;

  const touch = (f) => setTouched(t => ({ ...t, [f]: true }));

  const validate = () => {
    const errs = {};
    if (!fullName.trim()) errs.fullName = 'Full name is required.';
    if (!email.trim()) errs.email = 'Email is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) errs.email = 'Enter a valid email address.';
    if (!phoneNumber.trim()) errs.phoneNumber = 'Phone number is required.';
    if (!district.trim()) errs.district = 'District is required.';
    if (!address.trim()) errs.address = 'Address is required.';
    if (!vehicleType.trim()) errs.vehicleType = 'Vehicle type is required.';
    if (!vehicleModel.trim()) errs.vehicleModel = 'Vehicle model is required.';
    if (!vehicleNumber.trim()) errs.vehicleNumber = 'Vehicle number is required.';
    if (!licenseNumber.trim()) errs.licenseNumber = 'License number is required.';
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
    setTouched({ fullName: true, email: true, phoneNumber: true, district: true, address: true, password: true, confirmPassword: true, vehicleType: true, vehicleModel: true, vehicleNumber: true, licenseNumber: true });
    if (!validate()) return;
    setSubmitting(true);
    try {
      await onSave({
        fullName: fullName.trim(),
        email: email.trim(),
        phoneNumber: phoneNumber.trim(),
        district: district.trim(),
        address: address.trim(),
        status,
        availabilityStatus,
        role: 'Rider',
        vehicleType: vehicleType.trim(),
        vehicleModel: vehicleModel.trim(),
        vehicleNumber: vehicleNumber.trim(),
        licenseNumber: licenseNumber.trim(),
        ...(mode === 'create' ? { password } : {})
      });
    } catch (err) {
      setErrors(p => ({ ...p, api: err?.message || 'Operation failed. Please try again.' }));
    } finally { setSubmitting(false); }
  };

  const accentColor = '#0284c7';
  const accentLight = '#e0f2fe';
  const selectedAvail = AVAILABILITY_OPTIONS.find(o => o.value === availabilityStatus);

  return (
    <div
      style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15,23,42,0.7)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1050, padding: 16 }}
      onClick={onClose}
    >
      <div
        style={{ background: '#fff', borderRadius: 20, width: '100%', maxWidth: 560, maxHeight: '92vh', display: 'flex', flexDirection: 'column', boxShadow: '0 32px 64px -12px rgba(0,0,0,0.3)', overflow: 'hidden', animation: 'modalSlideUp 0.22s cubic-bezier(0.16,1,0.3,1)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div style={{ padding: '22px 28px', background: `linear-gradient(135deg, ${accentLight} 0%, #f0f9ff 100%)`, borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 46, height: 46, borderRadius: 14, background: accentColor, color: '#fff', display: 'grid', placeItems: 'center', boxShadow: `0 4px 12px ${accentColor}55` }}>
              <Truck size={22} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#1e293b' }}>
                {mode === 'create' ? 'Add New Delivery Rider' : 'Edit Rider Account'}
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: '#64748b' }}>
                {mode === 'create' ? 'Create a courier account and set initial availability.' : 'Update rider profile and availability status.'}
              </p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(0,0,0,0.06)', border: 'none', width: 34, height: 34, borderRadius: 8, cursor: 'pointer', display: 'grid', placeItems: 'center', color: '#64748b' }}><X size={18} /></button>
        </div>

        {/* ── Form Body ── */}
        <form onSubmit={handleSubmit} style={{ overflowY: 'auto', padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 20 }}>

          {errors.api && (
            <div style={{ padding: '12px 16px', background: '#fef2f2', border: '1.5px solid #fca5a5', borderRadius: 10, color: '#991b1b', fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
              <AlertCircle size={16} /> {errors.api}
            </div>
          )}

          {/* ─ Personal Info ─ */}
          <div>
            <div style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: accentColor, marginBottom: 12 }}>Rider Information</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <InputField label="Full Name" required icon={User} error={touched.fullName && errors.fullName}>
                <input
                  ref={firstRef}
                  type="text"
                  placeholder="e.g. Saman Silva"
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
                    placeholder="rider@tnt.lk"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    onBlur={() => touch('email')}
                    style={inputStyle(touched.email && errors.email)}
                  />
                </InputField>
                <InputField label="Phone Number" required icon={Phone} error={touched.phoneNumber && errors.phoneNumber}>
                  <input
                    type="tel"
                    placeholder="+94 77 987 6543"
                    value={phoneNumber}
                    onChange={e => setPhoneNumber(e.target.value)}
                    onBlur={() => touch('phoneNumber')}
                    style={inputStyle(touched.phoneNumber && errors.phoneNumber)}
                  />
                </InputField>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <InputField label="District" required icon={MapPin} error={touched.district && errors.district}>
                  <input
                    type="text"
                    placeholder="e.g. Colombo"
                    value={district}
                    onChange={e => setDistrict(e.target.value)}
                    onBlur={() => touch('district')}
                    style={inputStyle(touched.district && errors.district)}
                  />
                </InputField>
                <InputField label="Address" required icon={Home} error={touched.address && errors.address}>
                  <input
                    type="text"
                    placeholder="e.g. Colombo 03"
                    value={address}
                    onChange={e => setAddress(e.target.value)}
                    onBlur={() => touch('address')}
                    style={inputStyle(touched.address && errors.address)}
                  />
                </InputField>
              </div>
            </div>
          </div>

          {/* ─ Status & Availability ─ */}
          <div>
            <div style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: accentColor, marginBottom: 12 }}>Status & Availability</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <InputField label="Account Status">
                <select value={status} onChange={e => setStatus(e.target.value)} style={selectStyle(false)}>
                  <option value="Active">✅ Active</option>
                  <option value="Inactive">❌ Inactive</option>
                </select>
              </InputField>
              <InputField label="Availability Status" hint="Live availability for dispatch">
                <select value={availabilityStatus} onChange={e => setAvailabilityStatus(e.target.value)} style={{ ...selectStyle(false), color: selectedAvail?.color || '#374151', fontWeight: 700 }}>
                  {AVAILABILITY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </InputField>
            </div>

            {/* Availability visual pill */}
            <div style={{ marginTop: 10, padding: '10px 16px', borderRadius: 10, background: `${selectedAvail?.color}15`, border: `1.5px solid ${selectedAvail?.color}30`, display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.82rem', color: selectedAvail?.color, fontWeight: 600 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: selectedAvail?.color, display: 'inline-block' }} />
              Rider will show as <strong style={{ marginLeft: 4 }}>{availabilityStatus}</strong> on the dispatch board
            </div>
          </div>

          {/* ─ Vehicle Information ─ */}
          <div>
            <div style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: accentColor, marginBottom: 12 }}>Vehicle Information</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <InputField label="Vehicle Type" required icon={Car} error={touched.vehicleType && errors.vehicleType}>
                <select
                  value={vehicleType}
                  onChange={e => setVehicleType(e.target.value)}
                  onBlur={() => touch('vehicleType')}
                  style={selectStyle(touched.vehicleType && errors.vehicleType)}
                >
                  {VEHICLE_TYPES.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </InputField>
              <InputField label="Vehicle Model" required icon={Car} error={touched.vehicleModel && errors.vehicleModel}>
                <input
                  type="text"
                  placeholder="e.g. Honda Dio"
                  value={vehicleModel}
                  onChange={e => setVehicleModel(e.target.value)}
                  onBlur={() => touch('vehicleModel')}
                  style={inputStyle(touched.vehicleModel && errors.vehicleModel)}
                />
              </InputField>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <InputField label="Vehicle / Plate Number" required icon={Hash} error={touched.vehicleNumber && errors.vehicleNumber}>
                  <input
                    type="text"
                    placeholder="e.g. CAB-1234"
                    value={vehicleNumber}
                    onChange={e => setVehicleNumber(e.target.value.toUpperCase())}
                    onBlur={() => touch('vehicleNumber')}
                    style={inputStyle(touched.vehicleNumber && errors.vehicleNumber)}
                  />
                </InputField>
                <InputField label="Driving License Number" required icon={FileText} error={touched.licenseNumber && errors.licenseNumber}>
                  <input
                    type="text"
                    placeholder="e.g. B1234567"
                    value={licenseNumber}
                    onChange={e => setLicenseNumber(e.target.value.toUpperCase())}
                    onBlur={() => touch('licenseNumber')}
                    style={inputStyle(touched.licenseNumber && errors.licenseNumber)}
                  />
                </InputField>
              </div>
            </div>
          </div>

          {/* ─ Security (create only) ─ */}
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
                  {password && (
                    <div style={{ marginTop: 6 }}>
                      <div style={{ display: 'flex', gap: 4 }}>
                        {[1, 2, 3, 4].map(i => <div key={i} style={{ flex: 1, height: 3, borderRadius: 99, background: i <= strength ? strengthColor[strength] : '#e2e8f0', transition: 'background 0.2s' }} />)}
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
              style={{ padding: '10px 24px', fontSize: '0.88rem', borderRadius: 10, border: 'none', background: submitting ? '#7dd3fc' : accentColor, color: '#fff', cursor: submitting ? 'not-allowed' : 'pointer', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, boxShadow: `0 4px 12px ${accentColor}40`, transition: 'all 0.15s' }}>
              {submitting
                ? <><span style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} /> Saving…</>
                : <><CheckCircle2 size={16} /> {mode === 'create' ? 'Create Rider Account' : 'Save Changes'}</>
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
