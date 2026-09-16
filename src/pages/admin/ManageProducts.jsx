import {Edit2, Plus, RefreshCw, Save, Trash2, X} from 'lucide-react';
import {useEffect, useMemo, useState} from 'react';
import DataTable from '../../components/DataTable';
import {PageHeader, SearchBox, Status} from '../../components/Ui';
import {useToast} from '../../components/ToastProvider';
import useApiCollection from '../../hooks/useApiCollection';
import {categoryService, getCategoryErrorMessage, getCategoryLabel, unwrapCategories} from '../../services/categoryService';
import {productService, getProductErrorMessage} from '../../services/productService';

const productForm = {
  name: '',
  description: '',
  categoryId: '',
  price: '',
  stockQuantity: '',
  unit: 'item',
  imageUrl: '',
  isActive: true,
};

function mapProduct(product) {
  return {
    ...product,
    id: product.id || product.productId,
    name: product.name || '',
    description: product.description || '',
    image: product.image || product.imageUrl || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=180&q=80',
    stock: product.stock ?? product.stockQuantity ?? 0,
    stockQuantity: product.stockQuantity ?? product.stock ?? 0,
    unit: product.unit || 'item',
    isActive: product.isActive ?? true,
    createdAtUtc: product.createdAtUtc,
    updatedAtUtc: product.updatedAtUtc,
  };
}

