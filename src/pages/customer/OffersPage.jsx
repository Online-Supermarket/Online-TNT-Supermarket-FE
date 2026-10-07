import React, { useState, useEffect, useMemo } from 'react';
import {
  Tag,
  Clock,
  Flame,
  ShoppingBag,
  Eye,
  Percent,
  TrendingDown,
  Zap,
  Gift,
  Star,
  ChevronRight,
} from 'lucide-react';
import { ProductCard } from '../../components/ProductCard';
import { QuickViewModal } from '../../components/QuickViewModal';
import axiosInstance from '../../services/axiosInstance';
import { normalizeProduct, PRODUCT_PLACEHOLDER_IMAGE } from '../../models/Product';
import { useCart } from '../../context/CartContext';

/* ── Constants ─────────────────────────────── */
const OFFERS_STORAGE_KEY = 'tnt_admin_offers_v1';

function loadActiveOffers() {
  try {
    const raw = localStorage.getItem(OFFERS_STORAGE_KEY);
    const all = raw ? JSON.parse(raw) : [];
    const now = Date.now();
    return all.filter((o) => {
      if (!o.active) return false;
      const start = o.startDate ? new Date(o.startDate).getTime() : 0;
      const end   = o.endDate   ? new Date(o.endDate).getTime()   : Infinity;
      return now >= start && now <= end;
    });
  } catch {
    return [];
  }
}

