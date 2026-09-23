import React, { useState, useEffect, useMemo } from 'react';
import {
  Package,
  Plus,
  Edit2,
  Trash2,
  Search,
  AlertCircle,
  CheckCircle2,
  X,
  RefreshCw,
  Tag,
  Filter,
  FolderOpen
} from 'lucide-react';
import { Link } from 'react-router-dom';
import axiosInstance from '../../services/axiosInstance';
import { useAuth } from '../../context/AuthContext';
import { normalizeProduct, validateProductInput, PRODUCT_PLACEHOLDER_IMAGE } from '../../models/Product';
import { normalizeCategory } from '../../models/Category';

export const ManageProducts = () => {
  const { user, activeRole } = useAuth();

  // Role checks
  const roles = user?.roles || [];
  const isOperationsAdmin = activeRole === 'ADMIN' || roles.includes('OperationsAdmin') || roles.includes('ADMIN');
  const isStaff = activeRole === 'STAFF' || roles.includes('Staff') || roles.includes('STAFF') || roles.includes('CatalogStaff') || roles.includes('InventoryStaff');
  const canManage = isOperationsAdmin || isStaff;

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  // Form states
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [deletingTarget, setDeletingTarget] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Form inputs
  const [formData, setFormData] = useState({
    sku: '',
    name: '',
    description: '',
    price: '',
    stockQuantity: '0',
    categoryId: '',
    imageUrl: '',
    reorderLevel: '10',
    targetStockLevel: '50',
  });
  const [formErrors, setFormErrors] = useState({});
  const [imagePreviewError, setImagePreviewError] = useState(false);

  // 1. Fetch categories for selection dropdowns
  const fetchCategories = async () => {
    try {
      const data = await axiosInstance.get('/catalog/categories');
      if (Array.isArray(data)) {
        const list = data.map(normalizeCategory);
        setCategories(list);
        return list;
      }
    } catch {
      // Fallback silently if categories call fails
    }
    return [];
  };

  // 2. Fetch products from staff endpoint or public endpoint
  const fetchProducts = async () => {
    setLoading(true);
    setError('');
    try {
      let data;
      try {
        data = await axiosInstance.get('/catalog/staff/products');
      } catch (staffErr) {
        // Fallback to public endpoint if staff endpoint is unavailable
        data = await axiosInstance.get('/catalog/products?pageSize=100');
      }

      if (Array.isArray(data)) {
        setProducts(data.map(normalizeProduct));
      } else {
        setProducts([]);
      }
    } catch (err) {
      setError(err.message || 'Failed to load products. Please check backend connection.');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories().then((catList) => {
      if (catList.length > 0 && !formData.categoryId) {
        setFormData((prev) => ({ ...prev, categoryId: catList[0].id }));
      }
    });
    fetchProducts();
  }, []);

  // Filtered products list
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch = !q || p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q);
      const matchesCat = selectedCategory === 'ALL' || p.categoryId === selectedCategory || p.category?.id === selectedCategory;
      return matchesSearch && matchesCat;
    });
  }, [products, searchQuery, selectedCategory]);

  // Product metrics
  const totalCount = products.length;
  const inStockCount = products.filter((p) => p.stockQuantity > 0).length;
  const lowStockCount = products.filter((p) => p.stockQuantity <= 10).length;

  // Open add modal
  const handleOpenAdd = () => {
    setEditingProduct(null);
    setFormData({
      sku: '',
      name: '',
      description: '',
      price: '',
      stockQuantity: '0',
      categoryId: categories.length > 0 ? categories[0].id : '',
      imageUrl: '',
      reorderLevel: '10',
      targetStockLevel: '50',
    });
    setFormErrors({});
    setImagePreviewError(false);
    setShowAddForm(true);
  };

  // Open edit modal
  const handleOpenEdit = (product) => {
    setShowAddForm(false);
    setEditingProduct(product);
    setFormData({
      sku: product.sku || '',
      name: product.name || '',
      description: product.description || '',
      price: String(product.price ?? ''),
      stockQuantity: String(product.stockQuantity ?? '0'),
      categoryId: product.categoryId || product.category?.id || (categories.length > 0 ? categories[0].id : ''),
      imageUrl: product.imageUrl || product.image_url || '',
      reorderLevel: String(product.reorderLevel ?? '10'),
      targetStockLevel: String(product.targetStockLevel ?? '50'),
    });
    setFormErrors({});
    setImagePreviewError(false);
  };

  // Cancel form
  const handleCancelForm = () => {
    setShowAddForm(false);
    setEditingProduct(null);
    setFormData({
      sku: '',
      name: '',
      description: '',
      price: '',
      stockQuantity: '0',
      categoryId: categories.length > 0 ? categories[0].id : '',
      imageUrl: '',
      reorderLevel: '10',
      targetStockLevel: '50',
    });
    setFormErrors({});
    setImagePreviewError(false);
  };

  // Submit Add or Edit
  const handleSubmitForm = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    const validation = validateProductInput(formData);
    if (!validation.valid) {
      setFormErrors(validation.errors);
      return;
    }

    setSubmitting(true);
    setFormErrors({});

    const payload = {
      sku: formData.sku.trim(),
      name: formData.name.trim(),
      description: formData.description.trim() || null,
      price: Number(formData.price),
      stockQuantity: Number(formData.stockQuantity),
      categoryId: formData.categoryId.trim(),
      imageUrl: formData.imageUrl?.trim() || null,
      reorderLevel: Number(formData.reorderLevel || 10),
      targetStockLevel: Number(formData.targetStockLevel || 50),
    };

    try {
      if (editingProduct) {
        // PUT update
        await axiosInstance.put(`/catalog/products/${editingProduct.id}`, payload);
        setSuccessMsg(`Product "${payload.name}" (SKU: ${payload.sku}) updated successfully!`);
        setEditingProduct(null);
      } else {
        // POST create
        await axiosInstance.post('/catalog/products', payload);
        setSuccessMsg(`Product "${payload.name}" (SKU: ${payload.sku}) created successfully!`);
        setShowAddForm(false);
      }

      await fetchProducts();
    } catch (err) {
      setError(err.message || 'Failed to save product.');
    } finally {
      setSubmitting(false);
    }
  };

  // Permanently delete product from database
  const handleConfirmDelete = async () => {
    if (!deletingTarget) return;
    setSubmitting(true);
    setError('');
    setSuccessMsg('');

    try {
      await axiosInstance.delete(`/catalog/products/${deletingTarget.id}`);
      setSuccessMsg(`Product "${deletingTarget.name}" (SKU: ${deletingTarget.sku}) permanently deleted from database.`);
      setDeletingTarget(null);
      await fetchProducts();
    } catch (err) {
      setError(err.message || `Failed to delete product "${deletingTarget.name}".`);
      setDeletingTarget(null);
    } finally {
      setSubmitting(false);
    }
  };

  if (!canManage) {
    return (
      <div style={{ padding: '60px 20px', textAlign: 'center' }}>
        <AlertCircle size={48} style={{ color: '#dc2626', marginBottom: 16 }} />
        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.8rem', marginBottom: 8 }}>Access Restricted</h2>
        <p style={{ color: 'var(--color-muted)' }}>
          You do not have permission to manage catalog products. Only Operations Admins and Staff can access this page.
        </p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: 16,
          marginBottom: 28,
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <Package size={28} style={{ color: 'var(--color-primary)' }} />
            <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '2.2rem', color: 'var(--color-primary-dark)', margin: 0 }}>
              Product Catalog Management
            </h1>
          </div>
          <p style={{ color: 'var(--color-muted)', margin: 0 }}>
            Manage TNT Supermarket inventory items, pricing, SKU codes, and category assignments.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            className="btn btn-outline"
            onClick={() => {
              fetchCategories();
              fetchProducts();
            }}
            disabled={loading}
            title="Refresh product list"
          >
            <RefreshCw size={16} className={loading ? 'spin' : ''} /> Refresh
          </button>

          {!showAddForm && !editingProduct && (
            <button className="btn btn-primary" onClick={handleOpenAdd}>
              <Plus size={18} /> Add New Product
            </button>
          )}
        </div>
      </div>

      {/* Global Alerts */}
      {error && (
        <div
          style={{
            background: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#991b1b',
            padding: '12px 16px',
            borderRadius: 'var(--radius-md)',
            marginBottom: 24,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
          <button
            onClick={() => setError('')}
            style={{ background: 'none', border: 'none', color: '#991b1b', cursor: 'pointer', padding: 4 }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {successMsg && (
        <div
          style={{
            background: '#f0fdf4',
            border: '1px solid #bbf7d0',
            color: '#166534',
            padding: '12px 16px',
            borderRadius: 'var(--radius-md)',
            marginBottom: 24,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <CheckCircle2 size={20} />
            <span>{successMsg}</span>
          </div>
          <button
            onClick={() => setSuccessMsg('')}
            style={{ background: 'none', border: 'none', color: '#166534', cursor: 'pointer', padding: 4 }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Summary Metrics */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 16,
          marginBottom: 28,
        }}
      >
        <div
          style={{
            background: '#ffffff',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-md)',
            padding: '18px 20px',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div style={{ fontSize: '0.85rem', color: 'var(--color-muted)', fontWeight: 600, marginBottom: 4 }}>
            TOTAL PRODUCTS
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--color-primary-dark)' }}>
            {totalCount}
          </div>
        </div>

        <div
          style={{
            background: '#ffffff',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-md)',
            padding: '18px 20px',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div style={{ fontSize: '0.85rem', color: 'var(--color-muted)', fontWeight: 600, marginBottom: 4 }}>
            IN STOCK
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#166534' }}>
            {inStockCount}
          </div>
        </div>

        <div
          style={{
            background: '#ffffff',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-md)',
            padding: '18px 20px',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div style={{ fontSize: '0.85rem', color: 'var(--color-muted)', fontWeight: 600, marginBottom: 4 }}>
            LOW / OUT OF STOCK
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: lowStockCount > 0 ? '#dc2626' : 'var(--color-ink-dark)' }}>
            {lowStockCount}
          </div>
        </div>
      </div>

      {/* Add / Edit Form Drawer */}
      {(showAddForm || editingProduct) && (
        <div
          style={{
            background: '#ffffff',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-md)',
            padding: 24,
            marginBottom: 32,
            boxShadow: 'var(--shadow-md)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.4rem', margin: 0 }}>
              {editingProduct ? `Edit Product (SKU: ${editingProduct.sku})` : 'Add New Grocery Product'}
            </h3>
            <button
              onClick={handleCancelForm}
              style={{ background: 'none', border: 'none', color: 'var(--color-muted)', cursor: 'pointer' }}
            >
              <X size={20} />
            </button>
          </div>

          {categories.length === 0 && (
            <div
              style={{
                background: '#fffbeb',
                border: '1px solid #fde68a',
                color: '#b45309',
                padding: '12px 16px',
                borderRadius: 'var(--radius-sm)',
                marginBottom: 20,
                fontSize: '0.9rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <AlertCircle size={18} />
                <span>No categories found in database. You must create at least one category before adding products.</span>
              </div>
              <Link to="/admin/categories" className="btn btn-outline" style={{ padding: '4px 12px', fontSize: '0.8rem' }}>
                <FolderOpen size={14} /> Manage Categories
              </Link>
            </div>
          )}

          <form onSubmit={handleSubmitForm}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 16 }}>
              {/* SKU */}
              <div>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: 6 }}>
                  SKU Code <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <input
                  type="text"
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  placeholder="e.g. PRODUCE-BAN-01"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: `1px solid ${formErrors.sku ? '#dc2626' : 'var(--color-border)'}`,
                    borderRadius: 'var(--radius-sm)',
                    outline: 'none',
                  }}
                />
                {formErrors.sku && (
                  <div style={{ color: '#dc2626', fontSize: '0.78rem', marginTop: 4 }}>{formErrors.sku}</div>
                )}
              </div>

              {/* Product Name */}
              <div>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: 6 }}>
                  Product Name <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Organic Cavendish Bananas 1kg"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: `1px solid ${formErrors.name ? '#dc2626' : 'var(--color-border)'}`,
                    borderRadius: 'var(--radius-sm)',
                    outline: 'none',
                  }}
                />
                {formErrors.name && (
                  <div style={{ color: '#dc2626', fontSize: '0.78rem', marginTop: 4 }}>{formErrors.name}</div>
                )}
              </div>

              {/* Category Dropdown */}
              <div>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: 6 }}>
                  Category <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <select
                  value={formData.categoryId}
                  onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: `1px solid ${formErrors.categoryId ? '#dc2626' : 'var(--color-border)'}`,
                    borderRadius: 'var(--radius-sm)',
                    outline: 'none',
                    background: '#ffffff',
                  }}
                >
                  <option value="">-- Select Category --</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
                {formErrors.categoryId && (
                  <div style={{ color: '#dc2626', fontSize: '0.78rem', marginTop: 4 }}>{formErrors.categoryId}</div>
                )}
              </div>

              {/* Price */}
              <div>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: 6 }}>
                  Price ($) <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  placeholder="e.g. 4.99"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: `1px solid ${formErrors.price ? '#dc2626' : 'var(--color-border)'}`,
                    borderRadius: 'var(--radius-sm)',
                    outline: 'none',
                  }}
                />
                {formErrors.price && (
                  <div style={{ color: '#dc2626', fontSize: '0.78rem', marginTop: 4 }}>{formErrors.price}</div>
                )}
              </div>

              {/* Stock Quantity */}
              <div>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: 6 }}>
                  Stock Quantity <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={formData.stockQuantity}
                  onChange={(e) => setFormData({ ...formData, stockQuantity: e.target.value })}
                  placeholder="e.g. 50"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: `1px solid ${formErrors.stockQuantity ? '#dc2626' : 'var(--color-border)'}`,
                    borderRadius: 'var(--radius-sm)',
                    outline: 'none',
                  }}
                />
                {formErrors.stockQuantity && (
                  <div style={{ color: '#dc2626', fontSize: '0.78rem', marginTop: 4 }}>{formErrors.stockQuantity}</div>
                )}
              </div>
            </div>

            {/* Inventory Replenishment Thresholds */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
              <div>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: 6 }}>
                  Reorder Level (Alert Threshold)
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={formData.reorderLevel}
                  onChange={(e) => setFormData({ ...formData, reorderLevel: e.target.value })}
                  placeholder="e.g. 10"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: `1px solid ${formErrors.reorderLevel ? '#dc2626' : 'var(--color-border)'}`,
                    borderRadius: 'var(--radius-sm)',
                    outline: 'none',
                  }}
                />
                {formErrors.reorderLevel && (
                  <div style={{ color: '#dc2626', fontSize: '0.78rem', marginTop: 4 }}>{formErrors.reorderLevel}</div>
                )}
                <div style={{ fontSize: '0.75rem', color: 'var(--color-muted)', marginTop: 3 }}>
                  Alerts staff when stock falls to or below this level.
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: 6 }}>
                  Target Stock Level (Replenish Target)
                </label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={formData.targetStockLevel}
                  onChange={(e) => setFormData({ ...formData, targetStockLevel: e.target.value })}
                  placeholder="e.g. 50"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: `1px solid ${formErrors.targetStockLevel ? '#dc2626' : 'var(--color-border)'}`,
                    borderRadius: 'var(--radius-sm)',
                    outline: 'none',
                  }}
                />
                {formErrors.targetStockLevel && (
                  <div style={{ color: '#dc2626', fontSize: '0.78rem', marginTop: 4 }}>{formErrors.targetStockLevel}</div>
                )}
                <div style={{ fontSize: '0.75rem', color: 'var(--color-muted)', marginTop: 3 }}>
                  Desired inventory quantity upon replenishment.
                </div>
              </div>
            </div>

            {/* Description */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: 6 }}>
                Description <span style={{ color: 'var(--color-muted)', fontWeight: 400 }}>(Optional)</span>
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Product description, ingredients, or storage instructions..."
                rows={3}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: `1px solid ${formErrors.description ? '#dc2626' : 'var(--color-border)'}`,
                  borderRadius: 'var(--radius-sm)',
                  outline: 'none',
                  resize: 'vertical',
                }}
              />
              {formErrors.description && (
                <div style={{ color: '#dc2626', fontSize: '0.78rem', marginTop: 4 }}>{formErrors.description}</div>
              )}
            </div>

            {/* Image URL & Live Preview */}
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 140px', gap: 16, alignItems: 'start', marginBottom: 20 }}>
              <div>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: 6 }}>
                  Product Image URL <span style={{ color: 'var(--color-muted)', fontWeight: 400 }}>(Optional)</span>
                </label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/... or direct image link"
                  value={formData.imageUrl}
                  onChange={(e) => {
                    setFormData({ ...formData, imageUrl: e.target.value });
                    setImagePreviewError(false);
                    if (formErrors.imageUrl) setFormErrors({ ...formErrors, imageUrl: '' });
                  }}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: `1px solid ${formErrors.imageUrl ? '#dc2626' : 'var(--color-border)'}`,
                    borderRadius: 'var(--radius-sm)',
                    outline: 'none',
                  }}
                />
                <div style={{ fontSize: '0.75rem', color: 'var(--color-muted)', marginTop: 4 }}>
                  Provide a direct public image link (HTTPS). If left empty, a supermarket placeholder is used.
                </div>
                {formErrors.imageUrl && (
                  <div style={{ color: '#dc2626', fontSize: '0.78rem', marginTop: 4 }}>{formErrors.imageUrl}</div>
                )}
              </div>

              {/* Preview Thumbnail */}
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, marginBottom: 4, color: 'var(--color-muted)' }}>
                  Image Preview
                </div>
                <div
                  style={{
                    width: 140,
                    height: 90,
                    borderRadius: 'var(--radius-sm)',
                    overflow: 'hidden',
                    border: '1px solid var(--color-border)',
                    background: '#f8fafc',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <img
                    src={(!imagePreviewError && formData.imageUrl?.trim()) ? formData.imageUrl.trim() : PRODUCT_PLACEHOLDER_IMAGE}
                    alt="Product preview"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={() => setImagePreviewError(true)}
                  />
                </div>
              </div>
            </div>

            {/* Form Action Buttons */}
            <div style={{ display: 'flex', gap: 12 }}>
              <button type="submit" className="btn btn-primary" disabled={submitting || categories.length === 0}>
                {submitting ? 'Saving...' : editingProduct ? 'Update Product' : 'Save Product to Catalog'}
              </button>
              <button type="button" className="btn btn-outline" onClick={handleCancelForm} disabled={submitting}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div
        style={{
          background: '#ffffff',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-md)',
          padding: 16,
          marginBottom: 24,
          display: 'flex',
          flexWrap: 'wrap',
          gap: 12,
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, flex: 1, minWidth: 280 }}>
          {/* Search */}
          <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
            <Search size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-muted)' }} />
            <input
              type="text"
              placeholder="Search by product name or SKU..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 12px 9px 38px',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-sm)',
                outline: 'none',
                fontSize: '0.9rem',
              }}
            />
          </div>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            style={{
              padding: '9px 12px',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-sm)',
              outline: 'none',
              background: '#ffffff',
              fontSize: '0.9rem',
            }}
          >
            <option value="ALL">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div style={{ fontSize: '0.85rem', color: 'var(--color-muted)' }}>
          Showing <strong>{filteredProducts.length}</strong> of <strong>{products.length}</strong> products
        </div>
      </div>

      {/* Empty State (0 products in database) */}
      {!loading && products.length === 0 && (
        <div
          style={{
            background: '#ffffff',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-md)',
            padding: '60px 20px',
            textAlign: 'center',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <Package size={56} style={{ color: 'var(--color-muted)', marginBottom: 16 }} />
          <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.6rem', marginBottom: 8, color: 'var(--color-primary-dark)' }}>
            No Products Available in Catalog
          </h3>
          <p style={{ color: 'var(--color-muted)', maxWidth: 460, margin: '0 auto 24px', fontSize: '0.95rem' }}>
            Your supermarket inventory is currently empty. Get started by adding grocery items with SKU, price, stock quantity, and category assignment.
          </p>
          <button className="btn btn-primary" onClick={handleOpenAdd}>
            <Plus size={18} /> Add Your First Product
          </button>
        </div>
      )}

      {/* Empty State for Filter mismatch */}
      {!loading && products.length > 0 && filteredProducts.length === 0 && (
        <div
          style={{
            background: '#ffffff',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-md)',
            padding: '40px 20px',
            textAlign: 'center',
          }}
        >
          <Filter size={40} style={{ color: 'var(--color-muted)', marginBottom: 12 }} />
          <h4 style={{ fontSize: '1.2rem', marginBottom: 6 }}>No matching products found</h4>
          <p style={{ color: 'var(--color-muted)', fontSize: '0.9rem', marginBottom: 16 }}>
            Try adjusting your search criteria or filter options.
          </p>
          <button
            className="btn btn-outline"
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('ALL');
            }}
          >
            Clear Filters
          </button>
        </div>
      )}

      {/* Product Data Table */}
      {!loading && filteredProducts.length > 0 && (
        <div
          style={{
            background: '#ffffff',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-sm)',
            overflow: 'hidden',
          }}
        >
          <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--color-soft-mint)', textAlign: 'left' }}>
                <th style={{ padding: '12px 16px' }}>SKU</th>
                <th style={{ padding: '12px 16px' }}>Product Name</th>
                <th style={{ padding: '12px 16px' }}>Category</th>
                <th style={{ padding: '12px 16px' }}>Price</th>
                <th style={{ padding: '12px 16px' }}>Stock</th>
                <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((p) => (
                <tr key={p.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontSize: '0.88rem', fontWeight: 600, color: 'var(--color-primary-dark)' }}>
                    {p.sku}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <img
                        src={p.imageUrl || p.image_url || PRODUCT_PLACEHOLDER_IMAGE}
                        alt={p.name}
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 'var(--radius-sm)',
                          objectFit: 'cover',
                          border: '1px solid var(--color-border)',
                          flexShrink: 0,
                          background: '#f8fafc',
                        }}
                        onError={(e) => {
                          e.currentTarget.src = PRODUCT_PLACEHOLDER_IMAGE;
                        }}
                      />
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--color-ink-dark)' }}>{p.name}</div>
                        {p.description && (
                          <div style={{ fontSize: '0.8rem', color: 'var(--color-muted)', marginTop: 2, maxWidth: 300, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {p.description}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        background: 'var(--color-soft-mint)',
                        color: 'var(--color-primary-dark)',
                        padding: '4px 10px',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.82rem',
                        fontWeight: 600,
                      }}
                    >
                      <Tag size={12} /> {p.category?.name || 'Uncategorized'}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', fontWeight: 700 }}>
                    ${Number(p.price).toFixed(2)}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span
                      className={`status-pill ${
                        p.stockQuantity === 0
                          ? 'status-cancelled'
                          : p.stockQuantity <= 10
                          ? 'status-pending'
                          : 'status-delivered'
                      }`}
                    >
                      {p.stockQuantity} in stock
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: 6 }}>
                      <button
                        className="btn btn-ghost"
                        style={{ padding: 6 }}
                        onClick={() => handleOpenEdit(p)}
                        title="Edit product"
                      >
                        <Edit2 size={16} />
                      </button>
                      {isOperationsAdmin && (
                        <button
                          className="btn btn-ghost"
                          style={{ padding: 6, color: '#7f1d1d' }}
                          onClick={() => setDeletingTarget(p)}
                          title="Permanently delete product"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Permanent Delete Confirmation Modal */}
      {deletingTarget && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.55)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1001,
            padding: 20,
          }}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: 'var(--radius-md)',
              padding: 28,
              maxWidth: 460,
              width: '100%',
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
              border: '2px solid #fecaca',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: '#7f1d1d', marginBottom: 16 }}>
              <div style={{ background: '#fef2f2', borderRadius: '50%', padding: 10, display: 'flex' }}>
                <Trash2 size={24} />
              </div>
              <h3 style={{ margin: 0, fontFamily: 'var(--font-serif)', fontSize: '1.3rem' }}>
                Permanently Delete Product?
              </h3>
            </div>

            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 'var(--radius-sm)', padding: '12px 16px', marginBottom: 16 }}>
              <div style={{ fontWeight: 700, color: '#7f1d1d', marginBottom: 4 }}>⚠ This action cannot be undone</div>
              <div style={{ fontSize: '0.88rem', color: '#991b1b' }}>
                Product <strong>"{deletingTarget.name}"</strong> (SKU: <code>{deletingTarget.sku}</code>) will be permanently removed from the database along with its audit and stock movement history.
              </div>
            </div>

            <p style={{ color: 'var(--color-muted)', fontSize: '0.9rem', marginBottom: 20 }}>
              This product will be completely removed from the catalog and customer shopping store.
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button
                className="btn btn-outline"
                onClick={() => setDeletingTarget(null)}
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                className="btn"
                style={{ background: '#7f1d1d', color: '#ffffff', border: 'none', display: 'flex', alignItems: 'center', gap: 8 }}
                onClick={handleConfirmDelete}
                disabled={submitting}
              >
                <Trash2 size={16} />
                {submitting ? 'Deleting...' : 'Delete Permanently'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageProducts;
