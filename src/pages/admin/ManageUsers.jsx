import React, { useState } from 'react';
import { UserCheck, UserX, Shield } from 'lucide-react';

export const ManageUsers = () => {
  const [users, setUsers] = useState([]);
  const [roleFilter, setRoleFilter] = useState('ALL');

  const toggleStatus = (id) => {
    setUsers(users.map(u => u.id === id ? { ...u, active: !u.active } : u));
  };

  const filtered = users.filter(u => roleFilter === 'ALL' || u.role === roleFilter);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '2.2rem', color: 'var(--color-primary-dark)' }}>
            User Accounts &amp; Role Permissions
          </h1>
          <p style={{ color: 'var(--color-muted)' }}>Inspect active system roles and manage account activation status.</p>
        </div>

        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          style={{ padding: '10px 16px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', fontWeight: 600 }}
        >
          <option value="ALL">Filter All Roles</option>
          <option value="CUSTOMER">Customer</option>
          <option value="ADMIN">Admin</option>
          <option value="STAFF">Staff</option>
          <option value="DELIVERY">Delivery Driver</option>
        </select>
      </div>

      <div style={{ background: '#ffffff', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: 24, boxShadow: 'var(--shadow-sm)' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>User Name</th>
              <th>Email</th>
              <th>System Role</th>
              <th>Account Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: 32, color: 'var(--color-muted)' }}>
                  No users to display.
                </td>
              </tr>
            ) : filtered.map(u => (
              <tr key={u.id}>
                <td><strong>{u.displayName}</strong></td>
                <td>{u.email}</td>
                <td>
                  <span className="status-pill status-confirmed" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <Shield size={12} /> {u.role}
                  </span>
                </td>
                <td>
                  {u.active ? (
                    <span className="status-pill status-delivered">Active</span>
                  ) : (
                    <span className="status-pill status-cancelled">Deactivated</span>
                  )}
                </td>
                <td>
                  <button
                    className="btn btn-ghost"
                    style={{ fontSize: '0.8rem', color: u.active ? '#dc2626' : 'var(--color-primary)' }}
                    onClick={() => toggleStatus(u.id)}
                  >
                    {u.active ? <><UserX size={14} /> Deactivate</> : <><UserCheck size={14} /> Activate</>}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
