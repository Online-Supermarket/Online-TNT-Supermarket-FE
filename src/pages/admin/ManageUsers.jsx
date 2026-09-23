import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Users, UserCheck, UserX, Shield, Search, RefreshCw, Plus,
  X, CheckCircle, AlertOctagon, Filter, ChevronDown, ChevronUp,
  Edit3, Mail, Calendar, Hash
} from 'lucide-react';
import axiosInstance from '../../services/axiosInstance';

// ── Role metadata ─────────────────────────────────────────────────────────────
const ROLE_META = {
  OperationsAdmin: { label: 'Admin',          bg: '#fef3c7', color: '#92400e', border: '#fde68a' },
  Staff:          { label: 'Staff',           bg: '#ede9fe', color: '#5b21b6', border: '#ddd6fe' },
  Dispatcher:     { label: 'Dispatcher',      bg: '#fce7f3', color: '#9d174d', border: '#fbcfe8' },
  Courier:        { label: 'Driver',          bg: '#ffedd5', color: '#9a3412', border: '#fed7aa' },
  Customer:       { label: 'Customer',        bg: '#dcfce7', color: '#166534', border: '#bbf7d0' },
  // Legacy labels for backward compatibility display
  CatalogStaff:   { label: 'Catalog Staff (Legacy)',   bg: '#dbeafe', color: '#1e40af', border: '#bfdbfe' },
  InventoryStaff: { label: 'Inventory Staff (Legacy)', bg: '#ede9fe', color: '#5b21b6', border: '#ddd6fe' },
};
const ALL_ROLES = ['OperationsAdmin', 'Staff', 'Dispatcher', 'Courier', 'Customer'];

const RoleBadge = ({ role }) => {
  const m = ROLE_META[role] || { label: role, bg: '#f3f4f6', color: '#374151', border: '#e5e7eb' };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 3,
      padding: '2px 9px', borderRadius: 12, fontSize: '0.72rem', fontWeight: 700,
      background: m.bg, color: m.color, border: `1px solid ${m.border}`,
    }}>
      <Shield size={10} /> {m.label}
    </span>
  );
};

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

