import { Package, ShoppingBag, Store, UserRound } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PageHeader } from '../../components/Ui';
import { useAuth } from '../../context/AuthContext';

/**
 * Sprint 1 Seller Dashboard.
 *
 * Displays welcome / account information for a verified Seller.
 * Store Management and Product Management are deferred to Sprint 2.
 */
export default function SellerDashboard() {
  const { user, logout } = useAuth();

  const displayName = user?.fullName || user?.name || 'Seller';
  const email       = user?.email    || '—';
  const phone       = user?.phone    || user?.phoneNumber || '—';

  return (
    <>
      <PageHeader
        eyebrow="Seller portal"
        title={`Welcome, ${displayName.split(' ')[0]}.`}
        description="Manage your store and products from this dashboard."
      />

      {/* ── Account summary ───────────────────────────────────────── */}
      <section className="panel profile-layout" style={{ marginBottom: 24 }}>
        <div className="panel-head">
          <div>
            <h2>Seller account</h2>
            <p>Your profile information registered with TNT Supermarket.</p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start', padding: '0 24px 24px', flexWrap: 'wrap' }}>
          {/* Avatar */}
          <div className="profile-avatar" style={{ flexShrink: 0 }}>
            <UserRound size={36} />
          </div>

          {/* Details */}
          <dl style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '8px 24px', flex: 1, minWidth: 200 }}>
            <dt style={{ fontWeight: 600, color: 'var(--text-muted, #64748b)', fontSize: '0.85rem' }}>Full name</dt>
            <dd>{displayName}</dd>

            <dt style={{ fontWeight: 600, color: 'var(--text-muted, #64748b)', fontSize: '0.85rem' }}>Email</dt>
            <dd>{email}</dd>

            <dt style={{ fontWeight: 600, color: 'var(--text-muted, #64748b)', fontSize: '0.85rem' }}>Phone</dt>
            <dd>{phone}</dd>

            <dt style={{ fontWeight: 600, color: 'var(--text-muted, #64748b)', fontSize: '0.85rem' }}>Role</dt>
            <dd>
              <span className="status status-active">Seller</span>
            </dd>
          </dl>
        </div>
      </section>

      {/* ── Coming-in Sprint 2 placeholder cards ──────────────────── */}
      <div className="stats-grid">
        <article className="stat-card" style={{ opacity: 0.55 }}>
          <span className="stat-icon blue"><Store /></span>
          <div>
            <p>Store management</p>
            <h3>Coming soon</h3>
            <small>Available in Sprint 2</small>
          </div>
        </article>

        <article className="stat-card" style={{ opacity: 0.55 }}>
          <span className="stat-icon purple"><Package /></span>
          <div>
            <p>Product management</p>
            <h3>Coming soon</h3>
            <small>Available in Sprint 2</small>
          </div>
        </article>

        <article className="stat-card" style={{ opacity: 0.55 }}>
          <span className="stat-icon orange"><ShoppingBag /></span>
          <div>
            <p>Orders &amp; sales</p>
            <h3>Coming soon</h3>
            <small>Available in Sprint 2</small>
          </div>
        </article>
      </div>

      {/* ── Sprint 2 notice ───────────────────────────────────────── */}
      <section className="panel" style={{ marginTop: 24 }}>
        <div className="panel-head">
          <div>
            <h2>What's next — Sprint 2</h2>
            <p>The following features will be available after Sprint 2 is completed.</p>
          </div>
        </div>

        <ul style={{ padding: '0 24px 24px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[
            'Create and manage your store profile',
            'List, edit, and remove products',
            'Set pricing, discounts, and stock levels',
            'View and process incoming orders',
            'Track sales analytics and revenue',
          ].map((item) => (
            <li key={item} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ color: 'var(--text-muted, #94a3b8)' }}>○</span>
              <span style={{ color: 'var(--text-muted, #64748b)' }}>{item}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* ── Actions ──────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 12, marginTop: 24, paddingBottom: 12 }}>
        <Link to="/seller/profile" className="btn btn-outline">Edit profile</Link>
        <button className="btn btn-light" onClick={logout}>Sign out</button>
      </div>
    </>
  );
}