/* ── Countdown hook ─────────────────────────── */
function useCountdown(endDate) {
  const [timeLeft, setTimeLeft] = useState('');
  useEffect(() => {
    if (!endDate) return;
    const tick = () => {
      const diff = new Date(endDate).getTime() - Date.now();
      if (diff <= 0) { setTimeLeft('Expired'); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      if (h > 48) {
        const days = Math.floor(h / 24);
        setTimeLeft(`${days}d ${h % 24}h left`);
      } else {
        setTimeLeft(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')} left`);
      }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [endDate]);
  return timeLeft;
}

/* ── Offer Card ─────────────────────────────── */
function OfferCard({ offer, product, onQuickView }) {
  const { addToCart } = useCart();
  const countdown = useCountdown(offer.endDate);
  const [added, setAdded] = useState(false);
  const [stockMsg, setStockMsg] = useState('');

  const displayPrice = product ? Number(product.price) : Number(offer.discountedPrice ?? 0);
  const origPrice    = Number(offer.originalPrice ?? 0);
  const pctSaving    = origPrice > 0
    ? Math.round(((origPrice - displayPrice) / origPrice) * 100)
    : 0;
  const inStock = product
    ? (product.stockQuantity === undefined || product.stockQuantity > 0)
    : true;
  const img = product?.imageUrl || product?.image_url || PRODUCT_PLACEHOLDER_IMAGE;

  const handleAddToCart = async () => {
    if (!product) return;
    const result = await addToCart(product);
    if (result === false) {
      setStockMsg(`Only ${product.stockQuantity} available`);
      setTimeout(() => setStockMsg(''), 3000);
    } else {
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    }
  };

  return (
    <div style={{
      background: '#fff',
      borderRadius: 'var(--radius-md)',
      border: '1px solid var(--color-border)',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      boxShadow: 'var(--shadow-sm)',
      transition: 'transform 0.2s, box-shadow 0.2s',
      cursor: 'default',
      position: 'relative',
    }}
      onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; }}
    >
      {/* Badge */}
      <span style={{
        position: 'absolute', top: 14, left: 14, zIndex: 3,
        background: offer.badgeColor || '#d97706',
        color: '#fff', fontSize: '0.7rem', fontWeight: 800,
        padding: '4px 11px', borderRadius: 99, letterSpacing: '0.05em',
        boxShadow: '0 2px 8px rgba(0,0,0,0.18)',
      }}>{offer.badgeLabel}</span>

      {/* Savings pill */}
      {pctSaving > 0 && (
        <span style={{
          position: 'absolute', top: 14, right: 14, zIndex: 3,
          background: '#dcfce7', color: '#15803d',
          fontSize: '0.7rem', fontWeight: 800,
          padding: '4px 10px', borderRadius: 99,
        }}>Save {pctSaving}%</span>
      )}

      {/* Image */}
      <div style={{ position: 'relative', height: 200, background: 'linear-gradient(135deg, var(--color-soft-mint), #d8ebd9)', overflow: 'hidden' }}>
        <img
          src={img}
          alt={offer.productName}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          onError={(e) => { e.target.src = PRODUCT_PLACEHOLDER_IMAGE; }}
        />
        {/* Quick-view overlay */}
        <button
          onClick={() => product && onQuickView(product)}
          title="Quick View"
          style={{
            position: 'absolute', bottom: 10, right: 10,
            background: 'rgba(255,255,255,0.92)', border: 'none',
            borderRadius: '50%', width: 34, height: 34,
            display: 'grid', placeItems: 'center',
            cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
          }}
        >
          <Eye size={15} color="var(--color-primary)" />
        </button>

        {/* Countdown */}
        {countdown && countdown !== 'Expired' && (
          <div style={{
            position: 'absolute', bottom: 10, left: 10,
            background: 'rgba(15,30,22,0.78)', color: '#fff',
            fontSize: '0.7rem', fontWeight: 700,
            padding: '3px 9px', borderRadius: 99,
            display: 'flex', alignItems: 'center', gap: 4,
            backdropFilter: 'blur(4px)',
          }}>
            <Clock size={11} /> {countdown}
          </div>
        )}
      </div>

      {/* Body */}
      <div style={{ padding: '16px 18px', flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          {offer.categoryName || 'Promotion'}
        </div>
        <h3 style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--color-ink-dark)', margin: 0, lineHeight: 1.3 }}>
          {offer.productName}
        </h3>
        <div style={{ fontSize: '0.8rem', color: 'var(--color-muted)', fontWeight: 500 }}>
          {offer.title}
        </div>

        {/* Price row */}
        <div style={{ marginTop: 'auto', paddingTop: 12, display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <span style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-primary-dark)' }}>
            Rs. {displayPrice.toFixed(2)}
          </span>
          {origPrice > 0 && origPrice !== displayPrice && (
            <span style={{ textDecoration: 'line-through', color: 'var(--color-muted)', fontSize: '0.88rem' }}>
              Rs. {origPrice.toFixed(2)}
            </span>
          )}
        </div>

        {/* Stock message */}
        {stockMsg && (
          <div style={{ fontSize: '0.76rem', color: '#b45309' }}>{stockMsg}</div>
        )}
      </div>

      {/* Add to Cart */}
      <div style={{ padding: '0 18px 18px' }}>
        <button
          onClick={handleAddToCart}
          disabled={!inStock || !product}
          style={{
            width: '100%', padding: '10px 0',
            border: 'none', borderRadius: 'var(--radius-sm)',
            background: added
              ? '#16a34a'
              : inStock && product
                ? 'linear-gradient(135deg, var(--color-primary-dark), var(--color-primary))'
                : '#e5e7eb',
            color: inStock && product ? '#fff' : '#9ca3af',
            fontWeight: 700, fontSize: '0.88rem',
            cursor: inStock && product ? 'pointer' : 'not-allowed',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            transition: 'background 0.2s',
            boxShadow: inStock && product ? '0 4px 14px rgba(20,107,69,0.25)' : 'none',
          }}
        >
          <ShoppingBag size={15} />
          {added ? 'Added to Cart!' : !inStock ? 'Out of Stock' : !product ? 'Loading…' : 'Add to Cart'}
        </button>
      </div>
    </div>
  );
}

/* ── Fallback product card (from API) ─────── */
function ApiOffersSection() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axiosInstance.get('/catalog/offers')
      .then((data) => { if (Array.isArray(data) && data.length > 0) setProducts(data.map(normalizeProduct)); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading || products.length === 0) return null;
  return (
    <>
      <div style={{ marginTop: 48, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
        <Star size={20} color="var(--color-accent-gold)" />
        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.6rem', color: 'var(--color-primary-dark)', margin: 0 }}>
          More Featured Products
        </h2>
      </div>
      <div className="products-grid">
        {products.map((p) => <ProductCard key={p.id} product={p} />)}
      </div>
    </>
  );
}

/* ── Category filter pill ─────────────────── */
function FilterPill({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '7px 18px', borderRadius: 99,
        border: `1.5px solid ${active ? 'var(--color-primary)' : 'var(--color-border)'}`,
        background: active ? 'var(--color-primary)' : '#fff',
        color: active ? '#fff' : 'var(--color-muted)',
        fontWeight: 600, fontSize: '0.83rem',
        cursor: 'pointer', transition: 'all 0.15s',
        fontFamily: 'var(--font-sans)',
      }}
    >{label}</button>
  );
}

/* ── Main Page ───────────────────────────── */
export const OffersPage = () => {
  const [activeOffers, setActiveOffers] = useState([]);
  const [products, setProducts]         = useState([]);
  const [loading, setLoading]           = useState(true);
  const [quickViewProduct, setQuickViewProduct] = useState(null);
  const [filterCat, setFilterCat]       = useState('All');

  /* Load offers + products */
  useEffect(() => {
    const offers = loadActiveOffers();
    setActiveOffers(offers);

    if (offers.length > 0) {
      // Fetch live product data to get current stock + prices
      axiosInstance.get('/catalog/products?pageSize=200')
        .then((data) => {
          if (Array.isArray(data)) setProducts(data.map(normalizeProduct));
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  /* Merge offer metadata with live product data */
  const enrichedOffers = useMemo(() => {
    return activeOffers.map((offer) => {
      const liveProduct = products.find((p) => p.id === offer.productId) || null;
      return { offer, product: liveProduct };
    });
  }, [activeOffers, products]);

  /* Category filter options */
  const categories = useMemo(() => {
    const cats = [...new Set(activeOffers.map((o) => o.categoryName).filter(Boolean))];
    return ['All', ...cats];
  }, [activeOffers]);

  const filtered = useMemo(() => {
    if (filterCat === 'All') return enrichedOffers;
    return enrichedOffers.filter(({ offer }) => offer.categoryName === filterCat);
  }, [enrichedOffers, filterCat]);

  /* Stats */
  const totalSavings = useMemo(() => {
    return activeOffers.reduce((sum, o) => {
      if (o.originalPrice && o.discountedPrice) return sum + (o.originalPrice - o.discountedPrice);
      return sum;
    }, 0);
  }, [activeOffers]);

  return (
    <div style={{ background: 'var(--color-bg-body)', minHeight: '100vh' }}>
      {/* ── Hero ─────────────────────────────────── */}
      <div style={{
        background: 'linear-gradient(135deg, var(--color-primary-dark) 0%, #1a5c3a 60%, #0e4a2c 100%)',
        padding: '64px 24px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Decorative circles */}
        {[...Array(4)].map((_, i) => (
          <div key={i} style={{
            position: 'absolute',
            width: [280, 200, 150, 100][i],
            height: [280, 200, 150, 100][i],
            borderRadius: '50%',
            border: '1px solid rgba(255,255,255,0.07)',
            top: ['–10%', '20%', '60%', '10%'][i],
            right: ['-5%', '10%', '5%', '35%'][i],
            pointerEvents: 'none',
          }} />
        ))}

        <div style={{ maxWidth: 1100, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'rgba(255,255,255,0.12)', color: 'var(--color-soft-mint)',
            padding: '6px 16px', borderRadius: 99,
            fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.08em',
            marginBottom: 20, backdropFilter: 'blur(4px)',
            border: '1px solid rgba(255,255,255,0.15)',
          }}>
            <Flame size={14} /> PROMOTIONAL OFFERS
          </div>

          <h1 style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 'clamp(2rem, 5vw, 3.4rem)',
            color: '#fff', margin: '0 0 16px',
            lineHeight: 1.2,
          }}>
            Exclusive Deals &amp; Bundles
          </h1>
          <p style={{ color: 'var(--color-soft-mint)', fontSize: '1.05rem', maxWidth: 520, margin: '0 0 32px', lineHeight: 1.6 }}>
            Fresh seasonal discounts, handpicked just for you. Limited-time offers updated by our team daily.
          </p>

          {/* Hero stats */}
          <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap' }}>
            {[
              { icon: Tag,     val: `${activeOffers.length}`,    label: 'Active Deals' },
              { icon: Percent, val: totalSavings > 0 ? `Rs. ${totalSavings.toFixed(0)}+` : '—', label: 'Total Savings' },
              { icon: Clock,   val: 'Daily',                     label: 'Updated' },
            ].map(({ icon: Icon, val, label }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ background: 'rgba(255,255,255,0.12)', borderRadius: 10, padding: 8 }}>
                  <Icon size={18} color="var(--color-soft-mint)" />
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '1.2rem', color: '#fff', lineHeight: 1 }}>{val}</div>
                  <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>{label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Main content ─────────────────────────── */}
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '48px 24px 80px' }}>

        {/* Section header + filter */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginBottom: 28 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <Zap size={20} color="var(--color-accent-gold)" />
              <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.8rem', color: 'var(--color-primary-dark)', margin: 0 }}>
                Active Promotional Offers
              </h2>
            </div>
            <p style={{ color: 'var(--color-muted)', fontSize: '0.88rem', margin: 0 }}>
              {activeOffers.length > 0
                ? `${filtered.length} deal${filtered.length !== 1 ? 's' : ''} available${filterCat !== 'All' ? ` in ${filterCat}` : ''}`
                : 'Check back soon for new promotions'}
            </p>
          </div>
        </div>

        {/* Category filters */}
        {categories.length > 1 && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 32 }}>
            {categories.map((cat) => (
              <FilterPill
                key={cat}
                label={cat}
                active={filterCat === cat}
                onClick={() => setFilterCat(cat)}
              />
            ))}
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div style={{
            background: '#fff', borderRadius: 'var(--radius-md)',
            padding: 80, textAlign: 'center',
            border: '1px solid var(--color-border)',
          }}>
            <div style={{
              width: 44, height: 44,
              border: '3px solid var(--color-soft-mint)',
              borderTopColor: 'var(--color-primary)',
              borderRadius: '50%',
              animation: 'spin 0.9s linear infinite',
              margin: '0 auto 16px',
            }} />
            <p style={{ color: 'var(--color-muted)', fontWeight: 500 }}>Loading offers…</p>
          </div>
        ) : filtered.length > 0 ? (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: 24,
          }}>
            {filtered.map(({ offer, product }) => (
              <OfferCard
                key={offer.id}
                offer={offer}
                product={product}
                onQuickView={setQuickViewProduct}
              />
            ))}
          </div>
        ) : (
          <div style={{
            background: '#fff', borderRadius: 'var(--radius-md)',
            padding: 80, textAlign: 'center',
            border: '1px solid var(--color-border)',
          }}>
            <div style={{
              width: 64, height: 64,
              background: 'var(--color-soft-mint)',
              borderRadius: 16,
              display: 'grid', placeItems: 'center',
              margin: '0 auto 20px',
            }}>
              <Gift size={28} color="var(--color-primary)" />
            </div>
            <h3 style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--color-ink-dark)', marginBottom: 8 }}>
              No active promotions right now
            </h3>
            <p style={{ color: 'var(--color-muted)', fontSize: '0.9rem', maxWidth: 380, margin: '0 auto' }}>
              Our team is cooking up amazing deals. Check back soon or explore our full product range.
            </p>
          </div>
        )}

        {/* API-sourced additional offers */}
        <ApiOffersSection />
      </div>

      {/* Quick view modal */}
      {quickViewProduct && (
        <QuickViewModal product={quickViewProduct} onClose={() => setQuickViewProduct(null)} />
      )}

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};
