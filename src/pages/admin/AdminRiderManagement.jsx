import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Bike, CheckCircle2, Clock, Search, RefreshCw, Plus,
  X, CheckCircle, AlertOctagon, UserX, AlertTriangle, ShieldAlert, Trash2
} from 'lucide-react';
import axiosInstance from '../../services/axiosInstance';
import { useAuth } from '../../context/AuthContext';
import { UserManagementTable } from '../../components/admin/UserManagementTable';
import { RiderFormModal } from '../../components/admin/RiderFormModal';
import { UserDetailsModal } from '../../components/admin/UserDetailsModal';

export const AdminRiderManagement = () => {
  const { user, activeRole } = useAuth();
  const isAdmin = activeRole === 'Admin' || (user?.roles || []).includes('Admin');

  const [riders, setRiders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [feedback, setFeedback] = useState(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // ALL | Active | Inactive
  const [availabilityFilter, setAvailabilityFilter] = useState('ALL'); // ALL | Available | Busy | Offline

  // Sorting
  const [sortKey, setSortKey] = useState('createdAt');
  const [sortDir, setSortDir] = useState('desc');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [editRider, setEditRider] = useState(null);
  const [viewRider, setViewRider] = useState(null);
  const [deactivateTarget, setDeactivateTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [actionInProgress, setActionInProgress] = useState(false);

  const showNotification = (type, text) => {
    setFeedback({ type, text });
    setTimeout(() => setFeedback(null), 5000);
  };

  // Fetch Riders API
  const fetchRiders = useCallback(async (silent = false) => {
    if (!isAdmin) {
      setLoading(false);
      return;
    }

    if (!silent) setLoading(true);
    else setRefreshing(true);
    setApiError(null);

    try {
      const data = await axiosInstance.get('/identity/admin/users?role=Rider');
      const list = Array.isArray(data) ? data : [];
      // The Rider API exposes riderId/phoneNumber; retain the existing table's
      // normalized names as well so all displayed data comes from the API.
      setRiders(list.map(rider => ({
        ...rider,
        id: rider.riderId || rider.id,
        contactNumber: rider.phoneNumber || rider.contactNumber,
      })));
    } catch (err) {
      setApiError(err?.message || 'Unable to load riders. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    fetchRiders();
  }, [fetchRiders]);

  // KPI Calculations
  const totalRiders = riders.length;
  const availableRiders = useMemo(() => riders.filter(r => r.active && (r.availabilityStatus || 'Available') === 'Available').length, [riders]);
  const busyRiders = useMemo(() => riders.filter(r => r.active && r.availabilityStatus === 'Busy').length, [riders]);
  const offlineRiders = useMemo(() => riders.filter(r => r.active && r.availabilityStatus === 'Offline').length, [riders]);
  const inactiveRiders = useMemo(() => riders.filter(r => !r.active).length, [riders]);

  // Filtered & Sorted Riders List
  const filteredRiders = useMemo(() => {
    let rows = riders;

    if (statusFilter === 'Active') rows = rows.filter(r => r.active);
    if (statusFilter === 'Inactive') rows = rows.filter(r => !r.active);

    if (availabilityFilter !== 'ALL') {
      rows = rows.filter(r => (r.availabilityStatus || 'Available').toLowerCase() === availabilityFilter.toLowerCase());
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      rows = rows.filter(r =>
        (r.fullName || r.displayName || '').toLowerCase().includes(q) ||
        (r.email || '').toLowerCase().includes(q) ||
        (r.contactNumber || '').toLowerCase().includes(q)
      );
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
  }, [riders, statusFilter, availabilityFilter, searchQuery, sortKey, sortDir]);

  const handleSort = (colKey) => {
    const mappedKey = colKey === 'riderId' ? 'id' : colKey;
    if (sortKey === mappedKey) {
      setSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(mappedKey);
      setSortDir('asc');
    }
  };

  // Add Rider Member
  const handleCreateRider = async (formData) => {
    try {
      await axiosInstance.post('/identity/admin/users', {
        email: formData.email,
        displayName: formData.fullName,
        fullName: formData.fullName,
        password: formData.password,
        roles: ['Rider'],
        contactNumber: formData.phoneNumber,
        district: formData.district,
        address: formData.address,
        availabilityStatus: formData.availabilityStatus || 'Available',
        active: formData.status === 'Active',
        vehicleType: formData.vehicleType,
        vehicleModel: formData.vehicleModel,
        vehicleNumber: formData.vehicleNumber,
        licenseNumber: formData.licenseNumber,
      });
      showNotification('success', `Rider "${formData.fullName}" created successfully.`);
      setShowAddModal(false);
      await fetchRiders(true);
    } catch (err) {
      throw err;
    }
  };

  // Edit Rider Member
  const handleEditRider = async (formData) => {
    if (!editRider?.id) return;
    try {
      await axiosInstance.put(`/identity/admin/users/${editRider.id}`, {
        fullName: formData.fullName,
        email: formData.email,
        contactNumber: formData.phoneNumber,
        district: formData.district,
        address: formData.address,
        availabilityStatus: formData.availabilityStatus || 'Available',
        active: formData.status === 'Active',
        vehicleType: formData.vehicleType,
        vehicleModel: formData.vehicleModel,
        vehicleNumber: formData.vehicleNumber,
        licenseNumber: formData.licenseNumber,
      });
      showNotification('success', `Rider details for "${formData.fullName}" updated successfully.`);
      setEditRider(null);
      await fetchRiders(true);
    } catch (err) {
      throw err;
    }
  };

  // Quick Change Rider Availability Status
  const handleChangeAvailability = async (rider, newStatus) => {
    try {
      await axiosInstance.patch(`/identity/admin/users/${rider.id}/availability`, {
        availabilityStatus: newStatus,
      });
      showNotification('success', `Rider "${rider.fullName || rider.displayName}" availability set to ${newStatus}.`);
      setRiders(prev => prev.map(r => r.id === rider.id ? { ...r, availabilityStatus: newStatus } : r));
    } catch (err) {
      showNotification('error', err?.message || 'Failed to update rider availability.');
    }
  };

  // Initiate Toggle Status
  const handleToggleStatusClick = (rider) => {
    if (rider.active) {
      setDeactivateTarget(rider);
    } else {
      executeStatusToggle(rider, true);
    }
  };

  // Execute Status Toggle via PATCH API
  const executeStatusToggle = async (rider, nextActive) => {
    setActionInProgress(true);
    try {
      await axiosInstance.patch(`/identity/admin/users/${rider.id}/status`, {
        active: nextActive,
      });
      showNotification('success', `Rider "${rider.fullName || rider.displayName}" has been ${nextActive ? 'activated' : 'deactivated'}.`);
      setDeactivateTarget(null);
      if (viewRider?.id === rider.id) {
        setViewRider(prev => ({ ...prev, active: nextActive }));
      }
      await fetchRiders(true);
    } catch (err) {
      showNotification('error', err?.message || 'Failed to update rider account status.');
    } finally {
      setActionInProgress(false);
    }
  };

  // Delete Rider Handler
  const handleConfirmDelete = async (target) => {
    if (!target?.id) return;
    setActionInProgress(true);
    try {
      await axiosInstance.delete(`/identity/admin/users/${target.id}`);
      showNotification('success', `Rider account for "${target.fullName || target.displayName}" has been permanently removed.`);
      setDeleteTarget(null);
      if (viewRider?.id === target.id) {
        setViewRider(null);
      }
      await fetchRiders(true);
    } catch (err) {
      showNotification('error', err?.response?.data?.message || err?.message || 'Failed to delete rider account.');
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
            <div style={{ background: '#e0f2fe', color: '#0284c7', padding: 10, borderRadius: 12, display: 'grid', placeItems: 'center' }}>
              <Bike size={26} />
            </div>
            <div>
              <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '2rem', color: 'var(--color-primary-dark)', margin: 0 }}>
                Rider Management
              </h1>
              <p style={{ color: 'var(--color-muted)', margin: '4px 0 0', fontSize: '0.95rem' }}>
                Manage delivery rider accounts and rider availability.
              </p>
            </div>
          </div>
        </div>

        {isAdmin && (
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              className="btn btn-outline"
              onClick={() => fetchRiders(true)}
              disabled={refreshing}
              style={{ display: 'flex', alignItems: 'center', gap: 8, height: 42 }}
            >
              <RefreshCw size={16} style={refreshing ? { animation: 'spin 1s linear infinite' } : {}} />
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </button>
            <button
              className="btn btn-primary"
              onClick={() => setShowAddModal(true)}
              style={{ display: 'flex', alignItems: 'center', gap: 8, height: 42, background: '#0284c7', borderColor: '#0284c7' }}
            >
              <Plus size={18} /> Add New Rider
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
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, marginBottom: 24 }}>
          <div
            className="kpi-card"
            style={{ borderLeft: '4px solid #0284c7', cursor: 'pointer' }}
            onClick={() => { setStatusFilter('ALL'); setAvailabilityFilter('ALL'); setSearchQuery(''); }}
          >
            <div className="kpi-icon" style={{ background: '#e0f2fe', color: '#0284c7' }}><Bike size={22} /></div>
            <div>
              <div className="kpi-label">Total Riders</div>
              <div className="kpi-val">{totalRiders}</div>
            </div>
          </div>

          <div
            className="kpi-card"
            style={{ borderLeft: '4px solid #16a34a', cursor: 'pointer' }}
            onClick={() => { setStatusFilter('Active'); setAvailabilityFilter('Available'); }}
          >
            <div className="kpi-icon" style={{ background: '#dcfce7', color: '#15803d' }}><CheckCircle2 size={22} /></div>
            <div>
              <div className="kpi-label">Available</div>
              <div className="kpi-val">{availableRiders}</div>
            </div>
          </div>

          <div
            className="kpi-card"
            style={{ borderLeft: '4px solid #d97706', cursor: 'pointer' }}
            onClick={() => { setStatusFilter('Active'); setAvailabilityFilter('Busy'); }}
          >
            <div className="kpi-icon" style={{ background: '#fef3c7', color: '#b45309' }}><Clock size={22} /></div>
            <div>
              <div className="kpi-label">Busy / Delivering</div>
              <div className="kpi-val">{busyRiders}</div>
            </div>
          </div>

          <div
            className="kpi-card"
            style={{ borderLeft: '4px solid #6b7280', cursor: 'pointer' }}
            onClick={() => { setStatusFilter('Active'); setAvailabilityFilter('Offline'); }}
          >
            <div className="kpi-icon" style={{ background: '#f3f4f6', color: '#4b5563' }}><UserX size={22} /></div>
            <div>
              <div className="kpi-label">Offline</div>
              <div className="kpi-val">{offlineRiders}</div>
            </div>
          </div>

          <div
            className="kpi-card"
            style={{ borderLeft: '4px solid #dc2626', cursor: 'pointer' }}
            onClick={() => setStatusFilter('Inactive')}
          >
            <div className="kpi-icon" style={{ background: '#fee2e2', color: '#b91c1c' }}><UserX size={22} /></div>
            <div>
              <div className="kpi-label">Inactive Accounts</div>
              <div className="kpi-val">{inactiveRiders}</div>
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
          {/* Search Query */}
          <div style={{ flex: '1 1 260px', minWidth: 200, position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: 12, color: '#9ca3af' }} />
            <input
              type="text"
              placeholder="Search by rider name, email, or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
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
          <div style={{ flex: '0 1 160px' }}>
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
              <option value="ALL">All Account Statuses</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>

          {/* Filter by Availability */}
          <div style={{ flex: '0 1 170px' }}>
            <select
              value={availabilityFilter}
              onChange={(e) => setAvailabilityFilter(e.target.value)}
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
              <option value="ALL">All Availability</option>
              <option value="Available">Available</option>
              <option value="Busy">Busy</option>
              <option value="Offline">Offline</option>
            </select>
          </div>

          {/* Reset Filters */}
          {(searchQuery || statusFilter !== 'ALL' || availabilityFilter !== 'ALL') && (
            <button
              onClick={() => { setSearchQuery(''); setStatusFilter('ALL'); setAvailabilityFilter('ALL'); }}
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

      {/* Main Rider Directory Table */}
      <UserManagementTable
        type="rider"
        users={filteredRiders}
        loading={loading}
        error={apiError}
        unauthorized={!isAdmin}
        sortKey={sortKey}
        sortDir={sortDir}
        onSort={handleSort}
        onView={(rider) => setViewRider(rider)}
        onEdit={(rider) => setEditRider(rider)}
        onToggleStatus={handleToggleStatusClick}
        onChangeAvailability={handleChangeAvailability}
        onDelete={(rider) => setDeleteTarget(rider)}
        onRetry={() => fetchRiders()}
      />

      {/* Modals */}
      {/* Create Modal */}
      <RiderFormModal
        isOpen={showAddModal}
        mode="create"
        onClose={() => setShowAddModal(false)}
        onSave={handleCreateRider}
      />

      {/* Edit Modal */}
      <RiderFormModal
        isOpen={!!editRider}
        mode="edit"
        rider={editRider}
        onClose={() => setEditRider(null)}
        onSave={handleEditRider}
      />

      {/* View Details Modal */}
      <UserDetailsModal
        user={viewRider}
        type="rider"
        onClose={() => setViewRider(null)}
        onEdit={(r) => { setViewRider(null); setEditRider(r); }}
        onToggleStatus={(r) => handleToggleStatusClick(r)}
        onDelete={() => {
          const target = viewRider;
          setViewRider(null);
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
                  Deactivate Rider
                </h3>
                <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>
                  Confirm rider access revocation
                </div>
              </div>
            </div>

            <p style={{ fontSize: '0.92rem', color: '#374151', lineHeight: 1.5, margin: '0 0 20px' }}>
              Are you sure you want to deactivate this rider?
              <br />
              <strong style={{ color: '#111827' }}>
                {deactivateTarget.fullName || deactivateTarget.displayName} ({deactivateTarget.email})
              </strong> will immediately be taken offline and blocked from accepting or delivering orders.
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
                  Permanently Remove Rider Account
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
