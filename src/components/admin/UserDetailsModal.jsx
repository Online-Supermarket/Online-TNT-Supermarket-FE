import React, { useState } from 'react';
import {
  X, Copy, Check, Mail, Phone, Store, Calendar, Shield, Truck, Clock, Car, Hash, FileText, MapPin, Home,
  UserCheck, Edit3, Power, PowerOff, ExternalLink, Trash2
} from 'lucide-react';
import { AccountStatusBadge, AvailabilityBadge, RoleBadge } from './UserStatusBadge';

/* ── date formatter ── */
const fmtDate = (d) => {
  if (!d) return '—';
  try {
    return new Date(d).toLocaleString('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  } catch { return String(d); }
};

/* ── single detail row ── */
const DetailRow = ({ icon: Icon, label, value, mono = false }) => (
  <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
    <div style={{
      width: 34, height: 34, borderRadius: 10,
      background: '#f1f5f9', display: 'grid', placeItems: 'center',
      color: '#64748b', flexShrink: 0,
    }}>
      <Icon size={15} />
    </div>
    <div style={{ minWidth: 0, flex: 1 }}>
      <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#94a3b8', marginBottom: 2 }}>
        {label}
      </div>
      <div style={{
        fontSize: '0.9rem', fontWeight: 600, color: '#0f172a',
        wordBreak: 'break-all',
        ...(mono ? { fontFamily: 'monospace', fontSize: '0.82rem' } : {}),
      }}>
        {value || '—'}
      </div>
    </div>
  </div>
);

export const UserDetailsModal = ({ user, type = 'staff', onClose, onEdit, onToggleStatus, onDelete }) => {
  const [copied, setCopied] = useState(false);

  if (!user) return null;

  const handleCopyId = () => {
    if (user.id) {
      navigator.clipboard.writeText(user.id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const isCustomer = type === 'customer' || (user.roles || []).includes('Customer');
  const isRider = !isCustomer && (type === 'rider' || (user.roles || []).some(r => ['Rider', 'Courier', 'DeliveryDriver'].includes(r)));
  const primaryRole = (user.roles && user.roles[0]) || (isCustomer ? 'Customer' : isRider ? 'Rider' : 'Staff');
  const accentColor = isCustomer ? '#059669' : isRider ? '#0284c7' : '#7c3aed';
  const accentDark = isCustomer ? '#047857' : isRider ? '#0369a1' : '#5b21b6';
  const accentLight = isCustomer ? '#dcfce7' : isRider ? '#e0f2fe' : '#ede9fe';

  /* initials for the avatar */
  const displayName = user.fullName || user.displayName || 'User';
  const initials = displayName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div
      style={{
        position: 'fixed', inset: 0,
        backgroundColor: 'rgba(15,23,42,0.7)',
        backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1050, padding: 16,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#fff', borderRadius: 20, width: '100%', maxWidth: 560,
          boxShadow: '0 32px 64px -12px rgba(0,0,0,0.3)',
          overflow: 'hidden',
          animation: 'modalSlideUp 0.22s cubic-bezier(0.16,1,0.3,1)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* ═══ Profile Header ═══ */}
        <div style={{
          background: `linear-gradient(135deg, ${accentColor} 0%, ${accentDark} 100%)`,
          padding: '28px 28px 24px',
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* subtle pattern overlay */}
          <div style={{ position: 'absolute', inset: 0, opacity: 0.06, background: 'repeating-linear-gradient(45deg, #fff 0px, #fff 1px, transparent 1px, transparent 8px)' }} />

          {/* close button */}
          <button onClick={onClose} style={{
            position: 'absolute', top: 14, right: 14,
            background: 'rgba(255,255,255,0.15)', border: 'none',
            width: 32, height: 32, borderRadius: 8,
            cursor: 'pointer', display: 'grid', placeItems: 'center',
            color: 'rgba(255,255,255,0.8)',
          }}>
            <X size={16} />
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16, position: 'relative', zIndex: 1 }}>
            {/* Avatar circle */}
            <div style={{
              width: 64, height: 64, borderRadius: 18,
              background: 'rgba(255,255,255,0.2)',
              backdropFilter: 'blur(8px)',
              border: '2px solid rgba(255,255,255,0.3)',
              display: 'grid', placeItems: 'center',
              fontSize: '1.4rem', fontWeight: 900, color: '#fff',
              letterSpacing: '0.05em',
              boxShadow: '0 8px 20px rgba(0,0,0,0.15)',
            }}>
              {initials}
            </div>

            <div>
              <h3 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800, color: '#fff' }}>
                {displayName}
              </h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                <RoleBadge role={primaryRole} />
                <AccountStatusBadge active={user.active} />
                {isRider && <AvailabilityBadge status={user.availabilityStatus} />}
              </div>
            </div>
          </div>
        </div>

        {/* ═══ Body ═══ */}
        <div style={{ padding: '24px 28px' }}>

          {/* ID Copy box */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '10px 14px',
            background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: 12,
            marginBottom: 22,
          }}>
            <div>
              <div style={{ fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', color: '#94a3b8', letterSpacing: '0.08em' }}>
                {isCustomer ? 'Customer ID' : isRider ? 'Rider ID' : 'Staff ID'}
              </div>
              <code style={{ fontSize: '0.82rem', color: '#334155', fontWeight: 600 }}>{user.id || '—'}</code>
            </div>
            <button onClick={handleCopyId} style={{
              display: 'flex', alignItems: 'center', gap: 5,
              background: copied ? '#dcfce7' : '#fff',
              border: `1.5px solid ${copied ? '#86efac' : '#e2e8f0'}`,
              padding: '7px 14px', borderRadius: 8,
              fontSize: '0.76rem', fontWeight: 700,
              color: copied ? '#15803d' : '#64748b',
              cursor: 'pointer', transition: 'all 0.15s',
            }}>
              {copied ? <Check size={13} /> : <Copy size={13} />}
              {copied ? 'Copied!' : 'Copy ID'}
            </button>
          </div>

          {/* ── Details Grid ── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '18px 24px', marginBottom: 22 }}>
            <DetailRow icon={Mail} label="Email Address" value={user.email} />
            <DetailRow icon={Phone} label="Phone Number" value={user.contactNumber} />
            {isRider && <DetailRow icon={MapPin} label="District" value={user.district} />}
            {isRider && <DetailRow icon={Home} label="Address" value={user.address} />}
            {!isCustomer && <DetailRow icon={Store} label="Assigned Store" value={user.assignedStore || 'TNT Central Supermarket'} />}
            <DetailRow icon={Shield} label="System Role" value={(user.roles || []).join(', ') || primaryRole} />
            <DetailRow icon={Calendar} label={isCustomer ? "Registered Date" : "Created Date"} value={fmtDate(user.createdAt)} />
            <DetailRow icon={Clock} label="Last Updated" value={fmtDate(user.updatedAt || user.createdAt)} />
          </div>

          {isRider && (
            <div style={{ marginBottom: 22, padding: '16px 18px', border: '1.5px solid #bae6fd', borderRadius: 12, background: '#f0f9ff' }}>
              <div style={{ color: '#0369a1', fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.08em', marginBottom: 14, textTransform: 'uppercase' }}>Vehicle Details</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px 24px' }}>
                <DetailRow icon={Car} label="Vehicle Type" value={user.vehicleType} />
                <DetailRow icon={Car} label="Vehicle Model" value={user.vehicleModel} />
                <DetailRow icon={Hash} label="Vehicle Number" value={user.vehicleNumber} mono />
                <DetailRow icon={FileText} label="License Number" value={user.licenseNumber} mono />
              </div>
            </div>
          )}

          {/* ── Rider delivery status card ── */}
          {isRider && (
            <div style={{
              padding: '14px 18px',
              background: user.availabilityStatus === 'Busy' ? '#fffbeb' : user.availabilityStatus === 'Offline' ? '#f8fafc' : '#f0fdf4',
              border: `1.5px solid ${user.availabilityStatus === 'Busy' ? '#fde68a' : user.availabilityStatus === 'Offline' ? '#e2e8f0' : '#bbf7d0'}`,
              borderRadius: 12,
              display: 'flex', alignItems: 'center', gap: 12,
            }}>
              <div style={{
                width: 38, height: 38, borderRadius: 10,
                background: user.availabilityStatus === 'Busy' ? '#fef3c7' : user.availabilityStatus === 'Offline' ? '#f1f5f9' : '#dcfce7',
                color: user.availabilityStatus === 'Busy' ? '#d97706' : user.availabilityStatus === 'Offline' ? '#6b7280' : '#16a34a',
                display: 'grid', placeItems: 'center', flexShrink: 0,
              }}>
                <Truck size={18} />
              </div>
              <div>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#374151' }}>Delivery Status</div>
                <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: 2 }}>
                  {user.availabilityStatus === 'Busy'
                    ? 'Currently on an active delivery assignment'
                    : user.availabilityStatus === 'Offline'
                      ? 'Rider is offline — not accepting orders'
                      : 'Ready to accept delivery assignments'}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ═══ Footer ═══ */}
        <div style={{
          padding: '16px 28px',
          background: '#f8fafc', borderTop: '1px solid #e5e7eb',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          gap: 10, flexWrap: 'wrap',
        }}>
          {/* left-side quick actions */}
          <div style={{ display: 'flex', gap: 8 }}>
            {onToggleStatus && (
              <button
                onClick={() => onToggleStatus(user)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '8px 16px', borderRadius: 10,
                  fontSize: '0.84rem', fontWeight: 700,
                  border: '1.5px solid',
                  cursor: 'pointer',
                  ...(user.active
                    ? { background: '#fffbeb', borderColor: '#fde68a', color: '#b45309' }
                    : { background: '#f0fdf4', borderColor: '#86efac', color: '#16a34a' }),
                }}
              >
                {user.active ? <PowerOff size={14} /> : <Power size={14} />}
                {user.active ? 'Deactivate' : 'Activate'}
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => {
                  const target = user;
                  onClose();
                  onDelete(target);
                }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '8px 16px', borderRadius: 10,
                  fontSize: '0.84rem', fontWeight: 700,
                  border: '1.5px solid #fecaca',
                  background: '#fef2f2', color: '#dc2626',
                  cursor: 'pointer',
                }}
              >
                <Trash2 size={14} /> Remove Account
              </button>
            )}
          </div>

          {/* right-side */}
          <div style={{ display: 'flex', gap: 8 }}>
            {onEdit && (
              <button
                onClick={() => onEdit(user)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '8px 18px', borderRadius: 10,
                  fontSize: '0.84rem', fontWeight: 700,
                  border: '1.5px solid #e2e8f0',
                  background: '#fff', color: '#374151',
                  cursor: 'pointer',
                }}
              >
                <Edit3 size={14} /> Edit Details
              </button>
            )}
            <button
              onClick={onClose}
              style={{
                padding: '8px 20px', borderRadius: 10,
                fontSize: '0.84rem', fontWeight: 700,
                border: 'none',
                background: accentColor, color: '#fff',
                cursor: 'pointer',
                boxShadow: `0 4px 12px ${accentColor}40`,
              }}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