// ── Feedback banner ───────────────────────────────────────────────────────────
const Feedback = ({ msg, onClose }) => msg ? (
  <div style={{
    padding: '14px 20px', borderRadius: 10, marginBottom: 20, fontSize: '0.88rem', fontWeight: 600,
    background: msg.type === 'success' ? '#f0fdf4' : '#fef2f2',
    border: `1px solid ${msg.type === 'success' ? '#bbf7d0' : '#fecaca'}`,
    color: msg.type === 'success' ? '#166534' : '#991b1b',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    animation: 'fadeIn 0.2s ease-out',
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      {msg.type === 'success' ? <CheckCircle size={18} /> : <AlertOctagon size={18} />}
      {msg.text}
    </div>
    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', padding: 4 }}>
      <X size={15} />
    </button>
  </div>
) : null;

// ── Main Component ────────────────────────────────────────────────────────────
export const ManageUsers = () => {
  const [users, setUsers]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [feedback, setFeedback] = useState(null);

  // Filters
  const [search, setSearch]         = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL'); // ALL | ACTIVE | INACTIVE

  // Sort
  const [sortKey, setSortKey] = useState('createdAt');
  const [sortDir, setSortDir] = useState('desc');

  // Create user modal
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating]     = useState(false);
  const [newEmail, setNewEmail]     = useState('');
  const [newName, setNewName]       = useState('');
  const [newPass, setNewPass]       = useState('');
  const [newRoles, setNewRoles]     = useState(['Staff']);

  // Edit roles modal
  const [editUser, setEditUser]     = useState(null);
  const [editRoles, setEditRoles]   = useState([]);
  const [savingRoles, setSavingRoles] = useState(false);

  const showFeedback = (type, text) => {
    setFeedback({ type, text });
    setTimeout(() => setFeedback(null), 6000);
  };

  // ── Fetch ─────────────────────────────────────────────────────────────────
  const fetchUsers = useCallback(async (silent = false) => {
    if (!silent) setLoading(true); else setRefreshing(true);
    try {
      const data = await axiosInstance.get('/identity/admin/users');
      setUsers(Array.isArray(data) ? data : []);
    } catch (e) {
      showFeedback('error', e?.message || 'Failed to load users.');
    } finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  // ── KPI counts ────────────────────────────────────────────────────────────
  const totalActive   = useMemo(() => users.filter(u => u.active).length,  [users]);
  const totalInactive = useMemo(() => users.filter(u => !u.active).length, [users]);
  const roleGroups    = useMemo(() => {
    const counts = {};
    users.forEach(u => (u.roles || []).forEach(r => { counts[r] = (counts[r] || 0) + 1; }));
    return counts;
  }, [users]);

  // ── Filtered + sorted list ────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let rows = users;

    if (statusFilter === 'ACTIVE')   rows = rows.filter(u => u.active);
    if (statusFilter === 'INACTIVE') rows = rows.filter(u => !u.active);

    if (roleFilter !== 'ALL') {
      if (roleFilter === 'Staff') {
        rows = rows.filter(u => (u.roles || []).some(r => r === 'Staff' || r === 'CatalogStaff' || r === 'InventoryStaff'));
      } else {
        rows = rows.filter(u => (u.roles || []).includes(roleFilter));
      }
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      rows = rows.filter(u =>
        u.displayName?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q)
      );
    }

    return [...rows].sort((a, b) => {
      let av = a[sortKey], bv = b[sortKey];
      if (typeof av === 'string') { av = av.toLowerCase(); bv = bv.toLowerCase(); }
      return av < bv ? (sortDir === 'asc' ? -1 : 1) : av > bv ? (sortDir === 'asc' ? 1 : -1) : 0;
    });
  }, [users, search, roleFilter, statusFilter, sortKey, sortDir]);

  const toggleSort = (key) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  };
  const SortIcon = ({ k }) => sortKey === k ? (sortDir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />) : null;

  // ── Create user ───────────────────────────────────────────────────────────
  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newEmail || !newName || !newPass || newRoles.length === 0) {
      showFeedback('error', 'All fields are required and at least one role must be selected.');
      return;
    }
    setCreating(true);
    try {
      await axiosInstance.post('/identity/admin/users', {
        email: newEmail.trim(),
        displayName: newName.trim(),
        password: newPass,
        roles: newRoles,
      });
      showFeedback('success', `Account for "${newName}" created successfully.`);
      setShowCreate(false);
      setNewEmail(''); setNewName(''); setNewPass(''); setNewRoles(['Staff']);
      await fetchUsers(true);
    } catch (e) {
      showFeedback('error', e?.message || 'Failed to create user.');
    } finally { setCreating(false); }
  };

  // ── Edit roles ────────────────────────────────────────────────────────────
  const openEditRoles = (u) => {
    setEditUser(u);
    setEditRoles([...(u.roles || [])]);
  };
  const toggleEditRole = (role) => {
    setEditRoles(prev => prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]);
  };
  const handleSaveRoles = async () => {
    if (editRoles.length === 0) { showFeedback('error', 'At least one role must be assigned.'); return; }
    setSavingRoles(true);
    try {
      await axiosInstance.put(`/identity/admin/users/${editUser.id}/roles`, { roles: editRoles });
      showFeedback('success', `Roles updated for "${editUser.displayName}".`);
      setEditUser(null);
      await fetchUsers(true);
    } catch (e) {
      showFeedback('error', e?.message || 'Failed to update roles.');
    } finally { setSavingRoles(false); }
  };

  // ── Styles ────────────────────────────────────────────────────────────────
  const thStyle = {
    padding: '10px 14px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700,
    color: '#6b7280', background: '#f9fafb', borderBottom: '1px solid #e5e7eb',
    cursor: 'pointer', whiteSpace: 'nowrap', userSelect: 'none',
  };
  const tdStyle = { padding: '12px 14px', borderBottom: '1px solid #f3f4f6', fontSize: '0.875rem', verticalAlign: 'middle' };
  const inputStyle = {
    width: '100%', padding: '9px 12px', border: '1.5px solid #d1d5db',
    borderRadius: 8, fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box',
  };

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300, color: '#6b7280' }}>
      <RefreshCw size={28} style={{ animation: 'spin 1s linear infinite', marginRight: 12 }} />
      Loading users…
    </div>
  );

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
            <div style={{ background: 'var(--color-soft-mint)', color: 'var(--color-primary)', padding: 8, borderRadius: 10, display: 'grid', placeItems: 'center' }}>
              <Users size={26} />
            </div>
            <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '2rem', color: 'var(--color-primary-dark)', margin: 0 }}>
              User Accounts &amp; Role Permissions
            </h1>
          </div>
          <p style={{ color: 'var(--color-muted)', margin: 0, fontSize: '0.975rem' }}>
            View all registered users, manage roles, and create staff / admin accounts.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-outline" onClick={() => fetchUsers(true)} disabled={refreshing}
            style={{ display: 'flex', alignItems: 'center', gap: 8, height: 42 }}>
            <RefreshCw size={16} style={refreshing ? { animation: 'spin 1s linear infinite' } : {}} />
            {refreshing ? 'Refreshing…' : 'Refresh'}
          </button>
          <button className="btn btn-primary" onClick={() => setShowCreate(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 8, height: 42 }}>
            <Plus size={16} /> Create Account
          </button>
        </div>
      </div>

      <Feedback msg={feedback} onClose={() => setFeedback(null)} />

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 14, marginBottom: 28 }}>
        {/* Total */}
        <div className="kpi-card" style={{ borderLeft: '4px solid #2563eb', cursor: 'pointer' }}
          onClick={() => { setStatusFilter('ALL'); setRoleFilter('ALL'); }}>
          <div className="kpi-icon" style={{ background: '#dbeafe', color: '#1d4ed8' }}><Users size={22} /></div>
          <div>
            <div style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--color-muted)', fontWeight: 700 }}>Total Users</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#1d4ed8' }}>{users.length}</div>
          </div>
        </div>
        {/* Active */}
        <div className="kpi-card" style={{ borderLeft: '4px solid #16a34a', cursor: 'pointer' }}
          onClick={() => setStatusFilter('ACTIVE')}>
          <div className="kpi-icon" style={{ background: '#dcfce7', color: '#16a34a' }}><UserCheck size={22} /></div>
          <div>
            <div style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--color-muted)', fontWeight: 700 }}>Active</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#16a34a' }}>{totalActive}</div>
          </div>
        </div>
        {/* Inactive */}
        <div className="kpi-card" style={{ borderLeft: totalInactive > 0 ? '4px solid #dc2626' : '4px solid var(--color-border)', cursor: 'pointer' }}
          onClick={() => setStatusFilter('INACTIVE')}>
          <div className="kpi-icon" style={{ background: totalInactive > 0 ? '#fee2e2' : 'var(--color-soft-mint)', color: totalInactive > 0 ? '#dc2626' : 'var(--color-primary)' }}>
            <UserX size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--color-muted)', fontWeight: 700 }}>Inactive</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: totalInactive > 0 ? '#dc2626' : 'var(--color-ink-dark)' }}>{totalInactive}</div>
          </div>
        </div>
        {/* Admins */}
        <div className="kpi-card" style={{ borderLeft: '4px solid #d97706', cursor: 'pointer' }}
          onClick={() => setRoleFilter('OperationsAdmin')}>
          <div className="kpi-icon" style={{ background: '#fef3c7', color: '#d97706' }}><Shield size={22} /></div>
          <div>
            <div style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--color-muted)', fontWeight: 700 }}>Admins</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#d97706' }}>{roleGroups['OperationsAdmin'] || 0}</div>
          </div>
        </div>
        {/* Staff */}
        <div className="kpi-card" style={{ borderLeft: '4px solid #4f46e5', cursor: 'pointer' }}
          onClick={() => { setRoleFilter('Staff'); }}>
          <div className="kpi-icon" style={{ background: '#ede9fe', color: '#4f46e5' }}><Hash size={22} /></div>
          <div>
            <div style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--color-muted)', fontWeight: 700 }}>Staff Members</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#4f46e5' }}>
              {(roleGroups['Staff'] || 0) + (roleGroups['CatalogStaff'] || 0) + (roleGroups['InventoryStaff'] || 0)}
            </div>
          </div>
        </div>
      </div>

      {/* Main Card */}
      <div style={{ background: '#fff', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden' }}>

        {/* Toolbar */}
        <div style={{ display: 'flex', alignItems: 'center', padding: '14px 20px', borderBottom: '1px solid var(--color-border)', background: '#fafbfa', flexWrap: 'wrap', gap: 12 }}>
          {/* Search */}
          <div style={{ position: 'relative', flex: '1 1 220px', minWidth: 200 }}>
            <Search size={15} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or email…"
              style={{ ...inputStyle, padding: '8px 12px 8px 34px', border: '1px solid var(--color-border)' }} />
            {search && <button onClick={() => setSearch('')} style={{ position: 'absolute', right: 9, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af' }}><X size={14} /></button>}
          </div>

          {/* Role filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Filter size={14} style={{ color: '#9ca3af' }} />
            <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)}
              style={{ padding: '8px 12px', border: '1px solid var(--color-border)', borderRadius: 8, fontSize: '0.875rem', background: '#fff', outline: 'none', fontWeight: 600 }}>
              <option value="ALL">All Roles</option>
              {ALL_ROLES.map(r => <option key={r} value={r}>{ROLE_META[r]?.label || r}</option>)}
            </select>
          </div>

          {/* Status filter pills */}
          <div style={{ display: 'flex', gap: 6 }}>
            {[
              { key: 'ALL',      label: 'All',       count: users.length },
              { key: 'ACTIVE',   label: 'Active',    count: totalActive },
              { key: 'INACTIVE', label: 'Inactive',  count: totalInactive },
            ].map(({ key, label, count }) => {
              const sel = statusFilter === key;
              const selColor = key === 'INACTIVE' ? '#dc2626' : key === 'ACTIVE' ? '#16a34a' : '#2563eb';
              return (
                <button key={key} onClick={() => setStatusFilter(key)}
                  style={{
                    padding: '6px 12px', borderRadius: 'var(--radius-full)', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s',
                    border: `1.5px solid ${sel ? selColor : '#d1d5db'}`,
                    background: sel ? (key === 'INACTIVE' ? '#fee2e2' : key === 'ACTIVE' ? '#dcfce7' : '#eff6ff') : '#fff',
                    color: sel ? selColor : '#374151',
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                  }}>
                  {label}
                  <span style={{ fontSize: '0.72rem', padding: '1px 6px', borderRadius: 10, background: 'rgba(0,0,0,0.08)', fontWeight: 800 }}>{count}</span>
                </button>
              );
            })}
          </div>

          <div style={{ marginLeft: 'auto', fontSize: '0.8rem', color: '#6b7280', flexShrink: 0 }}>
            {filtered.length} of {users.length} user{users.length !== 1 ? 's' : ''}
          </div>
        </div>

        {/* Table */}
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <Users size={48} style={{ color: 'var(--color-muted)', margin: '0 auto 16px', opacity: 0.4 }} />
            <h3 style={{ fontSize: '1.2rem', color: 'var(--color-primary-dark)', marginBottom: 6 }}>
              {search || roleFilter !== 'ALL' || statusFilter !== 'ALL' ? 'No users match your filters.' : 'No users found.'}
            </h3>
            {(search || roleFilter !== 'ALL' || statusFilter !== 'ALL') && (
              <button className="btn btn-secondary" onClick={() => { setSearch(''); setRoleFilter('ALL'); setStatusFilter('ALL'); }} style={{ marginTop: 12 }}>
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={thStyle} onClick={() => toggleSort('displayName')}>Name <SortIcon k="displayName" /></th>
                  <th style={thStyle} onClick={() => toggleSort('email')}>Email <SortIcon k="email" /></th>
                  <th style={{ ...thStyle }}>Roles</th>
                  <th style={{ ...thStyle, textAlign: 'center' }}>Status</th>
                  <th style={{ ...thStyle }} onClick={() => toggleSort('createdAt')}>Joined <SortIcon k="createdAt" /></th>
                  <th style={{ ...thStyle, textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(u => (
                  <tr key={u.id}
                    onMouseEnter={e => e.currentTarget.style.background = '#f9fafb'}
                    onMouseLeave={e => e.currentTarget.style.background = ''}
                    style={{ transition: 'background 0.1s' }}>

                    {/* Name */}
                    <td style={tdStyle}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                          width: 38, height: 38, borderRadius: '50%', flexShrink: 0, display: 'grid', placeItems: 'center',
                          background: 'var(--color-soft-mint)', color: 'var(--color-primary)', fontWeight: 800, fontSize: '1rem',
                        }}>
                          {u.displayName?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, color: '#111827' }}>{u.displayName}</div>
                          <div style={{ fontSize: '0.72rem', color: '#9ca3af', fontFamily: 'monospace' }}>
                            {u.id?.slice(0, 8)}…
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Email */}
                    <td style={tdStyle}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#374151' }}>
                        <Mail size={13} style={{ color: '#9ca3af', flexShrink: 0 }} />
                        {u.email}
                      </div>
                    </td>

                    {/* Roles */}
                    <td style={tdStyle}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                        {(u.roles || []).map(r => <RoleBadge key={r} role={r} />)}
                        {(!u.roles || u.roles.length === 0) && <span style={{ color: '#9ca3af', fontSize: '0.8rem', fontStyle: 'italic' }}>No roles</span>}
                      </div>
                    </td>

                    {/* Status */}
                    <td style={{ ...tdStyle, textAlign: 'center' }}>
                      {u.active ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px', borderRadius: 12, fontSize: '0.78rem', fontWeight: 700, background: '#dcfce7', color: '#15803d', border: '1px solid #bbf7d0' }}>
                          <CheckCircle size={12} /> Active
                        </span>
                      ) : (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px', borderRadius: 12, fontSize: '0.78rem', fontWeight: 700, background: '#fee2e2', color: '#b91c1c', border: '1px solid #fecaca' }}>
                          <X size={12} /> Inactive
                        </span>
                      )}
                    </td>

                    {/* Joined */}
                    <td style={tdStyle}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#6b7280', fontSize: '0.82rem' }}>
                        <Calendar size={13} style={{ flexShrink: 0 }} />
                        {fmtDate(u.createdAt)}
                      </div>
                    </td>

                    {/* Actions */}
                    <td style={{ ...tdStyle, textAlign: 'center' }}>
                      <button onClick={() => openEditRoles(u)}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 8, border: '1.5px solid #d1d5db', background: '#fff', color: '#374151', fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer' }}
                        title="Edit Roles">
                        <Edit3 size={13} /> Edit Roles
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── CREATE USER MODAL ── */}
      {showCreate && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.65)', backdropFilter: 'blur(4px)', display: 'grid', placeItems: 'center', zIndex: 1000, padding: 20 }}>
          <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 520, boxShadow: '0 20px 60px rgba(0,0,0,0.25)', overflow: 'hidden', animation: 'fadeIn 0.2s ease-out' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ background: 'var(--color-soft-mint)', color: 'var(--color-primary)', padding: 6, borderRadius: 8 }}><Plus size={20} /></div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--color-primary-dark)' }}>Create Staff / Admin Account</h3>
              </div>
              <button onClick={() => setShowCreate(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280' }}><X size={20} /></button>
            </div>
            <form onSubmit={handleCreate}>
              <div style={{ padding: 24 }}>
                <div style={{ marginBottom: 14 }}>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#374151', marginBottom: 4 }}>Display Name <span style={{ color: '#dc2626' }}>*</span></label>
                  <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="e.g. Jane Smith" required style={inputStyle} />
                </div>
                <div style={{ marginBottom: 14 }}>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#374151', marginBottom: 4 }}>Email Address <span style={{ color: '#dc2626' }}>*</span></label>
                  <input type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="jane@tnt.local" required style={inputStyle} />
                </div>
                <div style={{ marginBottom: 18 }}>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#374151', marginBottom: 4 }}>Temporary Password <span style={{ color: '#dc2626' }}>*</span></label>
                  <input type="password" value={newPass} onChange={e => setNewPass(e.target.value)} placeholder="Min 8 chars" required style={inputStyle} />
                </div>
                <div style={{ marginBottom: 10 }}>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#374151', marginBottom: 8 }}>Assign Roles <span style={{ color: '#dc2626' }}>*</span></label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {ALL_ROLES.filter(r => r !== 'Customer').map(r => {
                      const m = ROLE_META[r];
                      const sel = newRoles.includes(r);
                      return (
                        <button key={r} type="button" onClick={() => setNewRoles(prev => sel ? prev.filter(x => x !== r) : [...prev, r])}
                          style={{ padding: '5px 12px', borderRadius: 20, border: `1.5px solid ${sel ? m.color : '#d1d5db'}`, background: sel ? m.bg : '#fff', color: sel ? m.color : '#374151', fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer' }}>
                          {m.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
              <div style={{ padding: '16px 24px', background: '#f8fafc', borderTop: '1px solid var(--color-border)', display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowCreate(false)} disabled={creating}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={creating || newRoles.length === 0} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {creating ? <><RefreshCw size={15} style={{ animation: 'spin 1s linear infinite' }} /> Creating…</> : <><Plus size={15} /> Create Account</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── EDIT ROLES MODAL ── */}
      {editUser && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.65)', backdropFilter: 'blur(4px)', display: 'grid', placeItems: 'center', zIndex: 1000, padding: 20 }}>
          <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 480, boxShadow: '0 20px 60px rgba(0,0,0,0.25)', overflow: 'hidden', animation: 'fadeIn 0.2s ease-out' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ background: '#ede9fe', color: '#5b21b6', padding: 6, borderRadius: 8 }}><Edit3 size={20} /></div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--color-primary-dark)' }}>Edit Roles</h3>
              </div>
              <button onClick={() => setEditUser(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280' }}><X size={20} /></button>
            </div>
            <div style={{ padding: 24 }}>
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: '12px 16px', marginBottom: 20 }}>
                <div style={{ fontWeight: 700, color: 'var(--color-primary-dark)' }}>{editUser.displayName}</div>
                <div style={{ fontSize: '0.82rem', color: '#6b7280' }}>{editUser.email}</div>
              </div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#374151', marginBottom: 10 }}>Select Roles</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {ALL_ROLES.map(r => {
                  const m = ROLE_META[r];
                  const sel = editRoles.includes(r);
                  return (
                    <button key={r} type="button" onClick={() => toggleEditRole(r)}
                      style={{ padding: '6px 14px', borderRadius: 20, border: `1.5px solid ${sel ? m.color : '#d1d5db'}`, background: sel ? m.bg : '#fff', color: sel ? m.color : '#374151', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                      {sel && <CheckCircle size={12} />}
                      {m.label}
                    </button>
                  );
                })}
              </div>
              {editRoles.length === 0 && (
                <div style={{ marginTop: 12, color: '#dc2626', fontSize: '0.82rem', fontWeight: 600 }}>⚠ At least one role must be assigned.</div>
              )}
            </div>
            <div style={{ padding: '16px 24px', background: '#f8fafc', borderTop: '1px solid var(--color-border)', display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <button className="btn btn-outline" onClick={() => setEditUser(null)} disabled={savingRoles}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSaveRoles} disabled={savingRoles || editRoles.length === 0} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {savingRoles ? <><RefreshCw size={15} style={{ animation: 'spin 1s linear infinite' }} /> Saving…</> : <><CheckCircle size={15} /> Save Roles</>}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{"@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}} @keyframes fadeIn{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:translateY(0)}}"}</style>
    </div>
  );
};

export default ManageUsers;
