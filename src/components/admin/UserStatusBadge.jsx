import React from 'react';
import { CheckCircle2, XCircle, Circle, Bike, Shield, Clock, UserCheck } from 'lucide-react';

export const AccountStatusBadge = ({ active, size = 'md' }) => {
  const isLarge = size === 'lg';
  if (active) {
    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 5,
          padding: isLarge ? '5px 12px' : '3px 9px',
          borderRadius: 20,
          fontSize: isLarge ? '0.85rem' : '0.75rem',
          fontWeight: 700,
          background: '#dcfce7',
          color: '#15803d',
          border: '1px solid #bbf7d0',
        }}
      >
        <CheckCircle2 size={isLarge ? 15 : 12} /> Active
      </span>
    );
  }

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        padding: isLarge ? '5px 12px' : '3px 9px',
        borderRadius: 20,
        fontSize: isLarge ? '0.85rem' : '0.75rem',
        fontWeight: 700,
        background: '#fee2e2',
        color: '#b91c1c',
        border: '1px solid #fecaca',
      }}
    >
      <XCircle size={isLarge ? 15 : 12} /> Inactive
    </span>
  );
};

export const AvailabilityBadge = ({ status = 'Available', size = 'md' }) => {
  const isLarge = size === 'lg';
  const norm = String(status || 'Available').toLowerCase();

  let bg = '#ecfdf5', color = '#047857', border = '#a7f3d0', label = 'Available', icon = <Circle size={isLarge ? 10 : 8} fill="#10b981" color="#10b981" />;
  if (norm === 'busy') {
    bg = '#fffbeb';
    color = '#b45309';
    border = '#fde68a';
    label = 'Busy';
    icon = <Clock size={isLarge ? 14 : 11} />;
  } else if (norm === 'offline') {
    bg = '#f3f4f6';
    color = '#4b5563';
    border = '#e5e7eb';
    label = 'Offline';
    icon = <Circle size={isLarge ? 10 : 8} fill="#9ca3af" color="#9ca3af" />;
  }

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: isLarge ? '5px 12px' : '3px 9px',
        borderRadius: 20,
        fontSize: isLarge ? '0.85rem' : '0.75rem',
        fontWeight: 700,
        background: bg,
        color: color,
        border: `1px solid ${border}`,
      }}
    >
      {icon} {label}
    </span>
  );
};

export const RoleBadge = ({ role = 'Staff' }) => {
  const norm = String(role || '').toLowerCase();
  let bg = '#ede9fe', color = '#6d28d9', border = '#ddd6fe', label = 'Staff', icon = <Shield size={11} />;

  if (norm === 'rider' || norm === 'courier' || norm === 'deliverydriver') {
    bg = '#e0f2fe';
    color = '#0369a1';
    border = '#bae6fd';
    label = 'Rider';
    icon = <Bike size={12} />;
  } else if (norm === 'operationsadmin' || norm === 'admin') {
    bg = '#fef3c7';
    color = '#b45309';
    border = '#fde68a';
    label = 'Admin';
  } else if (norm === 'customer') {
    bg = '#dcfce7';
    color = '#15803d';
    border = '#bbf7d0';
    label = 'Customer';
    icon = <UserCheck size={12} />;
  }

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        padding: '3px 9px',
        borderRadius: 14,
        fontSize: '0.75rem',
        fontWeight: 700,
        background: bg,
        color: color,
        border: `1px solid ${border}`,
      }}
    >
      {icon} {label}
    </span>
  );
};
