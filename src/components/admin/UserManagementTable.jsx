import React from 'react';
import {
  Eye, Edit3, UserCheck, UserX, ChevronUp, ChevronDown, RefreshCw,
  AlertTriangle, ShieldAlert, Bike, Shield, Store, Phone, Mail, Calendar, Trash2
} from 'lucide-react';
import { AccountStatusBadge, AvailabilityBadge, RoleBadge } from './UserStatusBadge';

export const UserManagementTable = ({
  type = 'staff', // 'staff' | 'rider' | 'customer'
  users = [],
  loading = false,
  error = null,
  unauthorized = false,
  sortKey = 'createdAt',
  sortDir = 'desc',
  onSort,
  onView,
  onEdit,
  onToggleStatus,
  onChangeAvailability,
  onDelete,
  onRetry,
}) => {
  const isRider = type === 'rider';
  const isCustomer = type === 'customer';

  const fmtDate = (d) => {
    if (!d) return '—';
    try {
      return new Date(d).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return String(d);
    }
  };

  const thStyle = {
    padding: '12px 16px',
    textAlign: 'left',
    fontSize: '0.75rem',
    fontWeight: 700,
    color: '#64748b',
    background: '#f8fafc',
    borderBottom: '1px solid #e2e8f0',
    cursor: onSort ? 'pointer' : 'default',
    whiteSpace: 'nowrap',
    userSelect: 'none',
  };

  const tdStyle = {
    padding: '14px 16px',
    borderBottom: '1px solid #f1f5f9',
    fontSize: '0.88rem',
    verticalAlign: 'middle',
  };

  const SortIcon = ({ colKey }) => {
    if (sortKey !== colKey) return null;
    return sortDir === 'asc' ? (
      <ChevronUp size={13} style={{ display: 'inline', marginLeft: 4 }} />
    ) : (
      <ChevronDown size={13} style={{ display: 'inline', marginLeft: 4 }} />
    );
  };

  // Unauthorized State
  if (unauthorized) {
    return (
      <div
        style={{
          background: '#ffffff',
          borderRadius: 16,
          border: '1px solid #fecaca',
          padding: '60px 24px',
          textAlign: 'center',
          boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
        }}
      >
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            background: '#fee2e2',
            color: '#dc2626',
            display: 'grid',
            placeItems: 'center',
            margin: '0 auto 16px',
          }}
        >
          <ShieldAlert size={32} />
        </div>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#991b1b', margin: '0 0 8px' }}>
          Access Denied
        </h3>
        <p style={{ color: '#b91c1c', maxWidth: 440, margin: '0 auto 20px', fontSize: '0.92rem' }}>
          You do not have permission to perform this action. Only users with the <strong>Admin</strong> role can view or manage {isCustomer ? 'customers' : isRider ? 'riders' : 'staff members'}.
        </p>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div
        style={{
          background: '#ffffff',
          borderRadius: 16,
          border: '1px solid #fed7aa',
          padding: '60px 24px',
          textAlign: 'center',
          boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
        }}
      >
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            background: '#ffedd5',
            color: '#ea580c',
            display: 'grid',
            placeItems: 'center',
            margin: '0 auto 16px',
          }}
        >
          <AlertTriangle size={32} />
        </div>
        <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#9a3412', margin: '0 0 8px' }}>
          {isCustomer ? 'Unable to load customers. Please try again.' : isRider ? 'Unable to load riders. Please try again.' : 'Unable to load staff members. Please try again.'}
        </h3>
        <p style={{ color: '#c2410c', maxWidth: 420, margin: '0 auto 20px', fontSize: '0.88rem' }}>
          {typeof error === 'string' ? error : 'A network or server error occurred while retrieving account records.'}
        </p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="btn btn-outline"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '9px 20px' }}
          >
            <RefreshCw size={15} /> Try Again
          </button>
        )}
      </div>
    );
  }

  // Loading State
  if (loading) {
    return (
      <div
        style={{
          background: '#ffffff',
          borderRadius: 16,
          border: '1px solid #e2e8f0',
          padding: '70px 24px',
          textAlign: 'center',
          boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
          color: '#64748b',
        }}
      >
        <RefreshCw size={32} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 16px', color: isCustomer ? '#059669' : isRider ? '#0284c7' : '#7c3aed' }} />
        <div style={{ fontSize: '1rem', fontWeight: 700, color: '#334155' }}>
          {isCustomer ? 'Loading customers...' : isRider ? 'Loading riders...' : 'Loading staff members...'}
        </div>
        <div style={{ fontSize: '0.82rem', color: '#94a3b8', marginTop: 4 }}>
          Retrieving live directory data from Identity Service
        </div>
      </div>
    );
  }

  // Empty State
  if (!users || users.length === 0) {
    return (
      <div
        style={{
          background: '#ffffff',
          borderRadius: 16,
          border: '1px dashed #cbd5e1',
          padding: '60px 24px',
          textAlign: 'center',
          boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)',
        }}
      >
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            background: '#f1f5f9',
            color: '#64748b',
            display: 'grid',
            placeItems: 'center',
            margin: '0 auto 16px',
          }}
        >
          {isCustomer ? <UserCheck size={28} /> : isRider ? <Bike size={28} /> : <Shield size={28} />}
        </div>
        <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1e293b', margin: '0 0 6px' }}>
          {isCustomer ? 'No customers found.' : isRider ? 'No riders found.' : 'No staff members found.'}
        </h4>
        <p style={{ color: '#64748b', fontSize: '0.88rem', margin: 0 }}>
          {isCustomer
            ? 'No customer accounts matched your search or filters.'
            : isRider
            ? 'No delivery rider accounts matched your search or filters.'
            : 'No supermarket staff members matched your search or filters.'}
        </p>
      </div>
    );
  }

  return (
    <div
      style={{
        background: '#ffffff',
        borderRadius: 16,
        border: '1px solid #e2e8f0',
        overflow: 'hidden',
        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.03)',
      }}
    >
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr>
              <th style={thStyle} onClick={() => onSort && onSort(isCustomer ? 'id' : isRider ? 'riderId' : 'staffId')}>
                {isCustomer ? 'Customer ID' : isRider ? 'Rider ID' : 'Staff ID'} <SortIcon colKey={isCustomer ? 'id' : isRider ? 'riderId' : 'staffId'} />
              </th>
              <th style={thStyle} onClick={() => onSort && onSort('fullName')}>
                Full Name <SortIcon colKey="fullName" />
              </th>
              <th style={thStyle} onClick={() => onSort && onSort('email')}>
                Email <SortIcon colKey="email" />
              </th>
              <th style={thStyle} onClick={() => onSort && onSort('contactNumber')}>
                Phone Number <SortIcon colKey="contactNumber" />
              </th>
              {isRider && <th style={thStyle} onClick={() => onSort && onSort('district')}>District <SortIcon colKey="district" /></th>}
              {isRider && <th style={thStyle} onClick={() => onSort && onSort('vehicleType')}>Vehicle Type <SortIcon colKey="vehicleType" /></th>}
              {isRider && <th style={thStyle} onClick={() => onSort && onSort('vehicleModel')}>Vehicle Model <SortIcon colKey="vehicleModel" /></th>}
              {isRider && <th style={thStyle} onClick={() => onSort && onSort('vehicleNumber')}>Vehicle Number <SortIcon colKey="vehicleNumber" /></th>}
              {isRider && <th style={thStyle} onClick={() => onSort && onSort('licenseNumber')}>License Number <SortIcon colKey="licenseNumber" /></th>}
              {!isRider && <th style={thStyle}>Role</th>}
              {!isRider && !isCustomer && (
                <th style={thStyle} onClick={() => onSort && onSort('assignedStore')}>
                  Store / Assigned Store <SortIcon colKey="assignedStore" />
                </th>
              )}
              {!isRider && <th style={thStyle} onClick={() => onSort && onSort('active')}>
                Account Status <SortIcon colKey="active" />
              </th>}
              {!isRider && <th style={thStyle} onClick={() => onSort && onSort('createdAt')}>
                {isCustomer ? 'Registered Date' : 'Created Date'} <SortIcon colKey="createdAt" />
              </th>}
              {!isRider && (
                <th style={thStyle} onClick={() => onSort && onSort('updatedAt')}>
                  Last Updated <SortIcon colKey="updatedAt" />
                </th>
              )}
              <th style={{ ...thStyle, textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => {
              const riderId = u.riderId || u.id;
              const shortId = riderId ? `${riderId.substring(0, 8)}…` : '—';
              const name = u.fullName || u.displayName || '—';
              const phone = u.contactNumber || '—';
              const role = isCustomer ? 'Customer' : isRider ? 'Rider' : 'Staff';
              const store = u.assignedStore || 'TNT Central Supermarket';

              return (
                <tr
                  key={u.id}
                  style={{ transition: 'background-color 0.15s ease' }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f8fafc')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '')}
                >
                  {/* ID */}
                  <td style={tdStyle}>
                    <code
                      title={u.id}
                      style={{
                        padding: '3px 7px',
                        background: '#f1f5f9',
                        borderRadius: 6,
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        color: '#475569',
                      }}
                    >
                      {isRider ? riderId || '—' : shortId}
                    </code>
                  </td>

                  {/* Name */}
                  <td style={tdStyle}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: '50%',
                          background: isCustomer ? '#dcfce7' : isRider ? '#e0f2fe' : '#ede9fe',
                          color: isCustomer ? '#15803d' : isRider ? '#0369a1' : '#6d28d9',
                          fontWeight: 700,
                          fontSize: '0.8rem',
                          display: 'grid',
                          placeItems: 'center',
                          flexShrink: 0,
                        }}
                      >
                        {name.charAt(0).toUpperCase()}
                      </div>
                      <div style={{ fontWeight: 600, color: '#1e293b' }}>{name}</div>
                    </div>
                  </td>

                  {/* Email */}
                  <td style={{ ...tdStyle, color: '#475569', fontSize: '0.85rem' }}>
                    {u.email}
                  </td>

                  {/* Phone */}
                  <td style={{ ...tdStyle, color: '#475569', fontSize: '0.85rem' }}>
                    {phone}
                  </td>

                  {isRider && <td style={{ ...tdStyle, color: '#475569', fontSize: '0.85rem' }}>{u.district || '—'}</td>}
                  {isRider && <td style={{ ...tdStyle, color: '#475569', fontSize: '0.85rem' }}>{u.vehicleType || '—'}</td>}
                  {isRider && <td style={{ ...tdStyle, color: '#475569', fontSize: '0.85rem' }}>{u.vehicleModel || '—'}</td>}
                  {isRider && <td style={{ ...tdStyle, color: '#475569', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>{u.vehicleNumber || '—'}</td>}
                  {isRider && <td style={{ ...tdStyle, color: '#475569', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>{u.licenseNumber || '—'}</td>}

                  {/* Role */}
                  {!isRider && <td style={tdStyle}>
                    <RoleBadge role={role} />
                  </td>}

                  {/* Store (Staff only) */}
                  {!isRider && !isCustomer && (
                    <td style={{ ...tdStyle, color: '#334155', fontWeight: 500 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Store size={14} style={{ color: '#94a3b8' }} />
                        <span style={{ fontSize: '0.85rem' }}>{store}</span>
                      </div>
                    </td>
                  )}

                  {/* Account Status */}
                  {!isRider && <td style={tdStyle}>
                    <AccountStatusBadge active={u.active} />
                  </td>}

                  {/* Created Date */}
                  {!isRider && <td style={{ ...tdStyle, color: '#64748b', fontSize: '0.82rem', whiteSpace: 'nowrap' }}>
                    {fmtDate(u.createdAt)}
                  </td>}

                  {/* Last Updated Date (Staff only) */}
                  {!isRider && (
                    <td style={{ ...tdStyle, color: '#64748b', fontSize: '0.82rem', whiteSpace: 'nowrap' }}>
                      {fmtDate(u.updatedAt || u.createdAt)}
                    </td>
                  )}

                  {/* Actions */}
                  <td style={{ ...tdStyle, textAlign: 'right', whiteSpace: 'nowrap' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      {/* View */}
                      <button
                        onClick={() => onView && onView(u)}
                        title="View Details"
                        style={{
                          background: '#f1f5f9',
                          border: '1px solid #cbd5e1',
                          padding: '6px 10px',
                          borderRadius: 8,
                          cursor: 'pointer',
                          color: '#334155',
                          fontSize: '0.78rem',
                          fontWeight: 600,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                        }}
                      >
                        <Eye size={13} /> View
                      </button>

                      {/* Edit */}
                      <button
                        onClick={() => onEdit && onEdit(u)}
                        title="Edit Account"
                        style={{
                          background: '#f8fafc',
                          border: '1px solid #cbd5e1',
                          padding: '6px 10px',
                          borderRadius: 8,
                          cursor: 'pointer',
                          color: '#0284c7',
                          fontSize: '0.78rem',
                          fontWeight: 600,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                        }}
                      >
                        <Edit3 size={13} /> Edit
                      </button>

                      {/* Activate / Deactivate */}
                      <button
                        onClick={() => onToggleStatus && onToggleStatus(u)}
                        title={u.active ? 'Deactivate Account' : 'Activate Account'}
                        style={{
                          background: u.active ? '#fffbeb' : '#f0fdf4',
                          border: `1px solid ${u.active ? '#fde68a' : '#bbf7d0'}`,
                          padding: '6px 10px',
                          borderRadius: 8,
                          cursor: 'pointer',
                          color: u.active ? '#b45309' : '#16a34a',
                          fontSize: '0.78rem',
                          fontWeight: 600,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                        }}
                      >
                        {u.active ? <UserX size={13} /> : <UserCheck size={13} />}
                        {u.active ? 'Deactivate' : 'Activate'}
                      </button>

                      {/* Remove / Delete */}
                      {onDelete && (
                        <button
                          onClick={() => onDelete(u)}
                          title="Permanently Remove Account"
                          style={{
                            background: '#fef2f2',
                            border: '1px solid #fecaca',
                            padding: '6px 10px',
                            borderRadius: 8,
                            cursor: 'pointer',
                            color: '#dc2626',
                            fontSize: '0.78rem',
                            fontWeight: 600,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                          }}
                        >
                          <Trash2 size={13} /> Remove
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
