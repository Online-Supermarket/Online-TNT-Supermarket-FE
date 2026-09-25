import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  UserCheck, UserX, Users, Search, RefreshCw, Plus,
  X, CheckCircle, AlertOctagon, Filter, ShieldAlert, Sparkles, Calendar, Trash2
} from 'lucide-react';
import axiosInstance from '../../services/axiosInstance';
import { useAuth } from '../../context/AuthContext';
import { UserManagementTable } from '../../components/admin/UserManagementTable';
import { CustomerFormModal } from '../../components/admin/CustomerFormModal';
import { UserDetailsModal } from '../../components/admin/UserDetailsModal';

export const AdminCustomerManagement = () => {
  const { user, activeRole } = useAuth();
  const isAdmin = activeRole === 'ADMIN' || (user?.roles || []).includes('OperationsAdmin');

  const [customerList, setCustomerList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [feedback, setFeedback] = useState(null);

  // Filters & Search
  const [searchName, setSearchName] = useState('');
  const [searchEmail, setSearchEmail] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // ALL | Active | Inactive

  // Sorting
  const [sortKey, setSortKey] = useState('createdAt');
  const [sortDir, setSortDir] = useState('desc');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [editCustomer, setEditCustomer] = useState(null);
  const [viewCustomer, setViewCustomer] = useState(null);
  const [deactivateTarget, setDeactivateTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [actionInProgress, setActionInProgress] = useState(false);

  const showNotification = (type, text) => {
    setFeedback({ type, text });
    setTimeout(() => setFeedback(null), 5000);
  };

  // Fetch Customers API
  const fetchCustomers = useCallback(async (silent = false) => {
    if (!isAdmin) {
      setLoading(false);
      return;
    }

    if (!silent) setLoading(true);
    else setRefreshing(true);
    setApiError(null);

    try {
      const data = await axiosInstance.get('/identity/admin/users?role=Customer');
      const list = Array.isArray(data) ? data : [];
      setCustomerList(list);
    } catch (err) {
      setApiError(err?.message || 'Unable to load customers. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  // KPI Calculations
  const totalCustomers = customerList.length;
  const activeCustomers = useMemo(() => customerList.filter(c => c.active).length, [customerList]);
  const inactiveCustomers = useMemo(() => customerList.filter(c => !c.active).length, [customerList]);
  const newThisMonth = useMemo(() => {
    const now = new Date();
    return customerList.filter(c => {
      if (!c.createdAt) return false;
      const d = new Date(c.createdAt);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length;
  }, [customerList]);

  // Filtered & Sorted Customer List
  const filteredCustomers = useMemo(() => {
    let rows = customerList;

    if (statusFilter === 'Active') rows = rows.filter(c => c.active);
    if (statusFilter === 'Inactive') rows = rows.filter(c => !c.active);

    if (searchName.trim()) {
      const q = searchName.toLowerCase();
      rows = rows.filter(c => (c.fullName || c.displayName || '').toLowerCase().includes(q));
    }

    if (searchEmail.trim()) {
      const q = searchEmail.toLowerCase();
      rows = rows.filter(c => (c.email || '').toLowerCase().includes(q));
    }

    // Sort
    return [...rows].sort((a, b) => {
      let valA = a[sortKey] || '';
      let valB = b[sortKey] || '';

      if (sortKey === 'createdAt' || sortKey === 'updatedAt') {
        valA = new Date(valA || 0).getTime();
        valB = new Date(valB || 0).getTime();
      } else if (typeof valA === 'string') {
        valA = valA.toLowerCase();
        valB = valB.toLowerCase();
      }

      if (valA < valB) return sortDir === 'asc' ? -1 : 1;
      if (valA > valB) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
  }, [customerList, statusFilter, searchName, searchEmail, sortKey, sortDir]);

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  // Create Customer Handler
  const handleCreateCustomer = async (payload) => {
    try {
      await axiosInstance.post('/identity/admin/users', {
        email: payload.email,
        displayName: payload.displayName || payload.fullName,
        fullName: payload.fullName,
        password: payload.password,
        roles: ['Customer'],
        contactNumber: payload.contactNumber,
        active: payload.active,
      });

      showNotification('success', `Customer account for "${payload.fullName}" has been created successfully.`);
      setShowAddModal(false);
      await fetchCustomers(true);
    } catch (err) {
      throw new Error(err?.response?.data?.message || err?.message || 'Failed to create customer account.');
    }
  };

  // Update Customer Handler
  const handleUpdateCustomer = async (payload) => {
    if (!editCustomer?.id) return;
    try {
      await axiosInstance.put(`/identity/admin/users/${editCustomer.id}`, {
        fullName: payload.fullName,
        contactNumber: payload.contactNumber,
        active: payload.active,
        roles: ['Customer'],
      });

      showNotification('success', `Customer profile "${payload.fullName}" updated successfully.`);
      setEditCustomer(null);
      if (viewCustomer?.id === editCustomer.id) {
        setViewCustomer(prev => ({ ...prev, ...payload }));
      }
      await fetchCustomers(true);
    } catch (err) {
      throw new Error(err?.response?.data?.message || err?.message || 'Failed to update customer account.');
    }
  };

  // Toggle Status Handler
  const handleConfirmToggleStatus = async (customerMember) => {
    if (!customerMember?.id) return;
    setActionInProgress(true);
    try {
      const nextActive = !customerMember.active;
      await axiosInstance.patch(`/identity/admin/users/${customerMember.id}/status`, {
        active: nextActive,
      });
      showNotification('success', `Customer "${customerMember.fullName || customerMember.displayName}" has been ${nextActive ? 'activated' : 'deactivated'}.`);
      setDeactivateTarget(null);
      if (viewCustomer?.id === customerMember.id) {
        setViewCustomer(prev => ({ ...prev, active: nextActive }));
      }
      await fetchCustomers(true);
    } catch (err) {
      showNotification('error', err?.message || 'Failed to update customer account status.');
    } finally {
      setActionInProgress(false);
    }
  };

  // Delete Customer Handler
  const handleConfirmDelete = async (target) => {
    if (!target?.id) return;
    setActionInProgress(true);
    try {
      await axiosInstance.delete(`/identity/admin/users/${target.id}`);
      showNotification('success', `Customer account for "${target.fullName || target.displayName}" has been permanently removed.`);
      setDeleteTarget(null);
      if (viewCustomer?.id === target.id) {
        setViewCustomer(null);
      }
      await fetchCustomers(true);
    } catch (err) {
      showNotification('error', err?.response?.data?.message || err?.message || 'Failed to delete customer account.');
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
            <div style={{ background: '#dcfce7', color: '#15803d', padding: 10, borderRadius: 12, display: 'grid', placeItems: 'center' }}>
              <UserCheck size={26} />
            </div>
            <div>
              <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '2rem', color: 'var(--color-primary-dark)', margin: 0 }}>
                Customer Management
              </h1>
              <p style={{ color: 'var(--color-muted)', margin: '4px 0 0', fontSize: '0.95rem' }}>
                View and manage registered online supermarket shoppers and account access.
              </p>
            </div>
          </div>
        </div>

        {isAdmin && (
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              className="btn btn-outline"
              onClick={() => fetchCustomers(true)}
              disabled={refreshing}
              style={{ display: 'flex', alignItems: 'center', gap: 8, height: 42 }}
            >
              <RefreshCw size={16} style={refreshing ? { animation: 'spin 1s linear infinite' } : {}} />
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </button>
            <button
              className="btn btn-primary"
              onClick={() => setShowAddModal(true)}
              style={{ display: 'flex', alignItems: 'center', gap: 8, height: 42, background: '#059669', borderColor: '#059669' }}
            >
              <Plus size={18} /> + Add Customer
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
            style={{ borderLeft: '4px solid #059669', cursor: 'pointer' }}
            onClick={() => { setStatusFilter('ALL'); setSearchName(''); setSearchEmail(''); }}
          >
            <div className="kpi-icon" style={{ background: '#dcfce7', color: '#15803d' }}><Users size={22} /></div>
            <div>
              <div className="kpi-label">Total Customers</div>
              <div className="kpi-val">{totalCustomers}</div>
            </div>
          </div>

          <div
            className="kpi-card"
            style={{ borderLeft: '4px solid #16a34a', cursor: 'pointer' }}
            onClick={() => setStatusFilter('Active')}
          >
            <div className="kpi-icon" style={{ background: '#dcfce7', color: '#16a34a' }}><UserCheck size={22} /></div>
            <div>
              <div className="kpi-label">Active Shoppers</div>
              <div className="kpi-val">{activeCustomers}</div>
            </div>
          </div>

          <div
            className="kpi-card"
            style={{ borderLeft: '4px solid #dc2626', cursor: 'pointer' }}
            onClick={() => setStatusFilter('Inactive')}
          >
            <div className="kpi-icon" style={{ background: '#fee2e2', color: '#dc2626' }}><UserX size={22} /></div>
            <div>
              <div className="kpi-label">Inactive / Suspended</div>
              <div className="kpi-val">{inactiveCustomers}</div>
            </div>
          </div>

          <div className="kpi-card" style={{ borderLeft: '4px solid #0284c7' }}>
            <div className="kpi-icon" style={{ background: '#e0f2fe', color: '#0369a1' }}><Sparkles size={22} /></div>
            <div>
              <div className="kpi-label">New This Month</div>
              <div className="kpi-val">{newThisMonth}</div>
            </div>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
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
            alignItems: 'center',
            gap: 12,
            boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#64748b', fontSize: '0.85rem', fontWeight: 600 }}>
            <Filter size={16} /> Filters:
          </div>

          {/* Search by Name */}
          <div style={{ flex: '1 1 200px', minWidth: 180, position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: 12, color: '#9ca3af' }} />
            <input
              type="text"
              placeholder="Search by full name..."
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
              <option value="ALL">All Statuses</option>
              <option value="Active">Active Only</option>
              <option value="Inactive">Inactive Only</option>
            </select>
          </div>

          {/* Clear Filter button if active */}
          {(searchName || searchEmail || statusFilter !== 'ALL') && (
            <button
              onClick={() => { setSearchName(''); setSearchEmail(''); setStatusFilter('ALL'); }}
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

          <div style={{ marginLeft: 'auto', fontSize: '0.85rem', color: '#64748b' }}>
            Showing <strong>{filteredCustomers.length}</strong> of {totalCustomers} customers
          </div>
        </div>
      )}

      {/* Main Table */}
      <UserManagementTable
        type="customer"
        users={filteredCustomers}
        loading={loading}
        error={apiError}
        unauthorized={!isAdmin}
        sortKey={sortKey}
        sortDir={sortDir}
        onSort={handleSort}
        onView={(cust) => setViewCustomer(cust)}
        onEdit={(cust) => setEditCustomer(cust)}
        onToggleStatus={(cust) => {
          if (cust.active) {
            // Confirm deactivation
            setDeactivateTarget(cust);
          } else {
            // Activate immediately
            handleConfirmToggleStatus(cust);
          }
        }}
        onDelete={(cust) => setDeleteTarget(cust)}
        onRetry={() => fetchCustomers()}
      />

      {/* Add Customer Modal */}
      {showAddModal && (
        <CustomerFormModal
          isOpen={showAddModal}
          mode="create"
          onClose={() => setShowAddModal(false)}
          onSave={handleCreateCustomer}
        />
      )}

      {/* Edit Customer Modal */}
      {editCustomer && (
        <CustomerFormModal
          isOpen={Boolean(editCustomer)}
          mode="edit"
          customer={editCustomer}
          onClose={() => setEditCustomer(null)}
          onSave={handleUpdateCustomer}
        />
      )}

      {/* Customer Details Modal */}
      {viewCustomer && (
        <UserDetailsModal
          user={viewCustomer}
          type="customer"
          onClose={() => setViewCustomer(null)}
          onEdit={() => {
            const target = viewCustomer;
            setViewCustomer(null);
            setEditCustomer(target);
          }}
          onToggleStatus={() => {
            const target = viewCustomer;
            setViewCustomer(null);
            if (target.active) setDeactivateTarget(target);
            else handleConfirmToggleStatus(target);
          }}
          onDelete={() => {
            const target = viewCustomer;
            setViewCustomer(null);
            setDeleteTarget(target);
          }}
        />
      )}

      {/* Deactivate Confirmation Modal */}
      {deactivateTarget && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.7)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1100,
            padding: 16,
          }}
          onClick={() => !actionInProgress && setDeactivateTarget(null)}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: 16,
              maxWidth: 440,
              width: '100%',
              padding: 24,
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
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
                <UserX size={24} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#1e293b' }}>
                  Deactivate Customer Account
                </h3>
                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Account Access Suspension</span>
              </div>
            </div>

            <p style={{ fontSize: '0.88rem', color: '#475569', lineHeight: 1.5, margin: '0 0 20px' }}>
              Are you sure you want to deactivate <strong>{deactivateTarget.fullName || deactivateTarget.displayName}</strong>?
              The customer will no longer be able to log in or complete checkouts until reactivated.
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => setDeactivateTarget(null)}
                disabled={actionInProgress}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn"
                onClick={() => handleConfirmToggleStatus(deactivateTarget)}
                disabled={actionInProgress}
                style={{ background: '#dc2626', color: '#ffffff', border: 'none' }}
              >
                {actionInProgress ? 'Deactivating...' : 'Confirm Deactivation'}
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
                  Permanently Remove Account
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
