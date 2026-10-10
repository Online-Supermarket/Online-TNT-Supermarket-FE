import MobileNumberInput from '../../components/MobileNumberInput';
import { normalizeMobileNumber, isMobileNumber, MOBILE_NUMBER_ERROR } from '../../utils/mobileNumber';
import React, { useState, useEffect } from 'react';
import { Truck, ShieldCheck, User, RefreshCw, Edit2, Save, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import axiosInstance from '../../services/axiosInstance';

export const DeliveryProfile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [phoneError, setPhoneError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await axiosInstance.get('/identity/users/me');
        setProfile(data);
        setFormData({
          contactNumber: normalizeMobileNumber(data.contactNumber) || '07',
          address: data.address || '',
          district: data.district || '',
          vehicleType: data.vehicleType || '',
          vehicleNumber: data.vehicleNumber || '',
          licenseNumber: data.licenseNumber || ''
        });
      } catch (err) {
        console.error('Failed to fetch rider profile', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleSave = async () => {
    if (!isMobileNumber(formData.contactNumber)) { setPhoneError(MOBILE_NUMBER_ERROR); return; }
    setPhoneError('');
    setSaving(true);
    try {
      await axiosInstance.put('/identity/users/me', formData);
      setProfile({ ...profile, ...formData });
      setIsEditing(false);
    } catch (err) {
      console.error('Failed to update profile', err);
      alert('Failed to save changes. Please check the inputs.');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div style={{ maxWidth: 700, margin: '0 auto' }}>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '2.2rem', color: 'var(--color-primary-dark)' }}>
          Driver Profile & Vehicle Specs
        </h1>
        {loading && <RefreshCw size={24} className="spin" color="var(--color-muted)" />}
      </div>

      <div style={{ background: '#ffffff', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 32, boxShadow: 'var(--shadow-md)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, paddingBottom: 20, borderBottom: '1px solid var(--color-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'var(--color-soft-mint)', display: 'grid', placeItems: 'center', color: 'var(--color-primary)' }}>
              <User size={36} />
            </div>
            <div>
              <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.4rem' }}>{profile?.fullName || user?.displayName || 'Loading...'}</h2>
              <p style={{ color: 'var(--color-muted)', fontSize: '0.9rem' }}>TNT Certified Express Courier</p>
            </div>
          </div>
          {!loading && (
            <button
              onClick={() => isEditing ? setIsEditing(false) : setIsEditing(true)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px',
                background: isEditing ? '#f3f4f6' : 'var(--color-primary)',
                color: isEditing ? '#4b5563' : '#fff',
                border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontWeight: 600
              }}
            >
              {isEditing ? <><X size={16} /> Cancel</> : <><Edit2 size={16} /> Edit Profile</>}
            </button>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', color: 'var(--color-muted)' }}>Email Address</label>
            <div style={{ fontWeight: 700, fontSize: '1.05rem', marginTop: 4 }}>{profile?.email || '—'}</div>
          </div>

          <div>
            <label htmlFor="rider-profile-phone" style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', color: 'var(--color-muted)', marginBottom: 4 }}>Contact Number</label>
            {isEditing ? (
              <><MobileNumberInput id="rider-profile-phone" value={formData.contactNumber}
                onChange={value => { setFormData(current => ({ ...current, contactNumber: value })); setPhoneError(''); }}
                invalid={Boolean(phoneError)} />{phoneError && <p role="alert" style={{ color: '#dc2626', fontSize: '.8rem' }}>{phoneError}</p>}</>
            ) : (
              <div style={{ fontWeight: 700, fontSize: '1.05rem' }}>{profile?.contactNumber || '—'}</div>
            )}
          </div>

          <div>
            <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', color: 'var(--color-muted)', marginBottom: 4 }}>District</label>
            {isEditing ? (
              <input type="text" name="district" value={formData.district} onChange={handleChange} style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)' }} />
            ) : (
              <div style={{ fontWeight: 700, fontSize: '1.05rem' }}>{profile?.district || '—'}</div>
            )}
          </div>

          <div style={{ gridColumn: '1 / -1' }}>
            <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', color: 'var(--color-muted)', marginBottom: 4 }}>Registered Address</label>
            {isEditing ? (
              <input type="text" name="address" value={formData.address} onChange={handleChange} style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)' }} />
            ) : (
              <div style={{ fontWeight: 700, fontSize: '1.05rem' }}>{profile?.address || '—'}</div>
            )}
          </div>

          <div>
            <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', color: 'var(--color-muted)', marginBottom: 4 }}>Assigned Vehicle (Type)</label>
            {isEditing ? (
              <input type="text" name="vehicleType" value={formData.vehicleType} onChange={handleChange} style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)' }} />
            ) : (
              <div style={{ fontWeight: 700, fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Truck size={18} color="var(--color-primary)" /> {profile?.vehicleType || '—'}
              </div>
            )}
          </div>

          <div>
            <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', color: 'var(--color-muted)', marginBottom: 4 }}>Vehicle Number</label>
            {isEditing ? (
              <input type="text" name="vehicleNumber" value={formData.vehicleNumber} onChange={handleChange} style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)' }} />
            ) : (
              <div style={{ fontWeight: 700, fontSize: '1.05rem' }}>{profile?.vehicleNumber || '—'}</div>
            )}
          </div>

          <div>
            <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', color: 'var(--color-muted)', marginBottom: 4 }}>Driver License ID</label>
            {isEditing ? (
              <input type="text" name="licenseNumber" value={formData.licenseNumber} onChange={handleChange} style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)' }} />
            ) : (
              <div style={{ fontWeight: 700, fontSize: '1.05rem' }}>{profile?.licenseNumber || '—'}</div>
            )}
          </div>

          <div>
            <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', color: 'var(--color-muted)' }}>Fulfillment Rating</label>
            <div style={{ fontWeight: 700, fontSize: '1.05rem', marginTop: 4 }}>
              {loading ? '—' : (
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <ShieldCheck size={18} color="#16a34a" /> 4.9 / 5.0 (Excellent)
                </span>
              )}
            </div>
          </div>
        </div>

        {isEditing && (
          <div style={{ marginTop: 32, display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--color-border)', paddingTop: 24 }}>
            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '10px 24px',
                background: 'var(--color-primary)', color: '#fff', border: 'none', borderRadius: 'var(--radius-md)', cursor: saving ? 'not-allowed' : 'pointer', fontWeight: 600, fontSize: '1rem'
              }}
            >
              {saving ? <RefreshCw size={18} className="spin" /> : <Save size={18} />}
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
