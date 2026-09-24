import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Truck, ShieldCheck, Clock, Award, ArrowRight, Sparkles, CheckCircle2, Send } from 'lucide-react';
import { ProductCard } from '../../components/ProductCard';
import axiosInstance from '../../services/axiosInstance';

export const HomePage = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    // Fetch active products from real catalog API (backend sorts by name, take first 4 for homepage)
    axiosInstance.get('/catalog/products')
      .then((data) => {
        const items = Array.isArray(data) ? data : (data?.items || []);
        if (items.length > 0) setProducts(items.slice(0, 4));
      })
      .catch(() => {});

    axiosInstance.get('/catalog/categories')
      .then((data) => {
        if (data && data.length > 0) {
          setCategories(data.map((c) => ({
            id: c.id,
            name: c.name,
            description: c.description,
            imageUrl: c.imageUrl || c.image_url,
            icon: c.name.includes('Produce') ? '🥬' : c.name.includes('Bakery') ? '🍞' : '🍎',
            count: 'Fresh Batch',
          })));
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div>
      {/* 1. HERO SECTION */}
      <section style={{ background: 'linear-gradient(180deg, var(--color-soft-mint) 0%, var(--color-bg-body) 100%)' }}>
        <div className="hero-wrapper">
          <div className="hero-content">
            <div className="kicker-badge">
              <Sparkles size={16} />
              WELCOME TO TNT SUPERMARKET
            </div>
            <h1 className="hero-headline">
              Fresh groceries, <br />
              <em>delivered happy.</em>
            </h1>
            <p className="hero-subtext">
              From farm-fresh produce to everyday artisanal essentials, discover quality groceries brought directly to your doorstep with express care.
            </p>
            <div className="hero-buttons">
              <Link to="/categories" className="btn btn-primary">
                Shop catalog <ArrowRight size={18} />
              </Link>
              <Link to="/offers" className="btn btn-outline">
                View weekly offers
              </Link>
            </div>
          </div>

          <div className="hero-visual">
            <div className="hero-image-box">
              <img src="/hero.jpg" alt="TNT Fresh Produce" />
            </div>

            {/* Floating Badge 1 */}
            <div className="floating-badge-card badge-card-1">
              <div className="badge-icon-box">🌿</div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>Always Fresh</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-muted)' }}>100% Quality Checked</div>
              </div>
            </div>

            {/* Floating Badge 2 */}
            <div className="floating-badge-card badge-card-2">
              <div className="badge-icon-box">⚡</div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>Order Confirmed</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-muted)' }}>Arriving in 28 mins</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. BENEFIT STRIP */}
      <section className="benefit-strip">
        <div className="benefit-card">
          <div className="benefit-icon"><Truck size={24} /></div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>Free Express Delivery</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--color-muted)' }}>On orders over Rs. 50</div>
          </div>
        </div>
        <div className="benefit-card">
          <div className="benefit-icon"><Clock size={24} /></div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>Same-Day Delivery</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--color-muted)' }}>Guaranteed 30-min window</div>
          </div>
        </div>
        <div className="benefit-card">
          <div className="benefit-icon"><ShieldCheck size={24} /></div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>Secure Checkout</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--color-muted)' }}>100% Encrypted payments</div>
          </div>
        </div>
        <div className="benefit-card">
          <div className="benefit-icon"><Award size={24} /></div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>24/7 Support</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--color-muted)' }}>Dedicated service team</div>
          </div>
        </div>
      </section>

      {/* 3. CATEGORIES SHOWCASE */}
      {categories.length > 0 && (
        <section style={{ maxWidth: 1280, margin: '0 auto 60px', padding: '0 24px' }}>
          <h2 className="section-title">Explore Fresh Categories</h2>
          <div className="category-grid">
            {categories.map((cat) => (
              <Link key={cat.id} to={`/categories?cat=${cat.id}`} className="category-card" style={{ overflow: 'hidden', padding: 0 }}>
                {cat.imageUrl ? (
                  <div style={{ height: 110, width: '100%', overflow: 'hidden', background: 'var(--color-soft-mint)' }}>
                    <img
                      src={cat.imageUrl}
                      alt={cat.name}
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        if (e.currentTarget.nextSibling) e.currentTarget.nextSibling.style.display = 'block';
                      }}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    <div style={{ display: 'none', padding: '24px 0', textAlign: 'center', fontSize: '2rem' }}>{cat.icon}</div>
                  </div>
                ) : (
                  <div className="category-icon" style={{ fontSize: '2rem', padding: '16px 0' }}>{cat.icon}</div>
                )}
                <div style={{ padding: '12px 16px 16px' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 4 }}>{cat.name}</h3>
                  <span style={{ fontSize: '0.8rem', color: 'var(--color-muted)' }}>
                    {cat.description ? (cat.description.length > 50 ? `${cat.description.slice(0, 50)}...` : cat.description) : cat.count}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* 4. FEATURED PRODUCTS GRID */}
      {products.length > 0 && (
        <section style={{ maxWidth: 1280, margin: '0 auto 60px', padding: '0 24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24 }}>
            <div>
              <h2 className="section-title" style={{ marginBottom: 4 }}>Curated Harvest Specials</h2>
              <p style={{ color: 'var(--color-muted)', fontSize: '0.95rem' }}>Handpicked organic produce delivered fresh today.</p>
            </div>
            <Link to="/categories" className="btn btn-outline">View all items →</Link>
          </div>

          <div className="products-grid">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      {/* 5. WHY CHOOSE US STORY */}
      <section style={{ background: '#ffffff', borderTop: '1px solid var(--color-border)', borderBottom: '1px solid var(--color-border)', padding: '60px 24px', marginBottom: 60 }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48, alignItems: 'center' }}>
          <div>
            <span className="kicker-badge">OUR FARM PROMISE</span>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '2.4rem', color: 'var(--color-primary-dark)', marginBottom: 20 }}>
              Direct from local soil to your family table.
            </h2>
            <p style={{ color: 'var(--color-muted)', fontSize: '1.05rem', lineHeight: 1.7, marginBottom: 24 }}>
              At TNT Supermarket, we partner exclusively with certified organic regional farmers. Every leaf, fruit, and bakery loaf is quality checked before packed.
            </p>

            <div style={{ display: 'grid', gap: 16 }}>
              <div style={{ display: 'flex', gap: 12 }}>
                <CheckCircle2 color="var(--color-primary)" size={22} />
                <div>
                  <h4 style={{ fontWeight: 700, fontSize: '1rem' }}>Zero Pesticide Hydroponic Greens</h4>
                  <p style={{ fontSize: '0.875rem', color: 'var(--color-muted)' }}>Grown under climate-monitored green tech facilities.</p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 12 }}>
                <CheckCircle2 color="var(--color-primary)" size={22} />
                <div>
                  <h4 style={{ fontWeight: 700, fontSize: '1rem' }}>Cold-Chain Refrigerated Vans</h4>
                  <p style={{ fontSize: '0.875rem', color: 'var(--color-muted)' }}>Temperature integrity maintained right to your doorstep.</p>
                </div>
              </div>
            </div>
          </div>

          <div style={{ background: 'var(--color-soft-mint)', borderRadius: 'var(--radius-lg)', padding: 40, border: '1px solid var(--color-border)' }}>
            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.8rem', color: 'var(--color-primary-dark)', marginBottom: 16 }}>
              Join 10,000+ Happy Households
            </h3>
            <p style={{ color: 'var(--color-muted)', marginBottom: 24 }}>
              Subscribe to weekly grocery baskets and save up to 20% on all recurring produce orders.
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <input
                type="email"
                placeholder="Enter your email address..."
                style={{ flex: 1, padding: '12px 16px', borderRadius: 'var(--radius-full)', border: '1px solid var(--color-border)', outline: 'none' }}
              />
              <button className="btn btn-primary"><Send size={16} /> Join</button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
