import { Boxes, Edit2, Plus, RefreshCw, Save, TriangleAlert, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import DataTable from '../../components/DataTable';
import { Empty, PageHeader, SearchBox, Status } from '../../components/Ui';
import { useToast } from '../../components/ToastProvider';
import { inventoryService, getInventoryErrorMessage } from '../../services/inventoryService';
import { productService } from '../../services/productService';

// ── Constants ──────────────────────────────────────────────────────────────────
const PAGE_SIZE = 20;

// ── Helpers ────────────────────────────────────────────────────────────────────
function stockStatus(qty) {
  if (qty === 0) return 'Out of Stock';
  if (qty <= 10) return 'Low Stock';
  return 'In Stock';
}

function StockBadge({ quantity }) {
  return <Status>{stockStatus(quantity)}</Status>;
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function Inventory() {
  const { showToast } = useToast();
  const searchRef = useRef('');       // track latest search without stale closures
  const pageRef   = useRef(1);

  // ── List state ────────────────────────────────────────────────────────────────
  const [items,      setItems]      = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [loadError,  setLoadError]  = useState('');
  const [q,          setQ]          = useState('');
  const [page,       setPage]       = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));

  // ── Mode: 'none' | 'add' | 'edit' ────────────────────────────────────────────
  const [mode,        setMode]        = useState('none');
  const [saving,      setSaving]      = useState(false);
  const [formError,   setFormError]   = useState('');

  // ── Edit state ────────────────────────────────────────────────────────────────
  const [editingItem, setEditingItem] = useState(null);   // InventoryResponse row
  const [newStock,    setNewStock]    = useState('');

  // ── Add state ─────────────────────────────────────────────────────────────────
  const [products,        setProducts]        = useState([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [productsError,   setProductsError]   = useState('');
  const [selectedProduct, setSelectedProduct] = useState('');
  const [addStock,        setAddStock]        = useState('');

  // ── Fetch inventory ───────────────────────────────────────────────────────────
  async function fetchInventory(currentPage, searchTerm) {
    setLoading(true);
    setLoadError('');
    try {
      const res  = await inventoryService.getAll({
        page:     currentPage,
        pageSize: PAGE_SIZE,
        search:   searchTerm || undefined,
      });
      setItems(res.data.items ?? []);
      setTotalItems(res.data.totalItems ?? 0);
    } catch (err) {
      setLoadError(getInventoryErrorMessage(err, 'Could not load inventory.'));
      setItems([]);
      setTotalItems(0);
    } finally {
      setLoading(false);
    }
  }

  // Initial load + page changes
  useEffect(() => {
    pageRef.current = page;
    fetchInventory(page, searchRef.current);
  }, [page]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleSearch(value) {
    searchRef.current = value;
    setQ(value);
    pageRef.current = 1;
    setPage(1);
    fetchInventory(1, value);
  }

  function refresh() {
    fetchInventory(pageRef.current, searchRef.current);
  }

  // ── Load products (for Add form) ──────────────────────────────────────────────
  async function loadProducts() {
    setProductsLoading(true);
    setProductsError('');
    try {
      const res     = await productService.getAll({ pageSize: 200, isActive: true });
      const payload = res.data;
      const list    = Array.isArray(payload)
        ? payload
        : payload?.items ?? payload?.data ?? [];
      setProducts(list.filter((p) => p.isActive !== false));
    } catch (err) {
      const status = err.response?.status;
      if (status === 401) setProductsError('Please sign in to load products.');
      else if (status === 403) setProductsError('Access denied. You do not have permission to view products.');
      else setProductsError('Could not load the product list. Please try again.');
    } finally {
      setProductsLoading(false);
    }
  }

  // ── Open Add form ─────────────────────────────────────────────────────────────
  function openAdd() {
    setMode('add');
    setSelectedProduct('');
    setAddStock('');
    setFormError('');
    loadProducts();
  }

  // ── Open Edit form ────────────────────────────────────────────────────────────
  function openEdit(item) {
    setMode('edit');
    setEditingItem(item);
    setNewStock(String(item.stockQuantity));
    setFormError('');
  }

  // ── Close any form ────────────────────────────────────────────────────────────
  function closeForm() {
    setMode('none');
    setEditingItem(null);
    setNewStock('');
    setSelectedProduct('');
    setAddStock('');
    setFormError('');
  }

  // ── Validate stock quantity ───────────────────────────────────────────────────
  function validateQty(raw) {
    if (raw === '' || raw === null || raw === undefined) return 'Stock quantity is required.';
    const n = Number(raw);
    if (isNaN(n))  return 'Stock quantity must be a valid number.';
    if (n < 0)     return 'Stock quantity cannot be negative.';
    if (!Number.isInteger(n)) return 'Stock quantity must be a whole number.';
    return '';
  }

  // ── Submit: Add (set stock on an existing product) ────────────────────────────
  async function handleAdd(event) {
    event.preventDefault();

    if (!selectedProduct) {
      setFormError('Please select a product.');
      return;
    }
    const qtyError = validateQty(addStock);
    if (qtyError) { setFormError(qtyError); return; }

    setSaving(true);
    setFormError('');
    try {
      await inventoryService.updateStock(selectedProduct, Number(addStock));
      const product = products.find((p) => (p.id ?? p.productId) === selectedProduct);
      showToast(`Stock set to ${addStock} for "${product?.name ?? 'product'}".`);
      closeForm();
      refresh();
    } catch (err) {
      const msg = getInventoryErrorMessage(err, 'Could not set inventory.');
      setFormError(msg);
      showToast(msg, 'error');
    } finally {
      setSaving(false);
    }
  }

  // ── Submit: Update (change stock for an existing row) ─────────────────────────
  async function handleUpdate(event) {
    event.preventDefault();

    const qtyError = validateQty(newStock);
    if (qtyError) { setFormError(qtyError); return; }

    setSaving(true);
    setFormError('');
    try {
      await inventoryService.updateStock(editingItem.productId, Number(newStock));
      showToast(
        `Stock updated to ${newStock} ${editingItem.unit ?? 'units'} for "${editingItem.productName}".`,
      );
      closeForm();
      refresh();
    } catch (err) {
      const msg = getInventoryErrorMessage(err, 'Could not update stock.');
      setFormError(msg);
      showToast(msg, 'error');
    } finally {
      setSaving(false);
    }
  }

  // ── Derived stats ─────────────────────────────────────────────────────────────
  const outOfStockCount = items.filter((i) => i.stockQuantity === 0).length;
  const lowStockCount   = items.filter((i) => i.stockQuantity > 0 && i.stockQuantity <= 10).length;

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <>
      {/* ── Page header ── */}
      <PageHeader
        title="Inventory"
        description="Monitor and update stock levels across your product catalog."
        action={
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              className="btn btn-light btn-small"
              type="button"
              onClick={refresh}
              disabled={loading}
              aria-label="Refresh inventory"
            >
              <RefreshCw size={14} /> Refresh
            </button>
            <button
              className="btn btn-primary"
              type="button"
              onClick={mode === 'add' ? closeForm : openAdd}
              aria-label={mode === 'add' ? 'Cancel add inventory' : 'Add inventory'}
            >
              {mode === 'add' ? <><X size={16} /> Cancel</> : <><Plus size={16} /> Add inventory</>}
            </button>
          </div>
        }
      />

      {/* ── Summary stat chips ── */}
      {!loading && !loadError && (
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.1rem', flexWrap: 'wrap' }}>
          {/* Total */}
          <div className="panel" style={{ flex: '1 1 130px', padding: '0.85rem 1.1rem', minWidth: 0, marginBottom: 0 }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginBottom: '0.2rem', display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
              <Boxes size={12} /> Total products
            </div>
            <div style={{ fontSize: '1.45rem', fontWeight: 700, color: 'var(--ink)' }}>{totalItems}</div>
          </div>

          {/* Low stock */}
          {lowStockCount > 0 && (
            <div className="panel" style={{ flex: '1 1 130px', padding: '0.85rem 1.1rem', minWidth: 0, marginBottom: 0, borderLeft: '3px solid #f59e0b' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginBottom: '0.2rem', display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
                <TriangleAlert size={12} /> Low stock
              </div>
              <div style={{ fontSize: '1.45rem', fontWeight: 700, color: '#d97706' }}>{lowStockCount}</div>
            </div>
          )}

          {/* Out of stock */}
          {outOfStockCount > 0 && (
            <div className="panel" style={{ flex: '1 1 130px', padding: '0.85rem 1.1rem', minWidth: 0, marginBottom: 0, borderLeft: '3px solid #ef4444' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginBottom: '0.2rem', display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
                <TriangleAlert size={12} /> Out of stock
              </div>
              <div style={{ fontSize: '1.45rem', fontWeight: 700, color: '#dc2626' }}>{outOfStockCount}</div>
            </div>
          )}
        </div>
      )}

      {/* ── Add inventory form ── */}
      {mode === 'add' && (
        <form className="panel" onSubmit={handleAdd} aria-label="Add inventory form" style={{ marginBottom: '1.1rem' }}>
          <div className="panel-head">
            <div>
              <h2>Add / Set Inventory</h2>
              <p>Select a product and set its stock quantity.</p>
            </div>
            <button className="btn btn-light btn-small" type="button" onClick={closeForm} aria-label="Close add form">
              <X size={14} /> Close
            </button>
          </div>

          {formError && <div className="error" role="alert">{formError}</div>}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem' }}>
            {/* Product selector */}
            <label>
              Product <span>(required)</span>
              <select
                value={selectedProduct}
                onChange={(e) => setSelectedProduct(e.target.value)}
                required
                aria-label="Select product"
                aria-required="true"
                disabled={productsLoading}
              >
                <option value="">
                  {productsLoading ? 'Loading products…' : '— Select a product —'}
                </option>
                {products.map((p) => {
                  const id = p.id ?? p.productId;
                  return (
                    <option key={id} value={id}>
                      {p.name}
                    </option>
                  );
                })}
              </select>
              {productsError && (
                <span style={{ fontSize: '0.75rem', color: '#b43d2d', display: 'block', marginTop: '0.25rem' }}>
                  {productsError}
                </span>
              )}
            </label>

            {/* Stock quantity */}
            <label>
              Stock quantity <span>(required)</span>
              <input
                type="number"
                min="0"
                step="1"
                value={addStock}
                onChange={(e) => setAddStock(e.target.value)}
                placeholder="e.g. 50"
                required
                aria-label="Stock quantity"
                aria-required="true"
              />
            </label>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
            <button type="button" className="btn btn-light" onClick={closeForm} disabled={saving}>
              <X size={14} /> Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={saving || productsLoading}
              aria-disabled={saving || productsLoading}
            >
              <Save size={14} /> {saving ? 'Saving…' : 'Set stock'}
            </button>
          </div>
        </form>
      )}

      {/* ── Edit / Update stock inline form ── */}
      {mode === 'edit' && editingItem && (
        <form className="panel" onSubmit={handleUpdate} aria-label="Update stock form" style={{ marginBottom: '1.1rem' }}>
          <div className="panel-head">
            <div>
              <h2>Update Stock</h2>
              <p>
                Editing: <strong>{editingItem.productName}</strong>
                &nbsp;&mdash;&nbsp;current stock:&nbsp;
                <strong>{editingItem.stockQuantity} {editingItem.unit ?? 'units'}</strong>
              </p>
            </div>
            <button className="btn btn-light btn-small" type="button" onClick={closeForm} aria-label="Cancel update">
              <X size={14} /> Cancel
            </button>
          </div>

          {formError && <div className="error" role="alert">{formError}</div>}

          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.75rem', flexWrap: 'wrap' }}>
            <label style={{ flex: '0 1 200px' }}>
              New stock quantity
              <input
                type="number"
                min="0"
                step="1"
                value={newStock}
                onChange={(e) => setNewStock(e.target.value)}
                placeholder="New quantity"
                required
                autoFocus
                aria-label="New stock quantity"
                aria-required="true"
              />
            </label>
            <div style={{ display: 'flex', gap: '0.5rem', paddingBottom: '18px' }}>
              <button type="button" className="btn btn-light" onClick={closeForm} disabled={saving}>
                <X size={14} /> Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                <Save size={14} /> {saving ? 'Saving…' : 'Update stock'}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* ── Load error (full page error) ── */}
      {loadError && !loading && (
        <div className="error" role="alert" style={{ marginBottom: '1rem' }}>
          {loadError}
          <button
            type="button"
            className="btn btn-light btn-small"
            onClick={refresh}
            style={{ marginLeft: '0.75rem' }}
          >
            Retry
          </button>
        </div>
      )}

      {/* ── Inventory table ── */}
      <section className="panel">
        <div className="table-tools">
          <SearchBox
            value={q}
            onChange={handleSearch}
            placeholder="Search by product name…"
          />
        </div>

        {/* Loading state */}
        {loading && (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--muted)' }}>
            Loading inventory…
          </div>
        )}

        {/* Empty state */}
        {!loading && !loadError && items.length === 0 && (
          <Empty
            title={q ? 'No products match your search' : 'No inventory records yet'}
            text={q ? 'Try a different search term.' : 'Products will appear here once they are added to the catalog.'}
          />
        )}

        {/* Data */}
        {!loading && items.length > 0 && (
          <>
            <DataTable
              rows={items}
              columns={[
                {
                  key: 'productName',
                  label: 'PRODUCT',
                  render: (row) => (
                    <div>
                      <b>{row.productName}</b>
                      <small style={{ display: 'block', color: 'var(--muted)' }}>
                        #{String(row.productId).substring(0, 8)}
                      </small>
                    </div>
                  ),
                },
                {
                  key: 'stockQuantity',
                  label: 'STOCK',
                  render: (row) => (
                    <b style={{ fontSize: '1.05rem' }}>
                      {row.stockQuantity}{' '}
                      <small style={{ fontWeight: 400 }}>{row.unit ?? 'units'}</small>
                    </b>
                  ),
                },
                {
                  key: 'unit',
                  label: 'UNIT',
                  render: (row) => row.unit ?? '—',
                },
                {
                  key: 'status',
                  label: 'STATUS',
                  render: (row) => <StockBadge quantity={row.stockQuantity} />,
                },
                {
                  key: 'updatedAtUtc',
                  label: 'LAST UPDATED',
                  render: (row) =>
                    row.updatedAtUtc
                      ? new Date(row.updatedAtUtc).toLocaleString()
                      : '—',
                },
                {
                  key: 'actions',
                  label: 'ACTIONS',
                  render: (row) => (
                    <button
                      className="btn btn-light btn-small"
                      type="button"
                      onClick={() => openEdit(row)}
                      aria-label={`Update stock for ${row.productName}`}
                      title="Update stock quantity"
                    >
                      <Edit2 size={14} /> Update stock
                    </button>
                  ),
                },
              ]}
            />

            {/* ── Pagination ── */}
            {totalPages > 1 && (
              <div
                style={{
                  display: 'flex',
                  gap: '0.5rem',
                  justifyContent: 'flex-end',
                  alignItems: 'center',
                  padding: '0.75rem 0 0.25rem',
                }}
              >
                <span style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>
                  Page {page} of {totalPages} &mdash; {totalItems} products
                </span>
                <button
                  className="btn btn-light btn-small"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                  aria-label="Previous page"
                >
                  ← Prev
                </button>
                <button
                  className="btn btn-light btn-small"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  aria-label="Next page"
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </section>
    </>
  );
}
