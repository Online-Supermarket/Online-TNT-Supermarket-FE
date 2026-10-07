import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Tag,
  Plus,
  Edit2,
  Trash2,
  Search,
  AlertCircle,
  CheckCircle2,
  X,
  RefreshCw,
  Percent,
  Clock,
  TrendingDown,
  Package,
  Flame,
  Calendar,
  ChevronDown,
  Filter,
  ToggleLeft,
  ToggleRight,
  ShoppingBag,
  Zap,
  Gift,
} from 'lucide-react';
import axiosInstance from '../../services/axiosInstance';
import { normalizeProduct, PRODUCT_PLACEHOLDER_IMAGE } from '../../models/Product';
import { normalizeCategory } from '../../models/Category';

/* ─────────────────────────────────────────────
   OFFER MODEL
   Stored in localStorage (no dedicated backend table).
   An offer is a discount rule applied to a product,
   modifying its price via PUT /catalog/products/{id}.
   ───────────────────────────────────────────── */
const OFFERS_STORAGE_KEY = 'tnt_admin_offers_v1';

const BADGE_PRESETS = [
  { label: 'HOT DEAL', color: '#ef4444' },
  { label: 'SALE', color: '#d97706' },
  { label: 'FLASH', color: '#7c3aed' },
  { label: 'BUNDLE', color: '#0891b2' },
  { label: 'CLEARANCE', color: '#dc2626' },
  { label: 'NEW', color: '#16a34a' },
  { label: 'LIMITED', color: '#be185d' },
];

const OFFER_TYPES = [
  { value: 'percentage', label: 'Percentage Off', icon: Percent },
  { value: 'flat', label: 'Flat Amount Off', icon: TrendingDown },
  { value: 'fixed', label: 'Fixed Price', icon: Tag },
];

