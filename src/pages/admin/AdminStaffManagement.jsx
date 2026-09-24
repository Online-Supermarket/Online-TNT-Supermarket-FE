import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Users, UserCheck, UserX, Store, Search, RefreshCw, Plus,
  X, CheckCircle, AlertOctagon, Filter, ShieldAlert, Trash2
} from 'lucide-react';
import axiosInstance from '../../services/axiosInstance';
import { useAuth } from '../../context/AuthContext';
import { UserManagementTable } from '../../components/admin/UserManagementTable';
import { StaffFormModal } from '../../components/admin/StaffFormModal';
import { UserDetailsModal } from '../../components/admin/UserDetailsModal';

// Retained for the staff-directory filter only. Staff creation no longer asks
// the administrator to assign a store.
const SUPERMARKET_STORES = [
  'TNT Central Supermarket - Colombo',
  'TNT Supermarket - Kandy City Centre',
  'TNT Express - Galle Fort',
  'TNT Supermarket - Negombo Coastal',
  'TNT Warehouse & Distribution Hub',
];

export const AdminStaffManagement = () => {
  const { user, activeRole } = useAuth();
  const isAdmin = activeRole === 'ADMIN' || (user?.roles || []).includes('OperationsAdmin');

  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [feedback, setFeedback] = useState(null);

  // Filters & Search
  const [searchName, setSearchName] = useState('');
  const [searchEmail, setSearchEmail] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // ALL | Active | Inactive
  const [storeFilter, setStoreFilter] = useState('ALL');

  // Sorting
  const [sortKey, setSortKey] = useState('createdAt');
  const [sortDir, setSortDir] = useState('desc');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [editStaff, setEditStaff] = useState(null);
  const [viewStaff, setViewStaff] = useState(null);
  const [deactivateTarget, setDeactivateTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [actionInProgress, setActionInProgress] = useState(false);

  const showNotification = (type, text) => {
    setFeedback({ type, text });
    setTimeout(() => setFeedback(null), 5000);
  };

  // Fetch Staff API
  const fetchStaff = useCallback(async (silent = false) => {
    if (!isAdmin) {
      setLoading(false);
      return;
    }

    if (!silent) setLoading(true);
    else setRefreshing(true);
    setApiError(null);

    try {
      const data = await axiosInstance.get('/identity/admin/users?role=Staff');
      const list = Array.isArray(data) ? data : [];
      setStaffList(list);
    } catch (err) {
      setApiError(err?.message || 'Unable to load staff members. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);

  // KPI Calculations
  const totalStaff = staffList.length;
  const activeStaff = useMemo(() => staffList.filter(s => s.active).length, [staffList]);
  const inactiveStaff = useMemo(() => staffList.filter(s => !s.active).length, [staffList]);
  const storesCount = useMemo(() => {
    const storeSet = new Set(staffList.map(s => s.assignedStore || 'TNT Central Supermarket'));
    return storeSet.size;
  }, [staffList]);

  // Filtered & Sorted Staff List
  const filteredStaff = useMemo(() => {
    let rows = staffList;

    if (statusFilter === 'Active') rows = rows.filter(s => s.active);
    if (statusFilter === 'Inactive') rows = rows.filter(s => !s.active);

    if (storeFilter !== 'ALL') {
      rows = rows.filter(s => (s.assignedStore || 'TNT Central Supermarket - Colombo') === storeFilter);
    }

    if (searchName.trim()) {
      const q = searchName.toLowerCase();
      rows = rows.filter(s => (s.fullName || s.displayName || '').toLowerCase().includes(q));
    }

    if (searchEmail.trim()) {
      const q = searchEmail.toLowerCase();
      rows = rows.filter(s => (s.email || '').toLowerCase().includes(q));
    }

    return [...rows].sort((a, b) => {
      let av = a[sortKey];
      let bv = b[sortKey];
      if (typeof av === 'string') {
        av = av.toLowerCase();
        bv = (bv || '').toLowerCase();
      }
      if (av == null) return 1;
      if (bv == null) return -1;
      return av < bv ? (sortDir === 'asc' ? -1 : 1) : av > bv ? (sortDir === 'asc' ? 1 : -1) : 0;
    });
  }, [staffList, statusFilter, storeFilter, searchName, searchEmail, sortKey, sortDir]);

  const handleSort = (colKey) => {
    const mappedKey = colKey === 'staffId' ? 'id' : colKey;
    if (sortKey === mappedKey) {
      setSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(mappedKey);
      setSortDir('asc');
    }
  };

  // Add Staff Member
  const handleCreateStaff = async (formData) => {
    try {
      await axiosInstance.post('/identity/admin/users', {
        email: formData.email,
        displayName: formData.fullName,
        fullName: formData.fullName,
        password: formData.password,
        roles: ['Staff'],
        contactNumber: formData.phoneNumber,
        active: formData.status === 'Active',
      });
      showNotification('success', `Staff member "${formData.fullName}" created successfully.`);
      setShowAddModal(false);
      await fetchStaff(true);
    } catch (err) {
      throw err;
    }
  };

  // Edit Staff Member
  const handleEditStaff = async (formData) => {
    if (!editStaff?.id) return;
    try {
      await axiosInstance.put(`/identity/admin/users/${editStaff.id}`, {
        fullName: formData.fullName,
        email: formData.email,
        contactNumber: formData.phoneNumber,
        active: formData.status === 'Active',
        roles: ['Staff'],
      });
      showNotification('success', `Staff details for "${formData.fullName}" updated successfully.`);
      setEditStaff(null);
      await fetchStaff(true);
    } catch (err) {
      throw err;
    }
  };

  // Initiate Toggle Status
  const handleToggleStatusClick = (staffMember) => {
    if (staffMember.active) {
      // Opening confirmation modal
      setDeactivateTarget(staffMember);
    } else {
      // Directly activate
      executeStatusToggle(staffMember, true);
    }
  };

  // Execute Status Toggle via PATCH API
  const executeStatusToggle = async (staffMember, nextActive) => {
    setActionInProgress(true);
    try {
      await axiosInstance.patch(`/identity/admin/users/${staffMember.id}/status`, {
        active: nextActive,
      });
      showNotification('success', `Staff member "${staffMember.fullName || staffMember.displayName}" has been ${nextActive ? 'activated' : 'deactivated'}.`);
      setDeactivateTarget(null);
      if (viewStaff?.id === staffMember.id) {
        setViewStaff(prev => ({ ...prev, active: nextActive }));
      }
      await fetchStaff(true);
    } catch (err) {
      showNotification('error', err?.message || 'Failed to update staff account status.');
    } finally {
      setActionInProgress(false);
    }
  };

  // Delete Staff Handler
  const handleConfirmDelete = async (target) => {
    if (!target?.id) return;
    setActionInProgress(true);
    try {
      await axiosInstance.delete(`/identity/admin/users/${target.id}`);
      showNotification('success', `Staff account for "${target.fullName || target.displayName}" has been permanently removed.`);
      setDeleteTarget(null);
      if (viewStaff?.id === target.id) {
        setViewStaff(null);
      }
      await fetchStaff(true);
    } catch (err) {
      showNotification('error', err?.response?.data?.message || err?.message || 'Failed to delete staff account.');
    } finally {
      setActionInProgress(false);
    }
  };

  return (
    <div style={{ maxWidth: 1300, margin: '0 auto', paddingBottom: 40 }}>
      {/* Page Header */}
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
            <div style={{ background: '#ede9fe', color: '#6d28d9', padding: 10, borderRadius: 12, display: 'grid', placeItems: 'center' }}>
              <Users size={26} />
            </div>
            <div>
              <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '2rem', color: 'var(--color-primary-dark)', margin: 0 }}>
                Staff Management
              </h1>
              <p style={{ color: 'var(--color-muted)', margin: '4px 0 0', fontSize: '0.95rem' }}>
                Manage supermarket staff accounts and their assigned stores.
              </p>
            </div>
          </div>
        </div>

        {isAdmin && (
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              className="btn btn-outline"
              onClick={() => fetchStaff(true)}
              disabled={refreshing}
              style={{ display: 'flex', alignItems: 'center', gap: 8, height: 42 }}
            >
              <RefreshCw size={16} style={refreshing ? { animation: 'spin 1s linear infinite' } : {}} />
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </button>
            <button
              className="btn btn-primary"
              onClick={() => setShowAddModal(true)}
              style={{ display: 'flex', alignItems: 'center', gap: 8, height: 42, background: '#7c3aed', borderColor: '#7c3aed' }}
            >
              <Plus size={18} />  Add New Staff
            </button>
          </div>
        )}
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          style={{
            padding: '14px 20px',
            borderRadius: 10,
            marginBottom: 20,
            fontSize: '0.88rem',
            fontWeight: 600,
            background: feedback.type === 'success' ? '#f0fdf4' : '#fef2f2',
            border: `1px solid ${feedback.type === 'success' ? '#bbf7d0' : '#fecaca'}`,
            color: feedback.type === 'success' ? '#166534' : '#991b1b',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {feedback.type === 'success' ? <CheckCircle size={18} /> : <AlertOctagon size={18} />}
            {feedback.text}
          </div>
          <button onClick={() => setFeedback(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', padding: 4 }}>
            <X size={16} />
          </button>
        </div>
      )}

      {/* KPI Cards */}
      {isAdmin && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, marginBottom: 24 }}>
          <div
            className="kpi-card"
            style={{ borderLeft: '4px solid #7c3aed', cursor: 'pointer' }}
            onClick={() => { setStatusFilter('ALL'); setStoreFilter('ALL'); setSearchName(''); setSearchEmail(''); }}
          >
            <div className="kpi-icon" style={{ background: '#ede9fe', color: '#6d28d9' }}><Users size={22} /></div>
            <div>
              <div className="kpi-label">Total Staff</div>
              <div className="kpi-val">{totalStaff}</div>
            </div>
          </div>

          <div
            className="kpi-card"
            style={{ borderLeft: '4px solid #16a34a', cursor: 'pointer' }}
            onClick={() => setStatusFilter('Active')}
          >
            <div className="kpi-icon" style={{ background: '#dcfce7', color: '#15803d' }}><UserCheck size={22} /></div>
            <div>
              <div className="kpi-label">Active Staff</div>
              <div className="kpi-val">{activeStaff}</div>
            </div>
          </div>

          <div
            className="kpi-card"
            style={{ borderLeft: '4px solid #dc2626', cursor: 'pointer' }}
            onClick={() => setStatusFilter('Inactive')}
          >
            <div className="kpi-icon" style={{ background: '#fee2e2', color: '#b91c1c' }}><UserX size={22} /></div>
            <div>
              <div className="kpi-label">Inactive Staff</div>
              <div className="kpi-val">{inactiveStaff}</div>
            </div>
          </div>

          <div className="kpi-card" style={{ borderLeft: '4px solid #0284c7' }}>
            <div className="kpi-icon" style={{ background: '#e0f2fe', color: '#0369a1' }}><Store size={22} /></div>
            <div>
              <div className="kpi-label">Stores Assigned</div>
              <div className="kpi-val">{storesCount}</div>
            </div>
          </div>
        </div>
      )}

      {/* Top Search & Filter Bar */}
      {isAdmin && (
        <div
          style={{
            background: '#ffffff',
            borderRadius: 14,
            border: '1px solid #e2e8f0',
            padding: '16px 20px',
            marginBottom: 20,
            display: 'flex',
            flexWrap: 'wrap',
            gap: 12,
            alignItems: 'center',
            boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
          }}
        >
          {/* Search by Name */}
          <div style={{ flex: '1 1 200px', minWidth: 180, position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: 12, color: '#9ca3af' }} />
            <input
              type="text"
              placeholder="Search by name..."
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 12px 9px 36px',
                border: '1.5px solid #d1d5db',
                borderRadius: 8,
                fontSize: '0.88rem',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Search by Email */}
          <div style={{ flex: '1 1 200px', minWidth: 180, position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: 12, color: '#9ca3af' }} />
            <input
              type="text"
              placeholder="Search by email..."
              value={searchEmail}
              onChange={(e) => setSearchEmail(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 12px 9px 36px',
                border: '1.5px solid #d1d5db',
                borderRadius: 8,
                fontSize: '0.88rem',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Filter by Status */}
          <div style={{ flex: '0 1 150px' }}>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 12px',
                border: '1.5px solid #d1d5db',
                borderRadius: 8,
                fontSize: '0.88rem',
                background: '#ffffff',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            >
              <option value="ALL">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>

          {/* Filter by Store */}
          <div style={{ flex: '1 1 220px' }}>
            <select
              value={storeFilter}
              onChange={(e) => setStoreFilter(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 12px',
                border: '1.5px solid #d1d5db',
                borderRadius: 8,
                fontSize: '0.88rem',
                background: '#ffffff',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            >
              <option value="ALL">All Stores</option>
              {SUPERMARKET_STORES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Clear Filter button if active */}
          {(searchName || searchEmail || statusFilter !== 'ALL' || storeFilter !== 'ALL') && (
            <button
              onClick={() => { setSearchName(''); setSearchEmail(''); setStatusFilter('ALL'); setStoreFilter('ALL'); }}
              style={{
                background: 'none',
                border: 'none',
                color: '#6b7280',
                fontSize: '0.85rem',
                cursor: 'pointer',
                textDecoration: 'underline',
                padding: '4px 8px',
              }}
            >
              Reset Filters
            </button>
          )}
        </div>
      )}

      {/* Main Staff Directory Table */}
      <UserManagementTable
        type="staff"
        users={filteredStaff}
        loading={loading}
        error={apiError}
        unauthorized={!isAdmin}
        sortKey={sortKey}
        sortDir={sortDir}
        onSort={handleSort}
        onView={(staffMember) => setViewStaff(staffMember)}
        onEdit={(staffMember) => setEditStaff(staffMember)}
        onToggleStatus={handleToggleStatusClick}
        onDelete={(staff) => setDeleteTarget(staff)}
        onRetry={() => fetchStaff()}
      />

      {/* Modals */}
      {/* Create Modal */}
      <StaffFormModal
        isOpen={showAddModal}
        mode="create"
        onClose={() => setShowAddModal(false)}
        onSave={handleCreateStaff}
      />

      {/* Edit Modal */}
      <StaffFormModal
        isOpen={!!editStaff}
        mode="edit"
        staff={editStaff}
        onClose={() => setEditStaff(null)}
        onSave={handleEditStaff}
      />

      {/* View Details Modal */}
      <UserDetailsModal
        user={viewStaff}
        type="staff"
        onClose={() => setViewStaff(null)}
        onEdit={(u) => { setViewStaff(null); setEditStaff(u); }}
        onToggleStatus={(u) => handleToggleStatusClick(u)}
        onDelete={() => {
          const target = viewStaff;
          setViewStaff(null);
          setDeleteTarget(target);
        }}
      />

      {/* Deactivate Confirmation Modal */}
      {deactivateTarget && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1100,
            padding: 16,
          }}
          onClick={() => setDeactivateTarget(null)}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: 16,
              width: '100%',
              maxWidth: 440,
              padding: 24,
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              animation: 'modalSlideUp 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#fee2e2', color: '#dc2626', display: 'grid', placeItems: 'center' }}>
                <AlertOctagon size={24} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#991b1b' }}>
                  Deactivate Staff Member
                </h3>
                <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>
                  Confirm account access revocation
                </div>
              </div>
            </div>

            <p style={{ fontSize: '0.92rem', color: '#374151', lineHeight: 1.5, margin: '0 0 20px' }}>
              Are you sure you want to deactivate this staff member?
              <br />
              <strong style={{ color: '#111827' }}>
                {deactivateTarget.fullName || deactivateTarget.displayName} ({deactivateTarget.email})
              </strong> will immediately lose access to the Staff Portal until reactivated.
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button
                className="btn btn-outline"
                disabled={actionInProgress}
                onClick={() => setDeactivateTarget(null)}
                style={{ padding: '8px 16px', fontSize: '0.88rem' }}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                disabled={actionInProgress}
                onClick={() => executeStatusToggle(deactivateTarget, false)}
                style={{ padding: '8px 20px', fontSize: '0.88rem', background: '#dc2626', borderColor: '#dc2626' }}
              >
                {actionInProgress ? 'Deactivating...' : 'Yes, Deactivate'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1100,
            padding: 16,
          }}
          onClick={() => !actionInProgress && setDeleteTarget(null)}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: 16,
              maxWidth: 460,
              width: '100%',
              padding: 24,
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.15)',
              animation: 'modalSlideUp 0.2s ease-out',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: '#fee2e2',
                  color: '#dc2626',
                  display: 'grid',
                  placeItems: 'center',
                  flexShrink: 0,
                }}
              >
                <Trash2 size={24} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#991b1b' }}>
                  Permanently Remove Staff Account
                </h3>
                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>This action cannot be undone</span>
              </div>
            </div>

            <div style={{
              background: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: 10,
              padding: '12px 16px',
              marginBottom: 16,
              fontSize: '0.85rem',
              color: '#991b1b',
              lineHeight: 1.5,
            }}>
              ⚠️ You are about to permanently delete the account for <strong>{deleteTarget.fullName || deleteTarget.displayName}</strong> ({deleteTarget.email}).
              All associated data, sessions, and records will be removed permanently.
            </div>

            <p style={{ fontSize: '0.88rem', color: '#475569', lineHeight: 1.5, margin: '0 0 20px' }}>
              This cannot be reversed. Consider deactivating the account instead if you may need to restore access later.
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => setDeleteTarget(null)}
                disabled={actionInProgress}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn"
                onClick={() => handleConfirmDelete(deleteTarget)}
                disabled={actionInProgress}
                style={{ background: '#991b1b', color: '#ffffff', border: 'none' }}
              >
                {actionInProgress ? 'Removing...' : 'Yes, Permanently Remove'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
