import {
  ArrowDownCircle,
  ArrowUpCircle,
  Boxes,
  Edit2,
  Filter,
  Plus,
  RefreshCw,
  Save,
  SlidersHorizontal,
  TriangleAlert,
  X,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import DataTable from '../../components/DataTable';
import { Empty, PageHeader, SearchBox, Status } from '../../components/Ui';
import { useToast } from '../../components/ToastProvider';
import { inventoryService, getInventoryErrorMessage } from '../../services/inventoryService';
import { productService } from '../../services/productService';

// ── Constants ──────────────────────────────────────────────────────────────────
const PAGE_SIZE = 20;

// ── Helpers ────────────────────────────────────────────────────────────────────
function stockStatus(item) {
  const qty = typeof item === 'number' ? item : item.stockQuantity;
  const isLow = typeof item === 'object' ? item.isLowStock : qty <= 10;
  if (qty === 0) return 'Out of Stock';
  if (isLow) return 'Low Stock';
  return 'In Stock';
}

function StockBadge({ item }) {
  return <Status>{stockStatus(item)}</Status>;
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function Inventory() {
  const { showToast } = useToast();
  const searchRef = useRef('');
  const pageRef   = useRef(1);
  const lowStockRef = useRef(false);

  // ── List state ────────────────────────────────────────────────────────────────
  const [items,         setItems]         = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [loadError,     setLoadError]     = useState('');
  const [q,             setQ]             = useState('');
  const [page,          setPage]          = useState(1);
  const [totalItems,    setTotalItems]    = useState(0);
  const [onlyLowStock,  setOnlyLowStock]  = useState(false);
  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));

  // ── Mode: 'none' | 'add' | 'edit' | 'adjust' ─────────────────────────────────
  const [mode,        setMode]        = useState('none');
  const [saving,      setSaving]      = useState(false);
  const [formError,   setFormError]   = useState('');

  // ── Edit state ────────────────────────────────────────────────────────────────
  const [editingItem,  setEditingItem]  = useState(null);
  const [newStock,     setNewStock]     = useState('');
  const [newThreshold, setNewThreshold] = useState('');

  // ── Adjust state (Increase / Decrease) ────────────────────────────────────────
  const [adjustItem,   setAdjustItem]   = useState(null);
  const [adjustQty,    setAdjustQty]    = useState('');

  // ── Add state ─────────────────────────────────────────────────────────────────
  const [products,        setProducts]        = useState([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [productsError,   setProductsError]   = useState('');
  const [selectedProduct, setSelectedProduct] = useState('');
  const [addStock,        setAddStock]        = useState('');

  // ── Fetch inventory ───────────────────────────────────────────────────────────
  async function fetchInventory(currentPage, searchTerm, lowStockOnly) {
    setLoading(true);
    setLoadError('');
    try {
      const res = await inventoryService.getAll({
        page:     currentPage,
        pageSize: PAGE_SIZE,
        search:   searchTerm || undefined,
        lowStock: lowStockOnly ? true : undefined,
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
    fetchInventory(page, searchRef.current, lowStockRef.current);
  }, [page]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleSearch(value) {
    searchRef.current = value;
    setQ(value);
    pageRef.current = 1;
    setPage(1);
    fetchInventory(1, value, lowStockRef.current);
  }

  function handleToggleLowStock() {
    const next = !onlyLowStock;
    setOnlyLowStock(next);
    lowStockRef.current = next;
    pageRef.current = 1;
    setPage(1);
    fetchInventory(1, searchRef.current, next);
  }

  function refresh() {
    fetchInventory(pageRef.current, searchRef.current, lowStockRef.current);
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

  // ── Form Openers ─────────────────────────────────────────────────────────────
  function openAdd() {
    setMode('add');
    setSelectedProduct('');
    setAddStock('');
    setFormError('');
    loadProducts();
  }

  function openEdit(item) {
    setMode('edit');
    setEditingItem(item);
    setNewStock(String(item.stockQuantity));
    setNewThreshold(String(item.lowStockThreshold ?? 10));
    setFormError('');
  }

  function openAdjust(item) {
    setMode('adjust');
    setAdjustItem(item);
    setAdjustQty('');
    setFormError('');
  }

  function closeForm() {
    setMode('none');
    setEditingItem(null);
    setAdjustItem(null);
    setNewStock('');
    setNewThreshold('');
    setAdjustQty('');
    setSelectedProduct('');
    setAddStock('');
    setFormError('');
  }

  // ── Validation ───────────────────────────────────────────────────────────────
  function validateQty(raw) {
    if (raw === '' || raw === null || raw === undefined) return 'Quantity is required.';
    const n = Number(raw);
    if (isNaN(n))  return 'Quantity must be a valid number.';
    if (n < 0)     return 'Quantity cannot be negative.';
    if (!Number.isInteger(n)) return 'Quantity must be a whole number.';
    return '';
  }

  // ── Submit: Add (set stock on a product) ──────────────────────────────────────
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

  // ── Submit: Direct Update (edit stock quantity and threshold) ────────────────
  async function handleUpdate(event) {
    event.preventDefault();

    const qtyError = validateQty(newStock);
    if (qtyError) { setFormError(qtyError); return; }

    const thresholdNum = newThreshold !== '' ? Number(newThreshold) : undefined;
    if (thresholdNum !== undefined && (isNaN(thresholdNum) || thresholdNum < 0)) {
      setFormError('Low stock threshold cannot be negative.');
      return;
    }

    setSaving(true);
    setFormError('');
    try {
      await inventoryService.updateStock(editingItem.productId, Number(newStock), thresholdNum);
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

  // ── Submit: Atomic Adjust (increase or decrease) ─────────────────────────────
  async function handleAdjust(type) {
    const qtyError = validateQty(adjustQty);
    if (qtyError) { setFormError(qtyError); return; }

    const amount = Number(adjustQty);
    if (amount <= 0) {
      setFormError('Adjustment quantity must be greater than 0.');
      return;
    }

    // Client-side negative stock check
    if (type === 'decrease' && amount > adjustItem.stockQuantity) {
      setFormError('Insufficient stock available.');
      showToast('Insufficient stock available.', 'error');
      return;
    }

    setSaving(true);
    setFormError('');
    try {
      const res = await inventoryService.adjustStock(adjustItem.productId, {
        type,
        quantity: amount,
      });
      const newQty = res.data.stockQuantity;
      const actionText = type === 'increase' ? 'increased' : 'decreased';
      showToast(`Stock ${actionText} by ${amount}. New stock: ${newQty} for "${adjustItem.productName}".`);
      closeForm();
      refresh();
    } catch (err) {
      const msg = getInventoryErrorMessage(err, 'Could not adjust stock.');
      setFormError(msg);
      showToast(msg, 'error');
    } finally {
      setSaving(false);
    }
  }

  // ── Derived stats ─────────────────────────────────────────────────────────────
  const outOfStockCount = items.filter((i) => i.stockQuantity === 0).length;
  const lowStockCount   = items.filter((i) => i.isLowStock || (i.stockQuantity > 0 && i.stockQuantity <= (i.lowStockThreshold ?? 10))).length;

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <>
      {/* ── Page header ── */}
      <PageHeader
        title="Inventory"
        description="Monitor and manage stock levels, low-stock thresholds, and adjustments."
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
          <div
            className="panel"
            style={{ flex: '1 1 130px', padding: '0.85rem 1.1rem', minWidth: 0, marginBottom: 0, cursor: 'pointer' }}
            onClick={() => { if (onlyLowStock) handleToggleLowStock(); }}
            title="View all products"
          >
            <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginBottom: '0.2rem', display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
              <Boxes size={12} /> Total products
            </div>
            <div style={{ fontSize: '1.45rem', fontWeight: 700, color: 'var(--ink)' }}>{totalItems}</div>
          </div>

          {/* Low stock */}
          <div
            className="panel"
            style={{
              flex: '1 1 130px',
              padding: '0.85rem 1.1rem',
              minWidth: 0,
              marginBottom: 0,
              borderLeft: '3px solid #f59e0b',
              backgroundColor: onlyLowStock ? 'rgba(245, 158, 11, 0.08)' : undefined,
              cursor: 'pointer',
            }}
            onClick={handleToggleLowStock}
            title={onlyLowStock ? 'Show all products' : 'Filter to show low-stock products only'}
          >
            <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginBottom: '0.2rem', display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
              <TriangleAlert size={12} /> Low stock {onlyLowStock && '(Active Filter)'}
            </div>
            <div style={{ fontSize: '1.45rem', fontWeight: 700, color: '#d97706' }}>{lowStockCount}</div>
          </div>

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

      {/* ── Adjust Stock Panel (Atomic Increase / Decrease) ── */}
      {mode === 'adjust' && adjustItem && (
        <div className="panel" aria-label="Stock adjustment form" style={{ marginBottom: '1.1rem' }}>
          <div className="panel-head">
            <div>
              <h2>Adjust Stock Level</h2>
              <p>
                Product: <strong>{adjustItem.productName}</strong>
                &nbsp;&mdash;&nbsp;Current Stock:&nbsp;
                <strong style={{ color: adjustItem.stockQuantity === 0 ? '#dc2626' : adjustItem.isLowStock ? '#d97706' : 'var(--ink)' }}>
                  {adjustItem.stockQuantity} {adjustItem.unit ?? 'units'}
                </strong>
                &nbsp;&mdash;&nbsp;Threshold:&nbsp;
                <strong>{adjustItem.lowStockThreshold ?? 10}</strong>
              </p>
            </div>
            <button className="btn btn-light btn-small" type="button" onClick={closeForm} aria-label="Close adjust form">
              <X size={14} /> Close
            </button>
          </div>

          {formError && <div className="error" role="alert" style={{ marginBottom: '1rem' }}>{formError}</div>}

          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '1rem', flexWrap: 'wrap' }}>
            <label style={{ flex: '0 1 220px' }}>
              Adjustment amount
              <input
                type="number"
                min="1"
                step="1"
                value={adjustQty}
                onChange={(e) => {
                  setAdjustQty(e.target.value);
                  setFormError('');
                }}
                placeholder="e.g. 10"
                autoFocus
                required
                aria-label="Adjustment quantity"
              />
            </label>

            <div style={{ display: 'flex', gap: '0.5rem', paddingBottom: '18px' }}>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => handleAdjust('increase')}
                disabled={saving || !adjustQty}
                title="Increase current stock"
              >
                <ArrowUpCircle size={15} /> Increase Stock
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => handleAdjust('decrease')}
                disabled={saving || !adjustQty}
                title="Decrease current stock"
                style={{ backgroundColor: '#dc2626', color: '#fff' }}
              >
                <ArrowDownCircle size={15} /> Decrease Stock
              </button>
              <button type="button" className="btn btn-light" onClick={closeForm} disabled={saving}>
                <X size={14} /> Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Direct Edit / Update stock inline form ── */}
      {mode === 'edit' && editingItem && (
        <form className="panel" onSubmit={handleUpdate} aria-label="Update stock form" style={{ marginBottom: '1.1rem' }}>
          <div className="panel-head">
            <div>
              <h2>Update Stock &amp; Threshold</h2>
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
            <label style={{ flex: '0 1 180px' }}>
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

            <label style={{ flex: '0 1 180px' }}>
              Low stock threshold
              <input
                type="number"
                min="0"
                step="1"
                value={newThreshold}
                onChange={(e) => setNewThreshold(e.target.value)}
                placeholder="Threshold (e.g. 10)"
                aria-label="Low stock threshold"
              />
            </label>

            <div style={{ display: 'flex', gap: '0.5rem', paddingBottom: '18px' }}>
              <button type="button" className="btn btn-light" onClick={closeForm} disabled={saving}>
                <X size={14} /> Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                <Save size={14} /> {saving ? 'Saving…' : 'Save changes'}
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
        <div className="table-tools" style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: '1 1 260px' }}>
            <SearchBox
              value={q}
              onChange={handleSearch}
              placeholder="Search by product name…"
            />
          </div>
          <button
            type="button"
            className={`btn btn-small ${onlyLowStock ? 'btn-primary' : 'btn-light'}`}
            onClick={handleToggleLowStock}
            aria-pressed={onlyLowStock}
          >
            <Filter size={13} /> {onlyLowStock ? 'Showing Low Stock Only' : 'Filter: Low Stock'}
          </button>
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
            title={onlyLowStock ? 'No low-stock products found' : q ? 'No products match your search' : 'No inventory records yet'}
            text={onlyLowStock ? 'All product stocks are at or above their thresholds.' : q ? 'Try a different search term.' : 'Products will appear here once they are added to the catalog.'}
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
                    <b style={{ fontSize: '1.05rem', color: row.stockQuantity === 0 ? '#dc2626' : row.isLowStock ? '#d97706' : 'var(--ink)' }}>
                      {row.stockQuantity}{' '}
                      <small style={{ fontWeight: 400 }}>{row.unit ?? 'units'}</small>
                    </b>
                  ),
                },
                {
                  key: 'lowStockThreshold',
                  label: 'THRESHOLD',
                  render: (row) => row.lowStockThreshold ?? 10,
                },
                {
                  key: 'unit',
                  label: 'UNIT',
                  render: (row) => row.unit ?? '—',
                },
                {
                  key: 'status',
                  label: 'STATUS',
                  render: (row) => <StockBadge item={row} />,
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
                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      <button
                        className="btn btn-primary btn-small"
                        type="button"
                        onClick={() => openAdjust(row)}
                        aria-label={`Adjust stock for ${row.productName}`}
                        title="Quick increase / decrease stock"
                      >
                        <SlidersHorizontal size={13} /> Adjust stock
                      </button>
                      <button
                        className="btn btn-light btn-small"
                        type="button"
                        onClick={() => openEdit(row)}
                        aria-label={`Update stock for ${row.productName}`}
                        title="Update stock quantity and threshold"
                      >
                        <Edit2 size={13} /> Update
                      </button>
                    </div>
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