function loadOffers() {
  try {
    const raw = localStorage.getItem(OFFERS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveOffers(offers) {
  try {
    localStorage.setItem(OFFERS_STORAGE_KEY, JSON.stringify(offers));
  } catch {}
}

function computeDiscountedPrice(originalPrice, type, value) {
  const orig = Number(originalPrice) || 0;
  const val = Number(value) || 0;
  if (type === 'percentage') return Math.max(0, orig - (orig * val) / 100);
  if (type === 'flat') return Math.max(0, orig - val);
  if (type === 'fixed') return Math.max(0, val);
  return orig;
}

function offerStatus(offer) {
  const now = Date.now();
  const start = offer.startDate ? new Date(offer.startDate).getTime() : 0;
  const end = offer.endDate ? new Date(offer.endDate).getTime() : Infinity;
  if (!offer.active) return 'paused';
  if (now < start) return 'scheduled';
  if (now > end) return 'expired';
  return 'active';
}

/* ─── Empty form state ─── */
const EMPTY_FORM = {
  title: '',
  productId: '',
  offerType: 'percentage',
  discountValue: '',
  badgeLabel: 'SALE',
  badgeColor: '#d97706',
  startDate: '',
  endDate: '',
  active: true,
  notes: '',
};

/* ─────────────────────────────────────────────
   STAT CARD
   ───────────────────────────────────────────── */
function StatCard({ icon: Icon, label, value, sub, accent }) {
  return (
    <div style={{
      background: '#fff',
      border: '1px solid var(--color-border)',
      borderRadius: 'var(--radius-md)',
      padding: '20px 24px',
      display: 'flex',
      alignItems: 'center',
      gap: 18,
      boxShadow: 'var(--shadow-sm)',
      flex: 1,
      minWidth: 160,
    }}>
      <div style={{
        width: 48,
        height: 48,
        borderRadius: 12,
        background: accent + '18',
        display: 'grid',
        placeItems: 'center',
        flexShrink: 0,
      }}>
        <Icon size={22} color={accent} />
      </div>
      <div>
        <div style={{ fontSize: '1.7rem', fontWeight: 800, color: 'var(--color-ink-dark)', lineHeight: 1 }}>{value}</div>
        <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-muted)', marginTop: 4 }}>{label}</div>
        {sub && <div style={{ fontSize: '0.73rem', color: accent, marginTop: 2, fontWeight: 500 }}>{sub}</div>}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   STATUS PILL
   ───────────────────────────────────────────── */
function StatusPill({ status }) {
  const map = {
    active:    { bg: '#dcfce7', color: '#15803d', label: '● Active' },
    scheduled: { bg: '#dbeafe', color: '#1d4ed8', label: '◷ Scheduled' },
    expired:   { bg: '#f1f5f9', color: '#64748b', label: '✕ Expired' },
    paused:    { bg: '#fef9c3', color: '#a16207', label: '⏸ Paused' },
  };
  const s = map[status] || map.paused;
  return (
    <span style={{
      background: s.bg, color: s.color,
      fontSize: '0.72rem', fontWeight: 700,
      padding: '3px 10px', borderRadius: 99,
      whiteSpace: 'nowrap',
    }}>{s.label}</span>
  );
}

/* ─────────────────────────────────────────────
   BADGE PREVIEW
   ───────────────────────────────────────────── */
function BadgePreview({ label, color }) {
  return (
    <span style={{
      background: color, color: '#fff',
      fontSize: '0.7rem', fontWeight: 800,
      padding: '3px 10px', borderRadius: 99,
      letterSpacing: '0.05em',
    }}>{label}</span>
  );
}

/* ─────────────────────────────────────────────
   OFFER FORM MODAL
   ───────────────────────────────────────────── */
function OfferFormModal({ offer, products, categories, onSave, onClose }) {
  const isEdit = Boolean(offer?.id);
  const [form, setForm] = useState(
    offer?.id
      ? {
          title: offer.title || '',
          productId: offer.productId || '',
          offerType: offer.offerType || 'percentage',
          discountValue: String(offer.discountValue ?? ''),
          badgeLabel: offer.badgeLabel || 'SALE',
          badgeColor: offer.badgeColor || '#d97706',
          startDate: offer.startDate || '',
          endDate: offer.endDate || '',
          active: offer.active !== false,
          notes: offer.notes || '',
        }
      : { ...EMPTY_FORM }
  );
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [customBadge, setCustomBadge] = useState(false);

  const selectedProduct = useMemo(
    () => products.find((p) => p.id === form.productId) || null,
    [products, form.productId]
  );

  const discountedPrice = useMemo(() => {
    if (!selectedProduct || !form.discountValue) return null;
    return computeDiscountedPrice(selectedProduct.price, form.offerType, form.discountValue);
  }, [selectedProduct, form.offerType, form.discountValue]);

  const savingsPercent = useMemo(() => {
    if (!selectedProduct || discountedPrice === null) return null;
    const pct = ((selectedProduct.price - discountedPrice) / selectedProduct.price) * 100;
    return pct > 0 ? pct.toFixed(1) : null;
  }, [selectedProduct, discountedPrice]);

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const validate = () => {
    const e = {};
    if (!form.title.trim()) e.title = 'Offer title is required.';
    if (!form.productId) e.productId = 'Please select a product.';
    const dv = Number(form.discountValue);
    if (!form.discountValue || isNaN(dv) || dv <= 0) e.discountValue = 'Enter a valid discount value.';
    if (form.offerType === 'percentage' && dv > 100) e.discountValue = 'Percentage cannot exceed 100%.';
    if (selectedProduct && form.offerType === 'flat' && dv >= selectedProduct.price)
      e.discountValue = 'Flat discount cannot equal or exceed original price.';
    if (!form.badgeLabel.trim()) e.badgeLabel = 'Badge label is required.';
    if (form.startDate && form.endDate && new Date(form.endDate) <= new Date(form.startDate))
      e.endDate = 'End date must be after start date.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      // If we have a product + discounted price, update product price via API
      if (selectedProduct && discountedPrice !== null) {
        await axiosInstance.put(`/catalog/products/${selectedProduct.id}`, {
          sku: selectedProduct.sku,
          name: selectedProduct.name,
          description: selectedProduct.description,
          price: parseFloat(discountedPrice.toFixed(2)),
          stockQuantity: selectedProduct.stockQuantity,
          categoryId: selectedProduct.categoryId || selectedProduct.category?.id,
          imageUrl: selectedProduct.imageUrl || selectedProduct.image_url || '',
          reorderLevel: selectedProduct.reorderLevel ?? 10,
          targetStockLevel: selectedProduct.targetStockLevel ?? 50,
        });
      }
      onSave({
        ...form,
        discountValue: Number(form.discountValue),
        originalPrice: selectedProduct?.price ?? null,
        discountedPrice,
        productName: selectedProduct?.name ?? '',
        categoryName: selectedProduct?.category?.name ?? '',
      });
    } catch (err) {
      setErrors({ _api: err.message || 'Failed to apply offer. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(15, 30, 22, 0.55)',
      backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '20px',
    }} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={{
        background: '#fff',
        borderRadius: 'var(--radius-lg)',
        width: '100%', maxWidth: 660,
        maxHeight: '92vh',
        overflow: 'hidden',
        display: 'flex', flexDirection: 'column',
        boxShadow: '0 32px 80px rgba(15,30,22,0.22)',
      }}>
        {/* Header */}
        <div style={{
          padding: '22px 28px',
          borderBottom: '1px solid var(--color-border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'linear-gradient(135deg, var(--color-primary-dark) 0%, var(--color-primary) 100%)',
          color: '#fff',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ background: 'rgba(255,255,255,0.2)', borderRadius: 10, padding: 8 }}>
              <Tag size={20} />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>
                {isEdit ? 'Edit Offer' : 'Create New Offer'}
              </div>
              <div style={{ fontSize: '0.78rem', opacity: 0.75 }}>
                {isEdit ? 'Update promotion details' : 'Configure a promotional deal'}
              </div>
            </div>
          </div>
          <button onClick={onClose} style={{
            background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 8,
            cursor: 'pointer', color: '#fff', padding: 8, display: 'grid', placeItems: 'center',
          }}><X size={18} /></button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} style={{ flex: 1, overflowY: 'auto', padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 20 }}>
          {errors._api && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 'var(--radius-sm)', padding: '10px 14px', color: '#b91c1c', fontSize: '0.85rem', display: 'flex', gap: 8 }}>
              <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 1 }} /> {errors._api}
            </div>
          )}

          {/* Offer Title */}
          <div>
            <label style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--color-ink-dark)', display: 'block', marginBottom: 6 }}>
              Offer Title <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => set('title', e.target.value)}
              placeholder="e.g. Weekend Flash Sale – Dairy Products"
              style={{
                width: '100%', padding: '10px 14px',
                border: `1px solid ${errors.title ? '#ef4444' : 'var(--color-border)'}`,
                borderRadius: 'var(--radius-sm)', fontSize: '0.9rem',
                fontFamily: 'var(--font-sans)', outline: 'none',
              }}
            />
            {errors.title && <div style={{ color: '#ef4444', fontSize: '0.78rem', marginTop: 4 }}>{errors.title}</div>}
          </div>

          {/* Product */}
          <div>
            <label style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--color-ink-dark)', display: 'block', marginBottom: 6 }}>
              Apply to Product <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <select
              value={form.productId}
              onChange={(e) => set('productId', e.target.value)}
              style={{
                width: '100%', padding: '10px 14px',
                border: `1px solid ${errors.productId ? '#ef4444' : 'var(--color-border)'}`,
                borderRadius: 'var(--radius-sm)', fontSize: '0.9rem',
                fontFamily: 'var(--font-sans)', background: '#fff', cursor: 'pointer',
              }}
            >
              <option value="">— Select product —</option>
              {categories.map((cat) => {
                const catProducts = products.filter(
                  (p) => p.categoryId === cat.id || p.category?.id === cat.id
                );
                if (catProducts.length === 0) return null;
                return (
                  <optgroup key={cat.id} label={cat.name}>
                    {catProducts.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} — Rs. {Number(p.price).toFixed(2)} ({p.sku})
                      </option>
                    ))}
                  </optgroup>
                );
              })}
              {/* Uncategorized */}
              {(() => {
                const uncategorized = products.filter(
                  (p) => !categories.some((c) => c.id === p.categoryId || c.id === p.category?.id)
                );
                return uncategorized.length > 0 ? (
                  <optgroup label="Uncategorized">
                    {uncategorized.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} — Rs. {Number(p.price).toFixed(2)} ({p.sku})
                      </option>
                    ))}
                  </optgroup>
                ) : null;
              })()}
            </select>
            {errors.productId && <div style={{ color: '#ef4444', fontSize: '0.78rem', marginTop: 4 }}>{errors.productId}</div>}
          </div>

          {/* Discount Type + Value */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <label style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--color-ink-dark)', display: 'block', marginBottom: 6 }}>
                Discount Type <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <select
                value={form.offerType}
                onChange={(e) => set('offerType', e.target.value)}
                style={{
                  width: '100%', padding: '10px 14px',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-sm)', fontSize: '0.9rem',
                  fontFamily: 'var(--font-sans)', background: '#fff', cursor: 'pointer',
                }}
              >
                {OFFER_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--color-ink-dark)', display: 'block', marginBottom: 6 }}>
                {form.offerType === 'percentage' ? 'Discount %' : form.offerType === 'flat' ? 'Amount Off (Rs.)' : 'Fixed Price (Rs.)'}
                <span style={{ color: '#ef4444' }}> *</span>
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.discountValue}
                onChange={(e) => set('discountValue', e.target.value)}
                placeholder={form.offerType === 'percentage' ? '0 – 100' : '0.00'}
                style={{
                  width: '100%', padding: '10px 14px',
                  border: `1px solid ${errors.discountValue ? '#ef4444' : 'var(--color-border)'}`,
                  borderRadius: 'var(--radius-sm)', fontSize: '0.9rem',
                  fontFamily: 'var(--font-sans)', outline: 'none',
                }}
              />
              {errors.discountValue && <div style={{ color: '#ef4444', fontSize: '0.78rem', marginTop: 4 }}>{errors.discountValue}</div>}
            </div>
          </div>

          {/* Live Preview */}
          {selectedProduct && discountedPrice !== null && (
            <div style={{
              background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
              border: '1px solid #86efac',
              borderRadius: 'var(--radius-md)',
              padding: '14px 18px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 44, height: 44, borderRadius: 8, overflow: 'hidden', background: 'var(--color-soft-mint)', flexShrink: 0 }}>
                  <img
                    src={selectedProduct.imageUrl || PRODUCT_PLACEHOLDER_IMAGE}
                    alt={selectedProduct.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={(e) => { e.target.src = PRODUCT_PLACEHOLDER_IMAGE; }}
                  />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--color-ink-dark)' }}>{selectedProduct.name}</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--color-muted)' }}>{selectedProduct.category?.name}</div>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-muted)', textDecoration: 'line-through' }}>
                  Rs. {Number(selectedProduct.price).toFixed(2)}
                </div>
                <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--color-primary)' }}>
                  Rs. {discountedPrice.toFixed(2)}
                </div>
                {savingsPercent && (
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#16a34a' }}>
                    Save {savingsPercent}%
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Badge */}
          <div>
            <label style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--color-ink-dark)', display: 'block', marginBottom: 8 }}>
              Badge Label <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
              {BADGE_PRESETS.map((b) => (
                <button
                  key={b.label}
                  type="button"
                  onClick={() => { set('badgeLabel', b.label); set('badgeColor', b.color); setCustomBadge(false); }}
                  style={{
                    padding: '5px 12px', borderRadius: 99,
                    border: `2px solid ${form.badgeLabel === b.label && !customBadge ? b.color : 'transparent'}`,
                    background: b.color + '18',
                    color: b.color, fontWeight: 700, fontSize: '0.72rem',
                    cursor: 'pointer', letterSpacing: '0.05em',
                    transition: 'all 0.15s',
                    outline: form.badgeLabel === b.label && !customBadge ? `2px solid ${b.color}` : 'none',
                  }}
                >{b.label}</button>
              ))}
              <button
                type="button"
                onClick={() => setCustomBadge(true)}
                style={{
                  padding: '5px 12px', borderRadius: 99,
                  border: `2px solid ${customBadge ? 'var(--color-primary)' : 'var(--color-border)'}`,
                  background: customBadge ? 'var(--color-soft-mint)' : '#fff',
                  color: 'var(--color-primary)', fontWeight: 700, fontSize: '0.72rem', cursor: 'pointer',
                }}
              >✏ Custom</button>
            </div>
            {customBadge && (
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <input
                  type="text"
                  value={form.badgeLabel}
                  onChange={(e) => set('badgeLabel', e.target.value.toUpperCase())}
                  placeholder="CUSTOM LABEL"
                  maxLength={15}
                  style={{
                    flex: 1, padding: '8px 12px',
                    border: `1px solid ${errors.badgeLabel ? '#ef4444' : 'var(--color-border)'}`,
                    borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', fontFamily: 'var(--font-sans)',
                    fontWeight: 700, letterSpacing: '0.05em',
                  }}
                />
                <input
                  type="color"
                  value={form.badgeColor}
                  onChange={(e) => set('badgeColor', e.target.value)}
                  title="Badge colour"
                  style={{ width: 40, height: 38, border: '1px solid var(--color-border)', borderRadius: 8, cursor: 'pointer', padding: 2 }}
                />
                <BadgePreview label={form.badgeLabel || 'PREVIEW'} color={form.badgeColor} />
              </div>
            )}
            {errors.badgeLabel && <div style={{ color: '#ef4444', fontSize: '0.78rem', marginTop: 4 }}>{errors.badgeLabel}</div>}
          </div>

          {/* Date Range */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <label style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--color-ink-dark)', display: 'block', marginBottom: 6 }}>
                Start Date
              </label>
              <input
                type="date"
                value={form.startDate}
                onChange={(e) => set('startDate', e.target.value)}
                style={{
                  width: '100%', padding: '10px 14px',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-sm)', fontSize: '0.88rem',
                  fontFamily: 'var(--font-sans)',
                }}
              />
            </div>
            <div>
              <label style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--color-ink-dark)', display: 'block', marginBottom: 6 }}>
                End Date
              </label>
              <input
                type="date"
                value={form.endDate}
                onChange={(e) => set('endDate', e.target.value)}
                style={{
                  width: '100%', padding: '10px 14px',
                  border: `1px solid ${errors.endDate ? '#ef4444' : 'var(--color-border)'}`,
                  borderRadius: 'var(--radius-sm)', fontSize: '0.88rem',
                  fontFamily: 'var(--font-sans)',
                }}
              />
              {errors.endDate && <div style={{ color: '#ef4444', fontSize: '0.78rem', marginTop: 4 }}>{errors.endDate}</div>}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--color-ink-dark)', display: 'block', marginBottom: 6 }}>
              Internal Notes
            </label>
            <textarea
              value={form.notes}
              onChange={(e) => set('notes', e.target.value)}
              rows={2}
              placeholder="Optional: reason for this offer, campaign code, etc."
              style={{
                width: '100%', padding: '10px 14px',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-sm)', fontSize: '0.88rem',
                fontFamily: 'var(--font-sans)', resize: 'vertical',
              }}
            />
          </div>

          {/* Active toggle */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'var(--color-soft-mint)', borderRadius: 'var(--radius-sm)' }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--color-ink-dark)' }}>Offer Status</div>
              <div style={{ fontSize: '0.76rem', color: 'var(--color-muted)' }}>Toggle to activate or pause this offer</div>
            </div>
            <button
              type="button"
              onClick={() => set('active', !form.active)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: form.active ? 'var(--color-primary)' : 'var(--color-muted)', display: 'flex', alignItems: 'center', gap: 6 }}
            >
              {form.active ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
              <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>{form.active ? 'Active' : 'Paused'}</span>
            </button>
          </div>
        </form>

        {/* Footer */}
        <div style={{
          padding: '16px 28px',
          borderTop: '1px solid var(--color-border)',
          display: 'flex', justifyContent: 'flex-end', gap: 10,
          background: '#fafafa',
        }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '10px 20px', borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--color-border)', background: '#fff',
              fontWeight: 600, fontSize: '0.88rem', cursor: 'pointer',
            }}
          >Cancel</button>
          <button
            type="submit"
            disabled={submitting}
            onClick={handleSubmit}
            style={{
              padding: '10px 24px', borderRadius: 'var(--radius-sm)',
              border: 'none',
              background: submitting ? 'var(--color-muted)' : 'var(--color-primary)',
              color: '#fff', fontWeight: 700, fontSize: '0.88rem',
              cursor: submitting ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', gap: 8,
            }}
          >
            {submitting ? <><RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} /> Saving…</> : isEdit ? '✓ Update Offer' : '+ Create Offer'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   DELETE CONFIRM MODAL
   ───────────────────────────────────────────── */
