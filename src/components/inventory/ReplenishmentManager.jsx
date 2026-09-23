import React, { useState, useEffect, useMemo } from 'react';
import {
  Warehouse,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Clock,
  Truck,
  PlusCircle,
  Check,
  X,
  Search,
  Filter,
  PackageCheck,
  Ban,
  ArrowRight,
  TrendingDown,
  Layers,
  FileText,
  AlertOctagon,
  Boxes
} from 'lucide-react';
import axiosInstance from '../../services/axiosInstance';

export const ReplenishmentManager = ({ portalTitle = 'Inventory Stock Replenishment', subtitle = 'Monitor low stock items, generate replenishment plans, and manage supplier deliveries.' }) => {
  const [activeTab, setActiveTab] = useState('low-stock'); // 'low-stock' | 'plans'
  const [products, setProducts] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState(null); // { type: 'success' | 'error', message: string }

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // For plans tab
  const [stockStatusFilter, setStockStatusFilter] = useState('All'); // 'All' | 'In Stock' | 'Low Stock' | 'Out of Stock'

  // Modals state
  const [createModalItem, setCreateModalItem] = useState(null);
  const [createQuantity, setCreateQuantity] = useState(1);
  const [createNotes, setCreateNotes] = useState('');
  const [submittingCreate, setSubmittingCreate] = useState(false);

  const [receiveModalPlan, setReceiveModalPlan] = useState(null);
  const [receiveQuantity, setReceiveQuantity] = useState(1);
  const [receiveNotes, setReceiveNotes] = useState('');
  const [submittingReceive, setSubmittingReceive] = useState(false);

  // Action in-flight tracking (by plan id)
  const [actionLoadingId, setActionLoadingId] = useState(null);

  // Fetch all inventory products with fallback
  const fetchProducts = async () => {
    try {
      const data = await axiosInstance.get('/inventory');
      if (Array.isArray(data)) return data;
    } catch (err) {
      console.warn('GET /inventory not reachable, attempting /catalog/inventory/low-stock...', err);
    }
    try {
      const fallback = await axiosInstance.get('/catalog/inventory/low-stock');
      return Array.isArray(fallback) ? fallback : [];
    } catch (err) {
      console.error('Failed to load inventory products', err);
      throw err;
    }
  };

  // Fetch replenishment plans
  const fetchPlans = async () => {
    try {
      const data = await axiosInstance.get('/catalog/inventory/replenishment');
      return Array.isArray(data) ? data : [];
    } catch (err) {
      console.error('Failed to load replenishment plans', err);
      throw err;
    }
  };

  const loadData = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    else setLoading(true);
    setError('');

    try {
      const [productsData, plansData] = await Promise.all([
        fetchProducts(),
        fetchPlans()
      ]);
      setProducts(productsData);
      setPlans(plansData);
    } catch (err) {
      setError(err.message || 'Failed to communicate with inventory service.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Quick feedback banner helper
  const showFeedback = (type, message) => {
    setFeedback({ type, message });
    setTimeout(() => {
      setFeedback(null);
    }, 4500);
  };

  // Open Create Plan modal
  const handleOpenCreateModal = (product) => {
    const suggested = Math.max(1, product.suggestedQuantity || (product.targetStockLevel - product.stockQuantity) || 10);
    setCreateModalItem(product);
    setCreateQuantity(suggested);
    setCreateNotes('');
  };

  // Submit Create Plan
  const handleSubmitCreatePlan = async (e) => {
    e.preventDefault();
    if (!createModalItem || createQuantity <= 0) return;

    setSubmittingCreate(true);
    try {
      await axiosInstance.post('/catalog/inventory/replenishment', {
        productId: createModalItem.id,
        requestedQuantity: Number(createQuantity),
        notes: createNotes?.trim() || null
      });

      showFeedback('success', `Replenishment plan for ${createModalItem.name} created successfully!`);
      setCreateModalItem(null);
      await loadData(true);
      setActiveTab('plans'); // Switch to plans tab to view the newly created plan
    } catch (err) {
      showFeedback('error', err.message || 'Failed to create replenishment plan.');
    } finally {
      setSubmittingCreate(false);
    }
  };

  // Transition plan (Approve or Mark as Ordered)
  const handleTransitionPlan = async (planId, action) => {
    setActionLoadingId(planId);
    try {
      await axiosInstance.patch(`/catalog/inventory/replenishment/${planId}/${action}`);
      showFeedback('success', `Plan successfully transitioned to ${action === 'approve' ? 'Approved' : 'Ordered'}!`);
      await loadData(true);
    } catch (err) {
      showFeedback('error', err.message || `Failed to ${action} plan.`);
    } finally {
      setActionLoadingId(null);
    }
  };

  // Cancel plan
  const handleCancelPlan = async (planId, productName) => {
    if (!window.confirm(`Are you sure you want to cancel the replenishment plan for ${productName}?`)) {
      return;
    }

    setActionLoadingId(planId);
    try {
      await axiosInstance.patch(`/catalog/inventory/replenishment/${planId}/cancel`);
      showFeedback('success', `Replenishment plan cancelled.`);
      await loadData(true);
    } catch (err) {
      showFeedback('error', err.message || 'Failed to cancel plan.');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Open Receive Stock modal
  const handleOpenReceiveModal = (plan) => {
    setReceiveModalPlan(plan);
    setReceiveQuantity(plan.requestedQuantity);
    setReceiveNotes(plan.notes || '');
  };

  // Submit Receive Stock
  const handleSubmitReceiveStock = async (e) => {
    e.preventDefault();
    if (!receiveModalPlan || receiveQuantity <= 0) return;

    setSubmittingReceive(true);
    try {
      await axiosInstance.patch(`/catalog/inventory/replenishment/${receiveModalPlan.id}/receive`, {
        receivedQuantity: Number(receiveQuantity),
        notes: receiveNotes?.trim() || null
      });

      showFeedback('success', `Successfully received ${receiveQuantity} units for ${receiveModalPlan.productName}! Product stock updated.`);
      setReceiveModalPlan(null);
      await loadData(true);
    } catch (err) {
      showFeedback('error', err.message || 'Failed to receive stock.');
    } finally {
      setSubmittingReceive(false);
    }
  };

  // Product enrichment with calculated stock status and active replenishment plans
  const enrichedProducts = useMemo(() => {
    const planByProductId = {};
    plans.forEach((plan) => {
      if (['Pending', 'Approved', 'Ordered'].includes(plan.status)) {
        planByProductId[plan.productId] = plan.status;
      }
    });

    return products.map((prod) => {
      const stock = prod.stockQuantity ?? 0;
      const reorder = prod.reorderLevel ?? 10;
      const target = prod.targetStockLevel ?? 50;
      const itemStatus = prod.status || (stock === 0 ? 'Out of Stock' : stock <= reorder ? 'Low Stock' : 'In Stock');
      const suggestedQuantity = prod.suggestedQuantity || Math.max(1, (target - stock) || 10);
      const activePlanStatus = prod.activePlanStatus || planByProductId[prod.id] || null;

      return {
        ...prod,
        stockQuantity: stock,
        reorderLevel: reorder,
        targetStockLevel: target,
        status: itemStatus,
        suggestedQuantity,
        activePlanStatus
      };
    });
  }, [products, plans]);

  // KPI Calculations
  const inStockCount = useMemo(() => enrichedProducts.filter(p => p.status === 'In Stock').length, [enrichedProducts]);
  const lowStockCount = useMemo(() => enrichedProducts.filter(p => p.status === 'Low Stock').length, [enrichedProducts]);
  const outOfStockCount = useMemo(() => enrichedProducts.filter(p => p.status === 'Out of Stock').length, [enrichedProducts]);
  const activePlansCount = useMemo(() => plans.filter(p => ['Pending', 'Approved', 'Ordered'].includes(p.status)).length, [plans]);
  const receivedPlansCount = useMemo(() => plans.filter(p => p.status === 'Received').length, [plans]);

  // Filtered products list supporting All, In Stock, Low Stock, Out of Stock and search
  const filteredProducts = useMemo(() => {
    let rows = enrichedProducts;

    if (stockStatusFilter !== 'All') {
      rows = rows.filter(p => p.status === stockStatusFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      rows = rows.filter(
        p => p.name?.toLowerCase().includes(q) || p.sku?.toLowerCase().includes(q) || p.categoryName?.toLowerCase().includes(q)
      );
    }

    return rows;
  }, [enrichedProducts, stockStatusFilter, searchQuery]);

  const filteredPlans = useMemo(() => {
    return plans.filter(plan => {
      const matchesStatus = statusFilter === 'ALL' || plan.status?.toUpperCase() === statusFilter.toUpperCase();
      if (!matchesStatus) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        plan.productName?.toLowerCase().includes(q) ||
        plan.productSku?.toLowerCase().includes(q) ||
        plan.categoryName?.toLowerCase().includes(q)
      );
    });
  }, [plans, statusFilter, searchQuery]);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Pending':
        return <span className="status-pill status-pending" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><Clock size={12} /> Pending</span>;
      case 'Approved':
        return <span className="status-pill status-confirmed" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><Check size={12} /> Approved</span>;
      case 'Ordered':
        return <span className="status-pill status-processing" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><Truck size={12} /> Ordered</span>;
      case 'Received':
        return <span className="status-pill status-delivered" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><CheckCircle size={12} /> Received</span>;
      case 'Cancelled':
        return <span className="status-pill status-cancelled" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><Ban size={12} /> Cancelled</span>;
      default:
        return <span className="status-pill">{status}</span>;
    }
  };

  return (
    <div style={{ maxWidth: 1280, margin: '0 auto' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
            <div style={{ background: 'var(--color-soft-mint)', color: 'var(--color-primary)', padding: 8, borderRadius: 10, display: 'grid', placeItems: 'center' }}>
              <Warehouse size={28} />
            </div>
            <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '2.2rem', color: 'var(--color-primary-dark)', margin: 0 }}>
              {portalTitle}
            </h1>
          </div>
          <p style={{ color: 'var(--color-muted)', margin: 0, fontSize: '0.975rem' }}>
            {subtitle}
          </p>
        </div>

        <button
          className="btn btn-outline"
          onClick={() => loadData(true)}
          disabled={loading || refreshing}
          style={{ display: 'flex', alignItems: 'center', gap: 8, height: 42 }}
        >
          <RefreshCw size={16} className={refreshing ? 'spin' : ''} />
          {refreshing ? 'Refreshing...' : 'Refresh Inventory'}
        </button>
      </div>

      {/* Feedback Toast */}
      {feedback && (
        <div
          style={{
            background: feedback.type === 'success' ? '#f0fdf4' : '#fef2f2',
            border: `1px solid ${feedback.type === 'success' ? '#bbf7d0' : '#fecaca'}`,
            color: feedback.type === 'success' ? '#166534' : '#991b1b',
            padding: '14px 20px',
            borderRadius: 'var(--radius-md)',
            marginBottom: 24,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: 'var(--shadow-sm)',
            animation: 'fadeIn 0.2s ease-in-out'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {feedback.type === 'success' ? <CheckCircle size={20} /> : <AlertOctagon size={20} />}
            <span style={{ fontWeight: 600 }}>{feedback.message}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', padding: 4 }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Global Error Notice */}
      {error && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', padding: '14px 20px', borderRadius: 'var(--radius-md)', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 10 }}>
          <AlertOctagon size={20} />
          <span>{error}</span>
        </div>
      )}

      {/* KPI Cards Strip */}
      <div className="kpi-grid" style={{ marginBottom: 30, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 14 }}>
        <div
          className="kpi-card"
          style={{ borderLeft: lowStockCount > 0 ? '4px solid #f59e0b' : '4px solid var(--color-border)', cursor: 'pointer' }}
          onClick={() => { setActiveTab('low-stock'); setStockStatusFilter('Low Stock'); }}
          title="Filter by Low Stock"
        >
          <div className="kpi-icon" style={{ background: lowStockCount > 0 ? '#fef3c7' : 'var(--color-soft-mint)', color: lowStockCount > 0 ? '#d97706' : 'var(--color-primary)' }}>
            <TrendingDown size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--color-muted)', fontWeight: 700 }}>
              Low Stock Alert
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: lowStockCount > 0 ? '#d97706' : 'var(--color-ink-dark)' }}>
              {lowStockCount} <span style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--color-muted)' }}>items</span>
            </div>
          </div>
        </div>

        <div
          className="kpi-card"
          style={{ borderLeft: outOfStockCount > 0 ? '4px solid #b91c1c' : '4px solid var(--color-border)', cursor: 'pointer' }}
          onClick={() => { setActiveTab('low-stock'); setStockStatusFilter('Out of Stock'); }}
          title="Filter by Out of Stock"
        >
          <div className="kpi-icon" style={{ background: outOfStockCount > 0 ? '#fee2e2' : 'var(--color-soft-mint)', color: outOfStockCount > 0 ? '#b91c1c' : 'var(--color-primary)' }}>
            <AlertTriangle size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--color-muted)', fontWeight: 700 }}>
              Out of Stock
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: outOfStockCount > 0 ? '#b91c1c' : 'var(--color-ink-dark)' }}>
              {outOfStockCount} <span style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--color-muted)' }}>items</span>
            </div>
          </div>
        </div>

        <div
          className="kpi-card"
          style={{ borderLeft: '4px solid #16a34a', cursor: 'pointer' }}
          onClick={() => { setActiveTab('low-stock'); setStockStatusFilter('In Stock'); }}
          title="Filter by In Stock"
        >
          <div className="kpi-icon" style={{ background: '#dcfce7', color: '#16a34a' }}>
            <CheckCircle size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--color-muted)', fontWeight: 700 }}>
              In Stock Optimal
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#16a34a' }}>
              {inStockCount} <span style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--color-muted)' }}>items</span>
            </div>
          </div>
        </div>

        <div
          className="kpi-card"
          style={{ borderLeft: '4px solid #2563eb', cursor: 'pointer' }}
          onClick={() => setActiveTab('plans')}
          title="View Replenishment Plans"
        >
          <div className="kpi-icon" style={{ background: '#dbeafe', color: '#1d4ed8' }}>
            <Boxes size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--color-muted)', fontWeight: 700 }}>
              Active Replenishments
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#1d4ed8' }}>
              {activePlansCount} <span style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--color-muted)' }}>plans</span>
            </div>
          </div>
        </div>

        <div className="kpi-card" style={{ borderLeft: '4px solid var(--color-primary)' }}>
          <div className="kpi-icon" style={{ background: 'var(--color-soft-mint)', color: 'var(--color-primary)' }}>
            <PackageCheck size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--color-muted)', fontWeight: 700 }}>
              Stock Received
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-primary)' }}>
              {receivedPlansCount} <span style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--color-muted)' }}>orders</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Container Card */}
      <div style={{ background: '#ffffff', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden' }}>
        {/* Navigation Tabs and Controls */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--color-border)', padding: '16px 24px', background: '#fafbfa', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => setActiveTab('low-stock')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 18px',
                borderRadius: 'var(--radius-full)',
                fontWeight: 700,
                fontSize: '0.925rem',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s',
                background: activeTab === 'low-stock' ? 'var(--color-primary)' : 'transparent',
                color: activeTab === 'low-stock' ? '#ffffff' : 'var(--color-muted)',
              }}
            >
              <Warehouse size={16} />
              Stock Inventory & Procurement
              <span
                style={{
                  background: activeTab === 'low-stock' ? 'rgba(255,255,255,0.25)' : '#e2e8f0',
                  color: activeTab === 'low-stock' ? '#ffffff' : '#475569',
                  borderRadius: 12,
                  padding: '2px 8px',
                  fontSize: '0.75rem',
                  fontWeight: 800
                }}
              >
                {enrichedProducts.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('plans')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 18px',
                borderRadius: 'var(--radius-full)',
                fontWeight: 700,
                fontSize: '0.925rem',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s',
                background: activeTab === 'plans' ? 'var(--color-primary)' : 'transparent',
                color: activeTab === 'plans' ? '#ffffff' : 'var(--color-muted)',
              }}
            >
              <FileText size={16} />
              Replenishment Plans
              <span
                style={{
                  background: activeTab === 'plans' ? 'rgba(255,255,255,0.25)' : '#e2e8f0',
                  color: activeTab === 'plans' ? '#ffffff' : '#475569',
                  borderRadius: 12,
                  padding: '2px 8px',
                  fontSize: '0.75rem',
                  fontWeight: 800
                }}
              >
                {plans.length}
              </span>
            </button>
          </div>

          {/* Search bar and Filters */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', minWidth: 220 }}>
              <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-muted)' }} />
              <input
                type="text"
                placeholder="Search SKU or product..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px 8px 36px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-border)',
                  fontSize: '0.875rem',
                  outline: 'none',
                  background: '#ffffff'
                }}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-muted)' }}
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Stock Status Filter Buttons: All, In Stock, Low Stock, Out of Stock */}
            {activeTab === 'low-stock' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                <Filter size={15} style={{ color: 'var(--color-muted)', marginRight: 2 }} />
                {['All', 'In Stock', 'Low Stock', 'Out of Stock'].map((status) => {
                  const isSelected = stockStatusFilter === status;
                  const count =
                    status === 'All' ? enrichedProducts.length :
                    status === 'In Stock' ? inStockCount :
                    status === 'Low Stock' ? lowStockCount : outOfStockCount;

                  const badgeStyles = {
                    'All': {
                      border: isSelected ? 'var(--color-primary)' : 'var(--color-border)',
                      bg: isSelected ? 'var(--color-primary)' : '#ffffff',
                      color: isSelected ? '#ffffff' : 'var(--color-ink-dark)',
                      countBg: isSelected ? 'rgba(255,255,255,0.25)' : '#f1f5f9',
                      countColor: isSelected ? '#ffffff' : '#475569'
                    },
                    'In Stock': {
                      border: isSelected ? '#16a34a' : 'var(--color-border)',
                      bg: isSelected ? '#dcfce7' : '#ffffff',
                      color: isSelected ? '#15803d' : 'var(--color-ink-dark)',
                      countBg: isSelected ? '#bbf7d0' : '#f1f5f9',
                      countColor: isSelected ? '#15803d' : '#475569'
                    },
                    'Low Stock': {
                      border: isSelected ? '#d97706' : 'var(--color-border)',
                      bg: isSelected ? '#fef3c7' : '#ffffff',
                      color: isSelected ? '#b45309' : 'var(--color-ink-dark)',
                      countBg: isSelected ? '#fde68a' : '#f1f5f9',
                      countColor: isSelected ? '#b45309' : '#475569'
                    },
                    'Out of Stock': {
                      border: isSelected ? '#dc2626' : 'var(--color-border)',
                      bg: isSelected ? '#fee2e2' : '#ffffff',
                      color: isSelected ? '#b91c1c' : 'var(--color-ink-dark)',
                      countBg: isSelected ? '#fecaca' : '#f1f5f9',
                      countColor: isSelected ? '#b91c1c' : '#475569'
                    }
                  }[status];

                  return (
                    <button
                      key={status}
                      id={`filter-stock-${status.toLowerCase().replace(/ /g, '-')}`}
                      onClick={() => setStockStatusFilter(status)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: 'var(--radius-full)',
                        border: `1.5px solid ${badgeStyles.border}`,
                        background: badgeStyles.bg,
                        color: badgeStyles.color,
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6
                      }}
                    >
                      {status}
                      <span
                        style={{
                          fontSize: '0.725rem',
                          padding: '1px 6px',
                          borderRadius: 10,
                          background: badgeStyles.countBg,
                          color: badgeStyles.countColor,
                          fontWeight: 800
                        }}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {activeTab === 'plans' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Filter size={15} style={{ color: 'var(--color-muted)' }} />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  style={{
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-border)',
                    fontSize: '0.875rem',
                    background: '#ffffff',
                    color: 'var(--color-ink-dark)',
                    fontWeight: 600,
                    outline: 'none'
                  }}
                >
                  <option value="ALL">All Statuses</option>
                  <option value="PENDING">Pending</option>
                  <option value="APPROVED">Approved</option>
                  <option value="ORDERED">Ordered</option>
                  <option value="RECEIVED">Received</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Content Body */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--color-muted)' }}>
            <RefreshCw size={32} className="spin" style={{ margin: '0 auto 12px', color: 'var(--color-primary)' }} />
            <p>Loading inventory replenishment records...</p>
          </div>
        ) : activeTab === 'low-stock' ? (
          /* TAB 1: STOCK INVENTORY & PROCUREMENT */
          <div>
            {filteredProducts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                <CheckCircle size={48} style={{ color: 'var(--color-primary)', margin: '0 auto 16px' }} />
                <h3 style={{ fontSize: '1.25rem', color: 'var(--color-primary-dark)', marginBottom: 6 }}>
                  {searchQuery
                    ? 'No matching products found.'
                    : stockStatusFilter === 'Low Stock'
                    ? 'No low stock products! All inventory levels are healthy.'
                    : stockStatusFilter === 'Out of Stock'
                    ? 'No out of stock products!'
                    : stockStatusFilter === 'In Stock'
                    ? 'No in-stock products found.'
                    : 'No products available.'}
                </h3>
                <p style={{ color: 'var(--color-muted)', maxWidth: 450, margin: '0 auto' }}>
                  {searchQuery || stockStatusFilter !== 'All'
                    ? 'Try adjusting your search query or status filter to view other products.'
                    : 'Products in the catalog will appear here with replenishment metrics.'}
                </p>
                {(searchQuery || stockStatusFilter !== 'All') && (
                  <button
                    className="btn btn-secondary"
                    onClick={() => { setSearchQuery(''); setStockStatusFilter('All'); }}
                    style={{ marginTop: 16 }}
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th style={{ width: '28%' }}>Product & SKU</th>
                      <th style={{ width: '13%' }}>Category</th>
                      <th style={{ width: '13%' }}>Stock Status</th>
                      <th style={{ width: '18%' }}>Stock Level vs Threshold</th>
                      <th style={{ width: '13%' }}>Suggested Order</th>
                      <th style={{ width: '11%' }}>Active Plan</th>
                      <th style={{ width: '14%', textAlign: 'right' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.map((prod) => {
                      const percentOfTarget = Math.min(100, Math.round((prod.stockQuantity / Math.max(1, prod.targetStockLevel)) * 100));
                      const isZero = prod.stockQuantity === 0;
                      const isLow = prod.stockQuantity <= prod.reorderLevel;

                      return (
                        <tr key={prod.id}>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                              {prod.imageUrl ? (
                                <img
                                  src={prod.imageUrl}
                                  alt={prod.name}
                                  style={{ width: 44, height: 44, borderRadius: 8, objectFit: 'cover', border: '1px solid var(--color-border)', flexShrink: 0 }}
                                />
                              ) : (
                                <div style={{ width: 44, height: 44, borderRadius: 8, background: 'var(--color-soft-mint)', display: 'grid', placeItems: 'center', color: 'var(--color-primary)', flexShrink: 0 }}>
                                  <Warehouse size={20} />
                                </div>
                              )}
                              <div>
                                <div style={{ fontWeight: 700, color: 'var(--color-primary-dark)' }}>{prod.name}</div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--color-muted)', fontFamily: 'monospace' }}>SKU: {prod.sku}</div>
                              </div>
                            </div>
                          </td>

                          <td>
                            <span style={{ fontSize: '0.875rem', color: '#475569', background: '#f1f5f9', padding: '3px 10px', borderRadius: 6, fontWeight: 600 }}>
                              {prod.categoryName || 'General'}
                            </span>
                          </td>

                          <td>
                            {prod.status === 'Out of Stock' ? (
                              <span style={{
                                display: 'inline-flex', alignItems: 'center', gap: 4,
                                padding: '3px 10px', borderRadius: 12, fontSize: '0.78rem',
                                fontWeight: 700, background: '#fee2e2', color: '#b91c1c', border: '1px solid #fecaca'
                              }}>
                                <X size={12} /> Out of Stock
                              </span>
                            ) : prod.status === 'Low Stock' ? (
                              <span style={{
                                display: 'inline-flex', alignItems: 'center', gap: 4,
                                padding: '3px 10px', borderRadius: 12, fontSize: '0.78rem',
                                fontWeight: 700, background: '#fef3c7', color: '#b45309', border: '1px solid #fde68a'
                              }}>
                                <AlertTriangle size={12} /> Low Stock
                              </span>
                            ) : (
                              <span style={{
                                display: 'inline-flex', alignItems: 'center', gap: 4,
                                padding: '3px 10px', borderRadius: 12, fontSize: '0.78rem',
                                fontWeight: 700, background: '#dcfce7', color: '#15803d', border: '1px solid #bbf7d0'
                              }}>
                                <CheckCircle size={12} /> In Stock
                              </span>
                            )}
                          </td>

                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                              <strong style={{ fontSize: '1.05rem', color: isZero ? '#dc2626' : isLow ? '#d97706' : '#15803d' }}>
                                {prod.stockQuantity}
                              </strong>
                              <span style={{ fontSize: '0.8rem', color: 'var(--color-muted)' }}>
                                / Reorder: {prod.reorderLevel} (Target: {prod.targetStockLevel})
                              </span>
                            </div>
                            {/* Stock Level Progress Indicator */}
                            <div style={{ width: '100%', maxWidth: 160, height: 6, background: '#e2e8f0', borderRadius: 4, overflow: 'hidden' }}>
                              <div
                                style={{
                                  width: `${percentOfTarget}%`,
                                  height: '100%',
                                  background: isZero ? '#dc2626' : isLow ? '#ea580c' : '#16a34a',
                                  transition: 'width 0.4s ease'
                                }}
                              />
                            </div>
                          </td>

                          <td>
                            <span style={{ fontWeight: 800, fontSize: '0.95rem', color: isLow ? '#d97706' : 'var(--color-primary)' }}>
                              +{prod.suggestedQuantity} units
                            </span>
                          </td>

                          <td>
                            {prod.activePlanStatus ? (
                              getStatusBadge(prod.activePlanStatus)
                            ) : (
                              <span style={{ fontSize: '0.775rem', color: '#94a3b8', fontStyle: 'italic' }}>
                                None
                              </span>
                            )}
                          </td>

                          <td style={{ textAlign: 'right' }}>
                            <button
                              className="btn btn-primary"
                              onClick={() => handleOpenCreateModal(prod)}
                              style={{
                                padding: '6px 14px',
                                fontSize: '0.825rem',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 6,
                                borderRadius: 'var(--radius-sm)'
                              }}
                            >
                              <PlusCircle size={14} /> Create Plan
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : (
          /* TAB 2: REPLENISHMENT PLANS LIFECYCLE */
          <div>
            {filteredPlans.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                <Boxes size={48} style={{ color: 'var(--color-muted)', margin: '0 auto 16px', opacity: 0.6 }} />
                <h3 style={{ fontSize: '1.25rem', color: 'var(--color-primary-dark)', marginBottom: 6 }}>
                  No replenishment plans found.
                </h3>
                <p style={{ color: 'var(--color-muted)', maxWidth: 450, margin: '0 auto' }}>
                  {statusFilter !== 'ALL' || searchQuery
                    ? 'No plans match the selected status or search filter.'
                    : 'Click "Low Stock Alerts" to generate a new replenishment plan for items low on shelf inventory.'}
                </p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th style={{ width: '16%' }}>Plan / Created</th>
                      <th style={{ width: '22%' }}>Product & SKU</th>
                      <th style={{ width: '14%' }}>Stock vs Target</th>
                      <th style={{ width: '13%' }}>Order Qty</th>
                      <th style={{ width: '11%' }}>Status</th>
                      <th style={{ width: '24%', textAlign: 'right' }}>Workflow Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPlans.map((plan) => {
                      const isPending = plan.status === 'Pending';
                      const isApproved = plan.status === 'Approved';
                      const isOrdered = plan.status === 'Ordered';
                      const isReceived = plan.status === 'Received';
                      const isCancelled = plan.status === 'Cancelled';
                      const isLoadingThis = actionLoadingId === plan.id;

                      const formattedDate = new Date(plan.createdAt).toLocaleString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      });

                      return (
                        <tr key={plan.id}>
                          <td>
                            <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--color-primary-dark)' }}>
                              #{plan.id.slice(0, 8)}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--color-muted)' }}>
                              {formattedDate}
                            </div>
                          </td>

                          <td>
                            <div style={{ fontWeight: 700, color: 'var(--color-primary-dark)' }}>{plan.productName}</div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--color-muted)', fontFamily: 'monospace' }}>
                              SKU: {plan.productSku} · <span style={{ color: '#475569' }}>{plan.categoryName}</span>
                            </div>
                            {plan.notes && (
                              <div style={{ fontSize: '0.775rem', color: '#64748b', marginTop: 4, fontStyle: 'italic' }}>
                                "{plan.notes}"
                              </div>
                            )}
                          </td>

                          <td>
                            <div style={{ fontSize: '0.875rem' }}>
                              <span>Stock then: <strong>{plan.currentStock}</strong></span>
                              <div style={{ fontSize: '0.775rem', color: 'var(--color-muted)' }}>
                                Target: {plan.targetStockLevel} (Reorder: {plan.reorderLevel})
                              </div>
                            </div>
                          </td>

                          <td>
                            <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--color-primary)' }}>
                              {plan.requestedQuantity} units
                            </div>
                            {isReceived && plan.receivedQuantity && (
                              <div style={{ fontSize: '0.775rem', color: '#16a34a', fontWeight: 700 }}>
                                Received: {plan.receivedQuantity}
                              </div>
                            )}
                          </td>

                          <td>
                            {getStatusBadge(plan.status)}
                          </td>

                          <td style={{ textAlign: 'right' }}>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                              {isPending && (
                                <>
                                  <button
                                    className="btn btn-outline"
                                    onClick={() => handleTransitionPlan(plan.id, 'approve')}
                                    disabled={isLoadingThis}
                                    style={{
                                      padding: '5px 12px',
                                      fontSize: '0.8rem',
                                      borderColor: '#2563eb',
                                      color: '#2563eb',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: 4
                                    }}
                                    title="Approve procurement plan"
                                  >
                                    <Check size={14} /> Approve
                                  </button>
                                  <button
                                    className="btn btn-outline"
                                    onClick={() => handleCancelPlan(plan.id, plan.productName)}
                                    disabled={isLoadingThis}
                                    style={{
                                      padding: '5px 10px',
                                      fontSize: '0.8rem',
                                      borderColor: '#fca5a5',
                                      color: '#dc2626'
                                    }}
                                    title="Cancel plan"
                                  >
                                    <X size={14} />
                                  </button>
                                </>
                              )}

                              {isApproved && (
                                <>
                                  <button
                                    className="btn btn-outline"
                                    onClick={() => handleTransitionPlan(plan.id, 'ordered')}
                                    disabled={isLoadingThis}
                                    style={{
                                      padding: '5px 12px',
                                      fontSize: '0.8rem',
                                      borderColor: '#4f46e5',
                                      color: '#4f46e5',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: 4
                                    }}
                                    title="Mark order placed with supplier"
                                  >
                                    <Truck size={14} /> Mark Ordered
                                  </button>
                                  <button
                                    className="btn btn-primary"
                                    onClick={() => handleOpenReceiveModal(plan)}
                                    disabled={isLoadingThis}
                                    style={{
                                      padding: '5px 12px',
                                      fontSize: '0.8rem',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: 4
                                    }}
                                    title="Directly receive and restock"
                                  >
                                    <PackageCheck size={14} /> Receive Stock
                                  </button>
                                  <button
                                    className="btn btn-outline"
                                    onClick={() => handleCancelPlan(plan.id, plan.productName)}
                                    disabled={isLoadingThis}
                                    style={{
                                      padding: '5px 10px',
                                      fontSize: '0.8rem',
                                      borderColor: '#fca5a5',
                                      color: '#dc2626'
                                    }}
                                    title="Cancel plan"
                                  >
                                    <X size={14} />
                                  </button>
                                </>
                              )}

                              {isOrdered && (
                                <button
                                  className="btn btn-primary"
                                  onClick={() => handleOpenReceiveModal(plan)}
                                  disabled={isLoadingThis}
                                  style={{
                                    padding: '6px 14px',
                                    fontSize: '0.825rem',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 6
                                  }}
                                >
                                  <PackageCheck size={15} /> Receive Stock
                                </button>
                              )}

                              {isReceived && (
                                <span style={{ fontSize: '0.8rem', color: '#16a34a', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                  <CheckCircle size={14} /> Restocked
                                </span>
                              )}

                              {isCancelled && (
                                <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontStyle: 'italic' }}>
                                  No actions
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* MODAL 1: CREATE REPLENISHMENT PLAN */}
      {createModalItem && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'grid',
            placeItems: 'center',
            zIndex: 1000,
            padding: 20
          }}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: 'var(--radius-md)',
              width: '100%',
              maxWidth: 520,
              boxShadow: 'var(--shadow-lg)',
              overflow: 'hidden',
              animation: 'fadeIn 0.2s ease-out'
            }}
          >
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ background: 'var(--color-soft-mint)', color: 'var(--color-primary)', padding: 6, borderRadius: 8 }}>
                  <PlusCircle size={20} />
                </div>
                <h3 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--color-primary-dark)' }}>
                  New Replenishment Plan
                </h3>
              </div>
              <button
                onClick={() => setCreateModalItem(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-muted)' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmitCreatePlan}>
              <div style={{ padding: 24 }}>
                {/* Product Summary Box */}
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 'var(--radius-sm)', padding: 16, marginBottom: 20 }}>
                  <div style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--color-primary-dark)' }}>
                    {createModalItem.name}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--color-muted)', marginBottom: 12 }}>
                    SKU: {createModalItem.sku} · Category: {createModalItem.categoryName}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, textAlign: 'center', borderTop: '1px solid #e2e8f0', paddingTop: 10 }}>
                    <div>
                      <div style={{ fontSize: '0.725rem', color: 'var(--color-muted)', textTransform: 'uppercase' }}>Current</div>
                      <div style={{ fontWeight: 800, color: createModalItem.stockQuantity === 0 ? '#dc2626' : '#d97706' }}>
                        {createModalItem.stockQuantity}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.725rem', color: 'var(--color-muted)', textTransform: 'uppercase' }}>Reorder At</div>
                      <div style={{ fontWeight: 800, color: '#475569' }}>
                        {createModalItem.reorderLevel}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.725rem', color: 'var(--color-muted)', textTransform: 'uppercase' }}>Target Stock</div>
                      <div style={{ fontWeight: 800, color: 'var(--color-primary)' }}>
                        {createModalItem.targetStockLevel}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Input: Requested Quantity */}
                <div style={{ marginBottom: 18 }}>
                  <label style={{ display: 'block', fontWeight: 700, fontSize: '0.875rem', marginBottom: 6, color: 'var(--color-primary-dark)' }}>
                    Requested Quantity (Units) <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={createQuantity}
                    onChange={(e) => setCreateQuantity(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--color-border)',
                      fontSize: '1rem',
                      fontWeight: 700,
                      color: 'var(--color-primary-dark)',
                      outline: 'none'
                    }}
                  />
                  <div style={{ fontSize: '0.775rem', color: 'var(--color-muted)', marginTop: 4 }}>
                    Suggested by formula: <strong>+{createModalItem.suggestedQuantity} units</strong> to achieve target level of {createModalItem.targetStockLevel}.
                  </div>
                </div>

                {/* Input: Notes */}
                <div style={{ marginBottom: 10 }}>
                  <label style={{ display: 'block', fontWeight: 700, fontSize: '0.875rem', marginBottom: 6, color: 'var(--color-primary-dark)' }}>
                    Notes & Procurement Instructions (Optional)
                  </label>
                  <textarea
                    rows={3}
                    placeholder="e.g., Requested from Central Warehouse, express shipment required..."
                    value={createNotes}
                    onChange={(e) => setCreateNotes(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--color-border)',
                      fontSize: '0.875rem',
                      outline: 'none',
                      resize: 'vertical'
                    }}
                  />
                </div>
              </div>

              <div style={{ padding: '16px 24px', background: '#f8fafc', borderTop: '1px solid var(--color-border)', display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setCreateModalItem(null)}
                  disabled={submittingCreate}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submittingCreate || createQuantity <= 0}
                  style={{ display: 'flex', alignItems: 'center', gap: 8 }}
                >
                  {submittingCreate ? (
                    <>
                      <RefreshCw size={16} className="spin" /> Creating Plan...
                    </>
                  ) : (
                    <>
                      <PlusCircle size={16} /> Create Plan
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: RECEIVE STOCK CONFIRMATION */}
      {receiveModalPlan && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'grid',
            placeItems: 'center',
            zIndex: 1000,
            padding: 20
          }}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: 'var(--radius-md)',
              width: '100%',
              maxWidth: 520,
              boxShadow: 'var(--shadow-lg)',
              overflow: 'hidden',
              animation: 'fadeIn 0.2s ease-out'
            }}
          >
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ background: '#dcfce7', color: '#166534', padding: 6, borderRadius: 8 }}>
                  <PackageCheck size={20} />
                </div>
                <h3 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--color-primary-dark)' }}>
                  Receive Stock & Restock Floor
                </h3>
              </div>
              <button
                onClick={() => setReceiveModalPlan(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-muted)' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmitReceiveStock}>
              <div style={{ padding: 24 }}>
                <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 'var(--radius-sm)', padding: 14, marginBottom: 18 }}>
                  <div style={{ fontWeight: 800, color: '#166534', fontSize: '1rem' }}>
                    {receiveModalPlan.productName}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#15803d' }}>
                    SKU: {receiveModalPlan.productSku} · Originally requested: <strong>{receiveModalPlan.requestedQuantity} units</strong>
                  </div>
                </div>

                <div style={{ marginBottom: 18 }}>
                  <label style={{ display: 'block', fontWeight: 700, fontSize: '0.875rem', marginBottom: 6, color: 'var(--color-primary-dark)' }}>
                    Actual Quantity Received <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={receiveQuantity}
                    onChange={(e) => setReceiveQuantity(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--color-border)',
                      fontSize: '1.1rem',
                      fontWeight: 800,
                      color: 'var(--color-primary)',
                      outline: 'none'
                    }}
                  />
                  <div style={{ fontSize: '0.775rem', color: 'var(--color-muted)', marginTop: 4 }}>
                    Adjust if the delivery contains partial quantity or bonus units.
                  </div>
                </div>

                <div style={{ marginBottom: 14 }}>
                  <label style={{ display: 'block', fontWeight: 700, fontSize: '0.875rem', marginBottom: 6, color: 'var(--color-primary-dark)' }}>
                    Receipt Note / Inspection Remarks
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Verified by floor staff, delivery batch #984"
                    value={receiveNotes}
                    onChange={(e) => setReceiveNotes(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--color-border)',
                      fontSize: '0.875rem',
                      outline: 'none'
                    }}
                  />
                </div>

                <div style={{ background: '#f8fafc', border: '1px dashed #cbd5e1', borderRadius: 'var(--radius-sm)', padding: 12, fontSize: '0.775rem', color: '#64748b' }}>
                  ℹ️ Confirming receipt will immediately increment catalog live stock by <strong>+{receiveQuantity} units</strong>, record an audit entry in the stock movements ledger, and complete this plan.
                </div>
              </div>

              <div style={{ padding: '16px 24px', background: '#f8fafc', borderTop: '1px solid var(--color-border)', display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setReceiveModalPlan(null)}
                  disabled={submittingReceive}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submittingReceive || receiveQuantity <= 0}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#16a34a', borderColor: '#16a34a' }}
                >
                  {submittingReceive ? (
                    <>
                      <RefreshCw size={16} className="spin" /> Updating Stock...
                    </>
                  ) : (
                    <>
                      <CheckCircle size={16} /> Confirm & Restock
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReplenishmentManager;
