import React, { useState, useEffect, useMemo } from 'react';
import {
  Layers,
  Plus,
  Edit2,
  Trash2,
  Search,
  AlertCircle,
  CheckCircle2,
  X,
  RefreshCw,
  ImageIcon,
  FolderOpen
} from 'lucide-react';
import axiosInstance from '../../services/axiosInstance';
import { useAuth } from '../../context/AuthContext';
import {
  CATEGORY_PLACEHOLDER_IMAGE,
  normalizeCategory,
  validateCategoryInput
} from '../../models/Category';

export const ManageCategories = () => {
  const { user, activeRole } = useAuth();

  // Role checks
  const roles = user?.roles || [];
  const isAdmin = activeRole === 'Admin' || roles.includes('Admin');
  const isStaff = activeRole === 'Staff' || roles.includes('Staff');
  const canManage = isAdmin || isStaff;

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Form states
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [deleteCategoryTarget, setDeleteCategoryTarget] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Form inputs
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    imageUrl: '',
  });
  const [formErrors, setFormErrors] = useState({});
  const [imagePreviewError, setImagePreviewError] = useState(false);

  // Fetch categories from backend API
  const fetchCategories = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await axiosInstance.get('/catalog/categories');
      if (Array.isArray(data)) {
        setCategories(data.map(normalizeCategory));
      } else {
        setCategories([]);
      }
    } catch (err) {
      setError(err.message || 'Failed to load categories. Please check backend connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // Filter categories by name
  const filteredCategories = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return categories;
    return categories.filter((c) => c.name.toLowerCase().includes(q));
  }, [categories, searchQuery]);

  // Open add form
  const handleOpenAdd = () => {
    setEditingCategory(null);
    setFormData({ name: '', description: '', imageUrl: '' });
    setFormErrors({});
    setImagePreviewError(false);
    setShowAddForm(true);
  };

  // Open edit modal
  const handleOpenEdit = (category) => {
    setShowAddForm(false);
    setEditingCategory(category);
    setFormData({
      name: category.name || '',
      description: category.description || '',
      imageUrl: category.imageUrl || '',
    });
    setFormErrors({});
    setImagePreviewError(false);
  };

  // Cancel form
  const handleCancelForm = () => {
    setShowAddForm(false);
    setEditingCategory(null);
    setFormData({ name: '', description: '', imageUrl: '' });
    setFormErrors({});
    setImagePreviewError(false);
  };

  // Submit Add or Edit
  const handleSubmitForm = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    const validation = validateCategoryInput(formData);
    if (!validation.valid) {
      setFormErrors(validation.errors);
      return;
    }

    setSubmitting(true);
    setFormErrors({});

    const payload = {
      name: formData.name.trim(),
      description: formData.description.trim() || null,
      imageUrl: formData.imageUrl.trim() || null,
    };

    try {
      if (editingCategory) {
        // PUT update
        const updated = await axiosInstance.put(`/catalog/categories/${editingCategory.id}`, payload);
        const normalized = normalizeCategory(updated || { id: editingCategory.id, ...payload });
        setCategories((prev) =>
          prev.map((c) => (c.id === editingCategory.id ? normalized : c))
        );
        setSuccessMsg(`Category "${payload.name}" updated successfully!`);
        setEditingCategory(null);
      } else {
        // POST create
        const created = await axiosInstance.post('/catalog/categories', payload);
        const normalized = normalizeCategory(created || payload);
        setCategories((prev) => [...prev, normalized].sort((a, b) => a.name.localeCompare(b.name)));
        setSuccessMsg(`Category "${payload.name}" created successfully!`);
        setShowAddForm(false);
      }
      setFormData({ name: '', description: '', imageUrl: '' });
    } catch (err) {
      setError(err.message || 'Failed to save category.');
    } finally {
      setSubmitting(false);
    }
  };

  // Delete category
  const handleConfirmDelete = async () => {
    if (!deleteCategoryTarget) return;
    setSubmitting(true);
    setError('');
    setSuccessMsg('');

    try {
      await axiosInstance.delete(`/catalog/categories/${deleteCategoryTarget.id}`);
      setCategories((prev) => prev.filter((c) => c.id !== deleteCategoryTarget.id));
      setSuccessMsg(`Category "${deleteCategoryTarget.name}" deleted successfully.`);
      setDeleteCategoryTarget(null);
    } catch (err) {
      setError(err.message || `Failed to delete category "${deleteCategoryTarget.name}".`);
      setDeleteCategoryTarget(null);
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
          You do not have permission to manage categories. Only Operations Admins and Staff can access this page.
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
            <div
              style={{
                background: 'var(--color-soft-mint)',
                color: 'var(--color-primary)',
                width: 36,
                height: 36,
                borderRadius: 'var(--radius-sm)',
                display: 'grid',
                placeItems: 'center',
              }}
            >
              <Layers size={20} />
            </div>
            <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '2.2rem', color: 'var(--color-primary-dark)', margin: 0 }}>
              Supermarket Categories
            </h1>
          </div>
          <p style={{ color: 'var(--color-muted)', margin: 0 }}>
            Manage supermarket product taxonomies, descriptions, and category showcase images.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            className="btn btn-outline"
            onClick={fetchCategories}
            disabled={loading}
            title="Refresh categories"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            <RefreshCw size={16} className={loading ? 'spin' : ''} /> Refresh
          </button>
          {!showAddForm && !editingCategory && (
            <button
              className="btn btn-primary"
              onClick={handleOpenAdd}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              <Plus size={18} /> Add Category
            </button>
          )}
        </div>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div
          style={{
            background: '#ecfdf5',
            border: '1px solid #a7f3d0',
            color: '#065f46',
            padding: '12px 16px',
            borderRadius: 'var(--radius-sm)',
            marginBottom: 20,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.9rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <CheckCircle2 size={18} />
            <span>{successMsg}</span>
          </div>
          <button
            onClick={() => setSuccessMsg('')}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#065f46' }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {error && (
        <div
          style={{
            background: '#fee2e2',
            border: '1px solid #fecaca',
            color: '#991b1b',
            padding: '12px 16px',
            borderRadius: 'var(--radius-sm)',
            marginBottom: 20,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.9rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
          <button
            onClick={() => setError('')}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#991b1b' }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Add / Edit Form Panel */}
      {(showAddForm || editingCategory) && (
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
            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.35rem', color: 'var(--color-primary-dark)', margin: 0 }}>
              {editingCategory ? `Edit Category: ${editingCategory.name}` : 'Create New Supermarket Category'}
            </h3>
            <button
              onClick={handleCancelForm}
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-muted)' }}
            >
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmitForm} style={{ display: 'grid', gap: 20 }}>
            {/* Category Name */}
            <div>
              <label style={{ display: 'block', fontWeight: 600, fontSize: '0.875rem', marginBottom: 6 }}>
                Category Name <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <input
                type="text"
                required
                maxLength={100}
                placeholder="e.g. Fresh Produce, Dairy & Eggs, Bakery"
                value={formData.name}
                onChange={(e) => {
                  setFormData({ ...formData, name: e.target.value });
                  if (formErrors.name) setFormErrors({ ...formErrors, name: '' });
                }}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  border: `1px solid ${formErrors.name ? '#dc2626' : 'var(--color-border)'}`,
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.95rem',
                  outline: 'none',
                }}
              />
              {formErrors.name && (
                <div style={{ color: '#dc2626', fontSize: '0.8rem', marginTop: 4 }}>{formErrors.name}</div>
              )}
            </div>

            {/* Description */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <label style={{ fontWeight: 600, fontSize: '0.875rem' }}>Description</label>
                <span style={{ fontSize: '0.75rem', color: formData.description.length > 450 ? '#dc2626' : 'var(--color-muted)' }}>
                  {formData.description.length}/500
                </span>
              </div>
              <textarea
                rows={3}
                maxLength={500}
                placeholder="Brief description of the products included in this category (e.g. Farm-fresh organic fruits, root vegetables, and herbs delivered fresh daily)."
                value={formData.description}
                onChange={(e) => {
                  setFormData({ ...formData, description: e.target.value });
                  if (formErrors.description) setFormErrors({ ...formErrors, description: '' });
                }}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  border: `1px solid ${formErrors.description ? '#dc2626' : 'var(--color-border)'}`,
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.95rem',
                  fontFamily: 'inherit',
                  resize: 'vertical',
                  outline: 'none',
                }}
              />
              {formErrors.description && (
                <div style={{ color: '#dc2626', fontSize: '0.8rem', marginTop: 4 }}>{formErrors.description}</div>
              )}
            </div>

            {/* Image URL & Live Preview */}
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 140px', gap: 16, alignItems: 'start' }}>
              <div>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.875rem', marginBottom: 6 }}>
                  Category Image URL
                </label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/... or web image link"
                  value={formData.imageUrl}
                  onChange={(e) => {
                    setFormData({ ...formData, imageUrl: e.target.value });
                    setImagePreviewError(false);
                    if (formErrors.imageUrl) setFormErrors({ ...formErrors, imageUrl: '' });
                  }}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    border: `1px solid ${formErrors.imageUrl ? '#dc2626' : 'var(--color-border)'}`,
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.95rem',
                    outline: 'none',
                  }}
                />
                <div style={{ fontSize: '0.75rem', color: 'var(--color-muted)', marginTop: 4 }}>
                  Provide a direct public image URL. If left empty or if loading fails, a themed supermarket placeholder is displayed.
                </div>
                {formErrors.imageUrl && (
                  <div style={{ color: '#dc2626', fontSize: '0.8rem', marginTop: 4 }}>{formErrors.imageUrl}</div>
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
                    src={(!imagePreviewError && formData.imageUrl) ? formData.imageUrl : CATEGORY_PLACEHOLDER_IMAGE}
                    alt="Category Preview"
                    onError={() => setImagePreviewError(true)}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </div>
                {imagePreviewError && formData.imageUrl && (
                  <span style={{ fontSize: '0.7rem', color: '#b45309', display: 'block', marginTop: 2 }}>
                    Preview fallback (URL error)
                  </span>
                )}
              </div>
            </div>

            {/* Buttons */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 10 }}>
              <button
                type="button"
                className="btn btn-outline"
                onClick={handleCancelForm}
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={submitting}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                {submitting ? (
                  <>
                    <RefreshCw size={16} className="spin" /> Saving...
                  </>
                ) : editingCategory ? (
                  'Update Category'
                ) : (
                  'Save Category'
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Search & Statistics Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12,
          marginBottom: 24,
        }}
      >
        {/* Search input */}
        <div style={{ position: 'relative', minWidth: 260, flex: '1 1 300px' }}>
          <Search
            size={18}
            style={{ position: 'absolute', left: 12, top: 11, color: 'var(--color-muted)' }}
          />
          <input
            type="text"
            placeholder="Search categories by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '9px 12px 9px 38px',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-sm)',
              outline: 'none',
              background: '#ffffff',
            }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              style={{
                position: 'absolute',
                right: 10,
                top: 9,
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--color-muted)',
              }}
            >
              <X size={16} />
            </button>
          )}
        </div>

        <div style={{ color: 'var(--color-muted)', fontSize: '0.875rem' }}>
          Showing <strong>{filteredCategories.length}</strong> of <strong>{categories.length}</strong> categories
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--color-muted)' }}>
          <RefreshCw size={36} className="spin" style={{ color: 'var(--color-primary)', marginBottom: 12 }} />
          <p style={{ fontSize: '1rem', fontWeight: 600 }}>Loading category catalog...</p>
        </div>
      )}

      {/* Empty State (0 categories in database) */}
      {!loading && categories.length === 0 && (
        <div
          style={{
            background: '#ffffff',
            border: '2px dashed var(--color-border)',
            borderRadius: 'var(--radius-md)',
            padding: '50px 24px',
            textAlign: 'center',
            maxWidth: 500,
            margin: '0 auto',
          }}
        >
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              background: 'var(--color-soft-mint)',
              color: 'var(--color-primary)',
              display: 'grid',
              placeItems: 'center',
              margin: '0 auto 16px',
            }}
          >
            <FolderOpen size={32} />
          </div>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.6rem', color: 'var(--color-primary-dark)', marginBottom: 8 }}>
            No categories available.
          </h2>
          <p style={{ color: 'var(--color-muted)', fontSize: '0.95rem', marginBottom: 24, lineHeight: 1.5 }}>
            Get started by organizing your supermarket inventory into customer-friendly categories like Fresh Produce, Bakery, Dairy, or Pantry.
          </p>
          <button
            className="btn btn-primary"
            onClick={handleOpenAdd}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, margin: '0 auto' }}
          >
            <Plus size={18} /> Add Category
          </button>
        </div>
      )}

      {/* Search empty results */}
      {!loading && categories.length > 0 && filteredCategories.length === 0 && (
        <div
          style={{
            background: '#ffffff',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-md)',
            padding: '40px 24px',
            textAlign: 'center',
            color: 'var(--color-muted)',
          }}
        >
          <Search size={32} style={{ marginBottom: 10, opacity: 0.5 }} />
          <h3 style={{ fontSize: '1.2rem', marginBottom: 6, color: 'var(--color-ink-dark)' }}>
            No categories matching "{searchQuery}"
          </h3>
          <p style={{ fontSize: '0.9rem', marginBottom: 16 }}>Check for typos or clear your search filter.</p>
          <button className="btn btn-outline" onClick={() => setSearchQuery('')}>
            Clear Search
          </button>
        </div>
      )}

      {/* Category Grid */}
      {!loading && filteredCategories.length > 0 && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: 24,
          }}
        >
          {filteredCategories.map((cat) => (
            <div
              key={cat.id}
              style={{
                background: '#ffffff',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                overflow: 'hidden',
                boxShadow: 'var(--shadow-sm)',
                display: 'flex',
                flexDirection: 'column',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = 'var(--shadow-md)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
              }}
            >
              {/* Category Image Box */}
              <div
                style={{
                  height: 160,
                  width: '100%',
                  background: 'var(--color-soft-mint)',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                <img
                  src={cat.imageUrl || CATEGORY_PLACEHOLDER_IMAGE}
                  alt={cat.name}
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = CATEGORY_PLACEHOLDER_IMAGE;
                  }}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    display: 'block',
                  }}
                />
                <div
                  style={{
                    position: 'absolute',
                    bottom: 8,
                    right: 8,
                    background: 'rgba(255, 255, 255, 0.85)',
                    backdropFilter: 'blur(4px)',
                    padding: '2px 8px',
                    borderRadius: 4,
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    color: 'var(--color-primary-dark)',
                  }}
                >
                  Supermarket
                </div>
              </div>

              {/* Category Content */}
              <div style={{ padding: 18, flex: 1, display: 'flex', flexDirection: 'column' }}>
                <h3
                  style={{
                    fontFamily: 'var(--font-serif)',
                    fontSize: '1.25rem',
                    color: 'var(--color-primary-dark)',
                    margin: '0 0 8px 0',
                  }}
                >
                  {cat.name}
                </h3>

                <p
                  style={{
                    fontSize: '0.875rem',
                    color: cat.description ? 'var(--color-muted)' : '#94a3b8',
                    margin: '0 0 16px 0',
                    lineHeight: 1.45,
                    flex: 1,
                    fontStyle: cat.description ? 'normal' : 'italic',
                    display: '-webkit-box',
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                >
                  {cat.description || 'No description provided.'}
                </p>

                {/* Actions */}
                <div
                  style={{
                    borderTop: '1px solid var(--color-border)',
                    paddingTop: 12,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <button
                    className="btn btn-ghost"
                    onClick={() => handleOpenEdit(cat)}
                    style={{
                      padding: '6px 12px',
                      fontSize: '0.85rem',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    <Edit2 size={15} /> Edit
                  </button>

                  <button
                    className="btn btn-ghost"
                    onClick={() => setDeleteCategoryTarget(cat)}
                    style={{
                      padding: '6px 12px',
                      fontSize: '0.85rem',
                      color: '#dc2626',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    <Trash2 size={15} /> Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteCategoryTarget && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'grid',
            placeItems: 'center',
            zIndex: 1000,
            padding: 20,
          }}
          onClick={() => !submitting && setDeleteCategoryTarget(null)}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: 'var(--radius-md)',
              padding: 24,
              maxWidth: 440,
              width: '100%',
              boxShadow: 'var(--shadow-lg)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div
                style={{
                  background: '#fee2e2',
                  color: '#dc2626',
                  width: 42,
                  height: 42,
                  borderRadius: '50%',
                  display: 'grid',
                  placeItems: 'center',
                  flexShrink: 0,
                }}
              >
                <Trash2 size={20} />
              </div>
              <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.3rem', color: 'var(--color-primary-dark)', margin: 0 }}>
                Confirm Category Deletion
              </h3>
            </div>

            <p style={{ fontSize: '0.95rem', color: 'var(--color-ink-dark)', lineHeight: 1.5, marginBottom: 12 }}>
              Are you sure you want to delete the category{' '}
              <strong style={{ color: 'var(--color-primary-dark)' }}>"{deleteCategoryTarget.name}"</strong>?
            </p>

            <p style={{ fontSize: '0.85rem', color: '#b45309', background: '#fef3c7', padding: '10px 12px', borderRadius: 'var(--radius-sm)', marginBottom: 20 }}>
              ⚠️ If products in the catalog are currently assigned to this category, deletion will be rejected by the backend to prevent orphaned products.
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <button
                className="btn btn-outline"
                disabled={submitting}
                onClick={() => setDeleteCategoryTarget(null)}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                disabled={submitting}
                onClick={handleConfirmDelete}
                style={{ background: '#dc2626', borderColor: '#dc2626', color: '#ffffff' }}
              >
                {submitting ? 'Deleting...' : 'Delete Category'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