function DeleteModal({ offer, onConfirm, onClose, loading }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1100,
      background: 'rgba(15,30,22,0.6)',
      backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20,
    }}>
      <div style={{
        background: '#fff', borderRadius: 'var(--radius-md)', padding: 32,
        maxWidth: 420, width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
      }}>
        <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', marginBottom: 20 }}>
          <div style={{ background: '#fef2f2', borderRadius: 10, padding: 10, flexShrink: 0 }}>
            <Trash2 size={22} color="#ef4444" />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--color-ink-dark)', marginBottom: 4 }}>Delete Offer</div>
            <div style={{ fontSize: '0.88rem', color: 'var(--color-muted)', lineHeight: 1.5 }}>
              Are you sure you want to delete <strong>"{offer.title}"</strong>? The product's price will remain at its current (discounted) value — you may need to reset it manually.
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            style={{ padding: '9px 18px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', background: '#fff', fontWeight: 600, cursor: 'pointer' }}
          >Cancel</button>
          <button
            onClick={onConfirm}
            disabled={loading}
            style={{ padding: '9px 18px', borderRadius: 'var(--radius-sm)', border: 'none', background: '#ef4444', color: '#fff', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer' }}
          >{loading ? 'Deleting…' : 'Delete Offer'}</button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   MAIN PAGE
   ───────────────────────────────────────────── */
export const ManageOffers = () => {
  const [offers, setOffers] = useState(loadOffers);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // UI state
  const [showForm, setShowForm] = useState(false);
  const [editingOffer, setEditingOffer] = useState(null);
  const [deletingOffer, setDeletingOffer] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCategory, setFilterCategory] = useState('ALL');

  /* ─── Fetch products + categories ─── */
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [catData, prodData] = await Promise.all([
        axiosInstance.get('/catalog/categories').catch(() => []),
        axiosInstance.get('/catalog/staff/products').catch(() =>
          axiosInstance.get('/catalog/products?pageSize=200').catch(() => [])
        ),
      ]);
      const cats = Array.isArray(catData) ? catData.map(normalizeCategory) : [];
      const prods = Array.isArray(prodData) ? prodData.map(normalizeProduct) : [];
      setCategories(cats);
      setProducts(prods);
    } catch (err) {
      setError(err.message || 'Failed to load products. Check backend connection.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  /* ─── Persist offers ─── */
  useEffect(() => { saveOffers(offers); }, [offers]);

  /* ─── Auto-clear messages ─── */
  useEffect(() => {
    if (!successMsg) return;
    const t = setTimeout(() => setSuccessMsg(''), 4000);
    return () => clearTimeout(t);
  }, [successMsg]);

  /* ─── Stats ─── */
  const stats = useMemo(() => {
    const active = offers.filter((o) => offerStatus(o) === 'active').length;
    const scheduled = offers.filter((o) => offerStatus(o) === 'scheduled').length;
    const expired = offers.filter((o) => offerStatus(o) === 'expired').length;
    const totalSavings = offers
      .filter((o) => offerStatus(o) === 'active' && o.originalPrice && o.discountedPrice)
      .reduce((sum, o) => sum + (o.originalPrice - o.discountedPrice), 0);
    return { total: offers.length, active, scheduled, expired, totalSavings };
  }, [offers]);

  /* ─── Filtered offers ─── */
  const filtered = useMemo(() => {
    return offers.filter((o) => {
      const status = offerStatus(o);
      const q = searchQuery.trim().toLowerCase();
      const matchSearch = !q
        || o.title?.toLowerCase().includes(q)
        || o.productName?.toLowerCase().includes(q)
        || o.badgeLabel?.toLowerCase().includes(q);
      const matchStatus = filterStatus === 'all' || status === filterStatus;
      const matchCat = filterCategory === 'ALL' || o.categoryName === filterCategory;
      return matchSearch && matchStatus && matchCat;
    }).sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  }, [offers, searchQuery, filterStatus, filterCategory]);

  /* ─── CRUD handlers ─── */
  const handleSave = (formData) => {
    if (editingOffer) {
      setOffers((prev) => prev.map((o) => o.id === editingOffer.id ? { ...o, ...formData, updatedAt: new Date().toISOString() } : o));
      setSuccessMsg(`✓ Offer "${formData.title}" updated successfully.`);
    } else {
      const newOffer = {
        ...formData,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setOffers((prev) => [newOffer, ...prev]);
      setSuccessMsg(`✓ Offer "${formData.title}" created and price applied.`);
    }
    setShowForm(false);
    setEditingOffer(null);
  };

  const handleDelete = async () => {
    if (!deletingOffer) return;
    setDeleteLoading(true);
    try {
      setOffers((prev) => prev.filter((o) => o.id !== deletingOffer.id));
      setSuccessMsg(`✓ Offer "${deletingOffer.title}" deleted.`);
      setDeletingOffer(null);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleToggle = async (offer) => {
    setOffers((prev) => prev.map((o) => o.id === offer.id ? { ...o, active: !o.active } : o));
    setSuccessMsg(`✓ Offer ${!offer.active ? 'activated' : 'paused'}.`);
  };

  const openCreate = () => {
    setEditingOffer(null);
    setShowForm(true);
  };

  const openEdit = (offer) => {
    setEditingOffer(offer);
    setShowForm(true);
  };

  const uniqueCategories = useMemo(
    () => [...new Set(offers.map((o) => o.categoryName).filter(Boolean))],
    [offers]
  );

  return (
    <div style={{ padding: '0 0 48px' }}>
      {/* ── Page Header ── */}
      <div style={{ marginBottom: 28, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
            <div style={{ width: 42, height: 42, background: 'linear-gradient(135deg, var(--color-primary-dark), var(--color-primary))', borderRadius: 12, display: 'grid', placeItems: 'center' }}>
              <Tag size={20} color="#fff" />
            </div>
            <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '2rem', color: 'var(--color-primary-dark)', margin: 0 }}>
              Manage Offers
            </h1>
          </div>
          <p style={{ color: 'var(--color-muted)', fontSize: '0.9rem', margin: 0 }}>
            Create and manage promotional deals, discounts, and flash sales across your product catalog.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={fetchData}
            disabled={loading}
            style={{
              padding: '10px 16px', borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--color-border)', background: '#fff',
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
              fontWeight: 600, fontSize: '0.85rem', color: 'var(--color-muted)',
            }}
          >
            <RefreshCw size={15} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
            Refresh
          </button>
          <button
            onClick={openCreate}
            style={{
              padding: '10px 20px', borderRadius: 'var(--radius-sm)',
              border: 'none',
              background: 'linear-gradient(135deg, var(--color-primary-dark), var(--color-primary))',
              color: '#fff', fontWeight: 700, fontSize: '0.88rem',
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
              boxShadow: '0 4px 14px rgba(20,107,69,0.3)',
            }}
          >
            <Plus size={16} /> New Offer
          </button>
        </div>
      </div>

      {/* ── Messages ── */}
      {successMsg && (
        <div style={{
          background: '#f0fdf4', border: '1px solid #86efac',
          borderRadius: 'var(--radius-sm)', padding: '10px 16px',
          color: '#15803d', fontSize: '0.88rem', display: 'flex',
          alignItems: 'center', gap: 8, marginBottom: 20,
        }}>
          <CheckCircle2 size={16} /> {successMsg}
        </div>
      )}
      {error && (
        <div style={{
          background: '#fef2f2', border: '1px solid #fecaca',
          borderRadius: 'var(--radius-sm)', padding: '10px 16px',
          color: '#b91c1c', fontSize: '0.88rem', display: 'flex',
          alignItems: 'center', gap: 8, marginBottom: 20,
        }}>
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {/* ── Stat Cards ── */}
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 28 }}>
        <StatCard icon={Tag}         label="Total Offers"      value={stats.total}     accent="#146b45" />
        <StatCard icon={Flame}       label="Active Now"        value={stats.active}    accent="#ef4444" sub={stats.active > 0 ? 'Live & running' : ''} />
        <StatCard icon={Clock}       label="Scheduled"         value={stats.scheduled} accent="#1d4ed8" />
        <StatCard icon={TrendingDown}label="Expired"           value={stats.expired}   accent="#64748b" />
        <StatCard icon={Gift}        label="Avg. Savings"      value={`Rs. ${(stats.totalSavings || 0).toFixed(0)}`} accent="#7c3aed" sub="across active offers" />
      </div>

      {/* ── Filters ── */}
      <div style={{
        background: '#fff', border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-md)', padding: '14px 18px',
        marginBottom: 20, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center',
        boxShadow: 'var(--shadow-sm)',
      }}>
        {/* Search */}
        <div style={{ flex: 1, minWidth: 220, position: 'relative' }}>
          <Search size={15} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-muted)' }} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by title, product, badge…"
            style={{
              width: '100%', paddingLeft: 32, paddingRight: 12, paddingTop: 8, paddingBottom: 8,
              border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)',
              fontSize: '0.88rem', fontFamily: 'var(--font-sans)',
            }}
          />
        </div>

        {/* Status filter */}
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          style={{ padding: '8px 12px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', fontSize: '0.88rem', background: '#fff', cursor: 'pointer' }}
        >
          <option value="all">All Statuses</option>
          <option value="active">Active</option>
          <option value="scheduled">Scheduled</option>
          <option value="expired">Expired</option>
          <option value="paused">Paused</option>
        </select>

        {/* Category filter */}
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          style={{ padding: '8px 12px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', fontSize: '0.88rem', background: '#fff', cursor: 'pointer' }}
        >
          <option value="ALL">All Categories</option>
          {uniqueCategories.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>

        <div style={{ fontSize: '0.82rem', color: 'var(--color-muted)', marginLeft: 'auto' }}>
          {filtered.length} of {offers.length} offers
        </div>
      </div>

      {/* ── Table ── */}
      <div style={{
        background: '#fff', border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)',
        overflow: 'hidden',
      }}>
        {loading ? (
          <div style={{ padding: 60, textAlign: 'center', color: 'var(--color-muted)' }}>
            <RefreshCw size={28} style={{ animation: 'spin 1s linear infinite', marginBottom: 12, display: 'block', margin: '0 auto 12px' }} />
            Loading products…
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 60, textAlign: 'center' }}>
            <div style={{ width: 64, height: 64, background: 'var(--color-soft-mint)', borderRadius: 16, display: 'grid', placeItems: 'center', margin: '0 auto 16px' }}>
              <Tag size={28} color="var(--color-primary)" />
            </div>
            <div style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--color-ink-dark)', marginBottom: 8 }}>
              {offers.length === 0 ? 'No offers yet' : 'No offers match your filters'}
            </div>
            <div style={{ color: 'var(--color-muted)', fontSize: '0.88rem', marginBottom: 20 }}>
              {offers.length === 0
                ? 'Create your first promotional offer to boost sales.'
                : 'Try adjusting your search or filter criteria.'}
            </div>
            {offers.length === 0 && (
              <button
                onClick={openCreate}
                style={{
                  padding: '10px 20px', border: 'none', borderRadius: 'var(--radius-sm)',
                  background: 'var(--color-primary)', color: '#fff', fontWeight: 700, cursor: 'pointer',
                }}
              >
                <Plus size={14} style={{ marginRight: 6 }} /> Create First Offer
              </button>
            )}
          </div>
        ) : (
          <div className="data-table-wrap">
            <table className="data-table" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th>Offer</th>
                  <th>Product</th>
                  <th>Discount</th>
                  <th>Price Change</th>
                  <th>Duration</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((offer) => {
                  const status = offerStatus(offer);
                  const savings = offer.originalPrice && offer.discountedPrice
                    ? offer.originalPrice - offer.discountedPrice : null;
                  const pct = savings && offer.originalPrice
                    ? ((savings / offer.originalPrice) * 100).toFixed(0) : null;

                  return (
                    <tr key={offer.id}>
                      {/* Offer */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ flexShrink: 0 }}>
                            <BadgePreview label={offer.badgeLabel} color={offer.badgeColor} />
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--color-ink-dark)' }}>{offer.title}</div>
                            {offer.notes && (
                              <div style={{ fontSize: '0.74rem', color: 'var(--color-muted)', marginTop: 2, maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{offer.notes}</div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Product */}
                      <td>
                        <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{offer.productName || '—'}</div>
                        {offer.categoryName && (
                          <div style={{ fontSize: '0.74rem', color: 'var(--color-primary)', fontWeight: 600, marginTop: 2 }}>{offer.categoryName}</div>
                        )}
                      </td>

                      {/* Discount */}
                      <td>
                        <div style={{
                          display: 'inline-flex', alignItems: 'center', gap: 5,
                          background: '#fef3c7', color: '#92400e',
                          padding: '3px 10px', borderRadius: 99, fontWeight: 700, fontSize: '0.8rem',
                        }}>
                          {offer.offerType === 'percentage' && <Percent size={12} />}
                          {offer.offerType === 'flat' && <TrendingDown size={12} />}
                          {offer.offerType === 'fixed' && <Tag size={12} />}
                          {offer.offerType === 'percentage' && `${offer.discountValue}% off`}
                          {offer.offerType === 'flat' && `Rs. ${Number(offer.discountValue).toFixed(2)} off`}
                          {offer.offerType === 'fixed' && `Rs. ${Number(offer.discountValue).toFixed(2)}`}
                        </div>
                      </td>

                      {/* Price Change */}
                      <td>
                        {offer.originalPrice ? (
                          <div>
                            <div style={{ fontSize: '0.76rem', color: 'var(--color-muted)', textDecoration: 'line-through' }}>
                              Rs. {Number(offer.originalPrice).toFixed(2)}
                            </div>
                            <div style={{ fontWeight: 800, color: 'var(--color-primary)', fontSize: '0.95rem' }}>
                              Rs. {Number(offer.discountedPrice).toFixed(2)}
                            </div>
                            {pct && (
                              <div style={{ fontSize: '0.7rem', color: '#16a34a', fontWeight: 700 }}>Save {pct}%</div>
                            )}
                          </div>
                        ) : <span style={{ color: 'var(--color-muted)' }}>—</span>}
                      </td>

                      {/* Duration */}
                      <td>
                        <div style={{ fontSize: '0.8rem', color: 'var(--color-muted)' }}>
                          {offer.startDate
                            ? new Date(offer.startDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
                            : '—'}
                          {offer.endDate && (
                            <>
                              <span style={{ margin: '0 4px' }}>→</span>
                              {new Date(offer.endDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                            </>
                          )}
                          {!offer.startDate && !offer.endDate && <span>Ongoing</span>}
                        </div>
                      </td>

                      {/* Status */}
                      <td><StatusPill status={status} /></td>

                      {/* Actions */}
                      <td>
                        <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                          {/* Toggle active */}
                          <button
                            onClick={() => handleToggle(offer)}
                            title={offer.active ? 'Pause offer' : 'Activate offer'}
                            style={{
                              width: 32, height: 32, borderRadius: 8, border: '1px solid var(--color-border)',
                              background: '#fff', cursor: 'pointer', display: 'grid', placeItems: 'center',
                              color: offer.active ? 'var(--color-primary)' : 'var(--color-muted)',
                            }}
                          >
                            {offer.active ? <ToggleRight size={15} /> : <ToggleLeft size={15} />}
                          </button>
                          {/* Edit */}
                          <button
                            onClick={() => openEdit(offer)}
                            title="Edit offer"
                            style={{
                              width: 32, height: 32, borderRadius: 8, border: '1px solid var(--color-border)',
                              background: '#fff', cursor: 'pointer', display: 'grid', placeItems: 'center',
                              color: 'var(--color-primary)',
                            }}
                          >
                            <Edit2 size={14} />
                          </button>
                          {/* Delete */}
                          <button
                            onClick={() => setDeletingOffer(offer)}
                            title="Delete offer"
                            style={{
                              width: 32, height: 32, borderRadius: 8, border: '1px solid #fecaca',
                              background: '#fef2f2', cursor: 'pointer', display: 'grid', placeItems: 'center',
                              color: '#ef4444',
                            }}
                          >
                            <Trash2 size={14} />
                          </button>
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

      {/* ── Info banner (no dedicated API) ── */}
      {!loading && products.length > 0 && (
        <div style={{
          marginTop: 16, background: '#eff6ff', border: '1px solid #bfdbfe',
          borderRadius: 'var(--radius-sm)', padding: '10px 16px',
          display: 'flex', alignItems: 'center', gap: 10,
          fontSize: '0.8rem', color: '#1d4ed8',
        }}>
          <Zap size={14} style={{ flexShrink: 0 }} />
          <span>
            <strong>How it works:</strong> Creating an offer updates the product's price via the Catalog API. Offer metadata is stored locally in your browser. A dedicated Offers API is planned for a future sprint.
          </span>
        </div>
      )}

      {/* ── Active Promotional Offers Preview ── */}
      {(() => {
        const now = Date.now();
        const activeNow = offers.filter((o) => {
          if (!o.active) return false;
          const start = o.startDate ? new Date(o.startDate).getTime() : 0;
          const end   = o.endDate   ? new Date(o.endDate).getTime()   : Infinity;
          return now >= start && now <= end;
        });
        if (activeNow.length === 0) return null;
        return (
          <div style={{ marginTop: 36 }}>
            {/* Section header */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              marginBottom: 20, flexWrap: 'wrap', gap: 10,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 36, height: 36,
                  background: 'linear-gradient(135deg, #ef4444, #f97316)',
                  borderRadius: 10, display: 'grid', placeItems: 'center',
                }}>
                  <Flame size={18} color="#fff" />
                </div>
                <div>
                  <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: 'var(--color-primary-dark)' }}>
                    Active Promotional Offers
                  </h2>
                  <div style={{ fontSize: '0.78rem', color: 'var(--color-muted)', marginTop: 2 }}>
                    Live preview — exactly what customers see on the Offers page
                  </div>
                </div>
              </div>
              <span style={{
                background: '#dcfce7', color: '#15803d',
                fontSize: '0.75rem', fontWeight: 700,
                padding: '4px 12px', borderRadius: 99,
              }}>
                {activeNow.length} Live {activeNow.length === 1 ? 'Offer' : 'Offers'}
              </span>
            </div>

            {/* Offer preview cards */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
              gap: 20,
            }}>
              {activeNow.map((offer) => {
                const prod = products.find((p) => p.id === offer.productId) || null;
                const displayPrice = prod ? prod.price : (offer.discountedPrice ?? 0);
                const origPrice = Number(offer.originalPrice ?? 0);
                const pct = origPrice > 0
                  ? Math.round(((origPrice - displayPrice) / origPrice) * 100)
                  : 0;
                const img = prod?.imageUrl || prod?.image_url || PRODUCT_PLACEHOLDER_IMAGE;

                return (
                  <div
                    key={offer.id}
                    style={{
                      background: '#fff',
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius-md)',
                      overflow: 'hidden',
                      boxShadow: 'var(--shadow-sm)',
                      position: 'relative',
                      transition: 'box-shadow 0.2s, transform 0.2s',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; }}
                  >
                    {/* Badge */}
                    <span style={{
                      position: 'absolute', top: 12, left: 12, zIndex: 3,
                      background: offer.badgeColor || '#d97706',
                      color: '#fff', fontSize: '0.68rem', fontWeight: 800,
                      padding: '3px 10px', borderRadius: 99,
                      letterSpacing: '0.05em', boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                    }}>{offer.badgeLabel}</span>

                    {pct > 0 && (
                      <span style={{
                        position: 'absolute', top: 12, right: 12, zIndex: 3,
                        background: '#dcfce7', color: '#15803d',
                        fontSize: '0.68rem', fontWeight: 800,
                        padding: '3px 9px', borderRadius: 99,
                      }}>Save {pct}%</span>
                    )}

                    {/* Image */}
                    <div style={{
                      height: 170,
                      background: 'linear-gradient(135deg, var(--color-soft-mint), #d8ebd9)',
                      overflow: 'hidden',
                    }}>
                      <img
                        src={img}
                        alt={offer.productName}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={(e) => { e.target.src = PRODUCT_PLACEHOLDER_IMAGE; }}
                      />
                    </div>

                    {/* Info */}
                    <div style={{ padding: '14px 16px' }}>
                      <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
                        {offer.categoryName || 'Promotion'}
                      </div>
                      <div style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--color-ink-dark)', marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {offer.productName || 'Unknown Product'}
                      </div>
                      <div style={{ fontSize: '0.76rem', color: 'var(--color-muted)', marginBottom: 10, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {offer.title}
                      </div>

                      {/* Price */}
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 12 }}>
                        <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-primary-dark)' }}>
                          Rs. {Number(displayPrice).toFixed(2)}
                        </span>
                        {origPrice > 0 && origPrice !== displayPrice && (
                          <span style={{ textDecoration: 'line-through', color: 'var(--color-muted)', fontSize: '0.82rem' }}>
                            Rs. {origPrice.toFixed(2)}
                          </span>
                        )}
                      </div>

                      {/* Date range */}
                      {(offer.startDate || offer.endDate) && (
                        <div style={{
                          display: 'flex', alignItems: 'center', gap: 5,
                          fontSize: '0.72rem', color: 'var(--color-muted)',
                          background: 'var(--color-soft-mint)', padding: '4px 10px',
                          borderRadius: 99, width: 'fit-content',
                        }}>
                          <Calendar size={11} />
                          {offer.startDate && new Date(offer.startDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                          {offer.startDate && offer.endDate && ' → '}
                          {offer.endDate && new Date(offer.endDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                        </div>
                      )}
                    </div>

                    {/* Edit shortcut */}
                    <div style={{
                      borderTop: '1px solid var(--color-border)',
                      padding: '8px 16px',
                      display: 'flex', justifyContent: 'flex-end', gap: 8,
                      background: '#fafafa',
                    }}>
                      <button
                        onClick={() => openEdit(offer)}
                        style={{
                          padding: '5px 14px', borderRadius: 'var(--radius-sm)',
                          border: '1px solid var(--color-border)', background: '#fff',
                          fontSize: '0.76rem', fontWeight: 600,
                          cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5,
                          color: 'var(--color-primary)',
                        }}
                      >
                        <Edit2 size={12} /> Edit
                      </button>
                      <button
                        onClick={() => handleToggle(offer)}
                        style={{
                          padding: '5px 14px', borderRadius: 'var(--radius-sm)',
                          border: '1px solid #fecaca', background: '#fef2f2',
                          fontSize: '0.76rem', fontWeight: 600,
                          cursor: 'pointer', color: '#ef4444',
                        }}
                      >
                        Pause
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* ── Modals ── */}
      {showForm && (
        <OfferFormModal
          offer={editingOffer}
          products={products}
          categories={categories}
          onSave={handleSave}
          onClose={() => { setShowForm(false); setEditingOffer(null); }}
        />
      )}
      {deletingOffer && (
        <DeleteModal
          offer={deletingOffer}
          onConfirm={handleDelete}
          onClose={() => setDeletingOffer(null)}
          loading={deleteLoading}
        />
      )}

      {/* ── Spin keyframe (inline for portability) ── */}
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};