export default function ManageProducts() {
  const {showToast} = useToast();
  const {data: apiProducts, loading: apiLoading, error: apiError} = useApiCollection('/api/products?pageSize=100');
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [categoryError, setCategoryError] = useState('');
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('all');
  const [show, setShow] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [form, setForm] = useState(productForm);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [actionId, setActionId] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  useEffect(() => {
    if (!imageFile) {
      setImagePreview(null);
      return;
    }
    const objectUrl = URL.createObjectURL(imageFile);
    setImagePreview(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [imageFile]);

  useEffect(() => {
    if (Array.isArray(apiProducts)) {
      setProducts(apiProducts.map(mapProduct));
    }
  }, [apiProducts]);

  const loadCategories = async () => {
    setCategoryError('');
    try {
      const response = await categoryService.getCategories({isActive: true});
      setCategories(unwrapCategories(response.data));
    } catch (err) {
      setCategoryError(getCategoryErrorMessage(err, 'Categories could not load.'));
    }
  };

  const reloadProducts = async () => {
    try {
      const response = await productService.getAll({pageSize: 100});
      const payload = response.data;
      const items = Array.isArray(payload) ? payload : payload?.items || payload?.data || [];
      setProducts(items.map(mapProduct));
    } catch (err) {
      showToast(err.response?.data?.message || 'Products could not be refreshed.', 'error');
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const openCreateForm = () => {
    setEditingProduct(null);
    setForm(productForm);
    setFormError('');
    setImageFile(null);
    setShow(true);
  };

  const openEditForm = (product) => {
    setEditingProduct(product);
    setForm({
      name: product.name || '',
      description: product.description || '',
      categoryId: product.categoryId || '',
      price: product.price !== undefined ? String(product.price) : '',
      stockQuantity: product.stockQuantity !== undefined ? String(product.stockQuantity) : String(product.stock || 0),
      unit: product.unit || 'item',
      imageUrl: product.imageUrl || (product.image && !product.image.includes('unsplash') ? product.image : '') || '',
      isActive: product.isActive !== undefined ? product.isActive : true,
    });
    setFormError('');
    setImageFile(null);
    setShow(true);
  };

  const closeForm = () => {
    setShow(false);
    setEditingProduct(null);
    setForm(productForm);
    setFormError('');
    setImageFile(null);
  };

  const rows = useMemo(() => {
    return products.filter((product) => {
      const term = q.toLowerCase();
      const matchesSearch = product.name.toLowerCase().includes(term) ||
        (product.description && product.description.toLowerCase().includes(term));
      const productCategoryId = product.categoryId || product.category;
      const matchesCategory = cat === 'all' || productCategoryId === cat || product.category === cat;
      return matchesSearch && matchesCategory;
    });
  }, [products, q, cat]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.name.trim()) return;

    const priceNum = Number(form.price);
    const stockNum = Number(form.stockQuantity);

    setSaving(true);
    setFormError('');

    try {
      const formData = new FormData();
      formData.append('Name', form.name.trim());
      if (form.description?.trim()) formData.append('Description', form.description.trim());
      if (form.categoryId) formData.append('CategoryId', form.categoryId);
      formData.append('Price', priceNum.toString());
      formData.append('StockQuantity', stockNum.toString());
      formData.append('Unit', form.unit?.trim() || 'item');
      formData.append('IsActive', form.isActive.toString());
      if (form.imageUrl?.trim()) formData.append('ImageUrl', form.imageUrl.trim());
      
      if (imageFile) {
        formData.append('Image', imageFile);
      }

      if (editingProduct) {
        await productService.update(editingProduct.id, formData);
        showToast('Product updated successfully.');
      } else {
        await productService.create(formData);
        showToast('Product saved successfully.');
      }

      closeForm();
      await reloadProducts();
    } catch (err) {
      const msg = getProductErrorMessage(err, 'Product could not be saved.');
      setFormError(msg);
      showToast(msg, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (product) => {
    const confirmed = window.confirm(`Are you sure you want to delete ${product.name}?`);
    if (!confirmed) return;

    setActionId(product.id);
    try {
      await productService.delete(product.id);
      showToast('Product deleted successfully.');
      await reloadProducts();
    } catch (err) {
      showToast(getProductErrorMessage(err, 'Product could not be deleted.'), 'error');
    } finally {
      setActionId(null);
    }
  };

  return (
    <>
      <PageHeader
        title="Products"
        description="Manage your catalog, pricing, and availability."
        action={
          <button className="btn btn-primary" onClick={() => (show ? closeForm() : openCreateForm())}>
            <Plus /> Add product
          </button>
        }
      />

      {show && (
        <form className="panel quick-form" onSubmit={handleSubmit} aria-label="Product form">
          {formError && <div className="error" role="alert">{formError}</div>}
          <div style={{display: 'flex', flexDirection: 'column', gap: '0.75rem', width: '100%'}}>
            <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem'}}>
              <input
                value={form.name}
                onChange={(event) => setForm({...form, name: event.target.value})}
                placeholder="Product name *"
                required
                maxLength={200}
                aria-label="Product name"
              />
              <select
                value={form.categoryId}
                onChange={(event) => setForm({...form, categoryId: event.target.value})}
                aria-label="Product category"
              >
                <option value="">No category</option>
                {categories.map((category) => (
                  <option key={category.id || category.categoryId} value={category.id || category.categoryId}>
                    {getCategoryLabel(category)}
                  </option>
                ))}
              </select>
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={form.price}
                onChange={(event) => setForm({...form, price: event.target.value})}
                placeholder="Price *"
                required
                aria-label="Product price"
              />
              <input
                type="number"
                min="0"
                value={form.stockQuantity}
                onChange={(event) => setForm({...form, stockQuantity: event.target.value})}
                placeholder="Stock quantity *"
                required
                aria-label="Stock quantity"
              />
              <input
                value={form.unit}
                onChange={(event) => setForm({...form, unit: event.target.value})}
                placeholder="Unit (e.g. item, kg, pack)"
                maxLength={50}
                aria-label="Product unit"
              />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', justifyContent: 'center' }}>
                <input
                  type="file"
                  accept="image/jpeg, image/png, image/webp, image/gif"
                  onChange={(event) => {
                    if (event.target.files?.length) {
                      setImageFile(event.target.files[0]);
                    } else {
                      setImageFile(null);
                    }
                  }}
                  aria-label="Product image"
                />
                {(imageFile || form.imageUrl) && (
                  <small style={{ color: 'var(--text-muted, #64748b)', fontSize: '0.75rem' }}>
                    {imageFile ? `Selected: ${imageFile.name}` : 'Existing image will be kept'}
                  </small>
                )}
                {(imagePreview || form.imageUrl) && (
                  <div style={{ marginTop: '0.5rem', width: '100px', height: '100px', border: '1px solid #e2e8f0', borderRadius: '4px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc' }}>
                    <img
                      src={imagePreview || form.imageUrl}
                      alt="Preview"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=180&q=80'; }}
                    />
                  </div>
                )}
              </div>
            </div>
            <label style={{display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem'}}>
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(event) => setForm({...form, isActive: event.target.checked})}
              />
              Product is active and available for sale
            </label>
            <textarea
              value={form.description}
              onChange={(event) => setForm({...form, description: event.target.value})}
              placeholder="Product description (optional)"
              rows={2}
              aria-label="Product description"
              style={{
                width: '100%',
                padding: '0.65rem 0.85rem',
                borderRadius: '8px',
                border: '1px solid var(--border-color, #e2e8f0)',
                fontFamily: 'inherit',
                fontSize: '0.9rem',
                resize: 'vertical',
              }}
            />
            {editingProduct && (editingProduct.createdAtUtc || editingProduct.updatedAtUtc) && (
              <div style={{fontSize: '0.8rem', color: 'var(--text-muted, #64748b)'}}>
                {editingProduct.createdAtUtc && <div>Created: {new Date(editingProduct.createdAtUtc).toLocaleString()}</div>}
                {editingProduct.updatedAtUtc && <div>Last Updated: {new Date(editingProduct.updatedAtUtc).toLocaleString()}</div>}
              </div>
            )}
            <div style={{display: 'flex', gap: '0.5rem', justifyContent: 'flex-end'}}>
              <button type="button" className="btn btn-light" onClick={closeForm}>
                <X size={16} /> Cancel
              </button>
              <button className="btn btn-primary" disabled={saving}>
                <Save size={16} /> {saving ? 'Saving...' : editingProduct ? 'Update product' : 'Save product'}
              </button>
            </div>
          </div>
        </form>
      )}

      {categoryError && <div className="error" role="alert">{categoryError}</div>}
      {apiError && <div className="error" role="alert">Failed to load products. Please check connection.</div>}

      <section className="panel">
        <div className="table-tools" style={{display: 'flex', gap: '1rem', alignItems: 'center'}}>
          <SearchBox value={q} onChange={setQ} placeholder="Search products by name or description..." />
          <select value={cat} onChange={(event) => setCat(event.target.value)} aria-label="Filter by category">
            <option value="all">All categories</option>
            {categories.map((category) => (
              <option value={category.id || category.categoryId} key={category.id || category.categoryId}>
                {getCategoryLabel(category)}
              </option>
            ))}
          </select>
          <button className="btn btn-light btn-small" type="button" onClick={reloadProducts} disabled={apiLoading}>
            <RefreshCw size={14} /> Refresh
          </button>
        </div>

        {apiLoading && !products.length ? (
          <div style={{padding: '3rem', textAlign: 'center', color: 'var(--text-muted, #64748b)'}}>Loading products...</div>
        ) : (
          <DataTable
            rows={rows}
          columns={[
            {
              key: 'name',
              label: 'PRODUCT',
              render: (row) => (
                <div className="table-product">
                  <img src={row.image} alt="" />
                  <div>
                    <b>{row.name}</b>
                    {row.description && (
                      <small style={{display: 'block', color: 'var(--text-muted, #64748b)', maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>
                        {row.description}
                      </small>
                    )}
                    <small>#{String(row.id).substring(0, 8)}</small>
                  </div>
                </div>
              ),
            },
            {key: 'category', label: 'CATEGORY', render: (row) => row.category || 'Uncategorized'},
            {key: 'price', label: 'PRICE', render: (row) => `Rs. ${Number(row.price || 0).toFixed(2)}`},
            {key: 'stock', label: 'STOCK', render: (row) => <span>{row.stock} {row.unit || 'units'}</span>},
            {
              key: 'available',
              label: 'STATUS',
              render: (row) => <Status>{row.stock > 10 ? 'In Stock' : row.stock > 0 ? 'Low Stock' : 'Out of Stock'}</Status>,
            },
            {
              key: 'actions',
              label: 'ACTIONS',
              render: (row) => (
                <div style={{display: 'flex', gap: '0.5rem'}}>
                  <button
                    className="btn btn-light btn-small"
                    type="button"
                    onClick={() => openEditForm(row)}
                    title="Edit Product"
                  >
                    <Edit2 size={14} /> Edit
                  </button>
                  <button
                    className="btn btn-light btn-small danger"
                    type="button"
                    disabled={actionId === row.id}
                    onClick={() => handleDelete(row)}
                    title="Delete Product"
                  >
                    <Trash2 size={14} /> Delete
                  </button>
                </div>
              ),
            },
          ]}
        />
        )}
      </section>
    </>
  );
}
