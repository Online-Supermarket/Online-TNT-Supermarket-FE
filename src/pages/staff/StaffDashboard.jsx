import React, { useState, useEffect } from 'react';
import { PackageCheck, AlertTriangle, ClipboardList, Clock, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../services/axiosInstance';

export const StaffDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [invSummary, setInvSummary] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await axiosInstance.get('/order/staff/orders');
        const list = Array.isArray(data) ? data : [];
        setStats({
          pending:   list.filter(o => o.status === 'PendingReservation').length,
          confirmed: list.filter(o => o.status === 'Confirmed').length,
          total:     list.length,
        });
      } catch {
        setStats({ pending: '—', confirmed: '—', total: '—' });
      } finally {
        setLoading(false);
      }
    })();
    // Also fetch inventory summary for Low Stock KPI
    (async () => {
      try {
        const s = await axiosInstance.get('/inventory/summary');
        setInvSummary(s);
      } catch { /* non-fatal */ }
    })();
  }, []);

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '2.2rem', color: 'var(--color-primary-dark)' }}>
          Staff Operations Center
        </h1>
        <p style={{ color: 'var(--color-muted)' }}>Live packing queue overview and order status summary.</p>
      </div>

      <div className="kpi-grid">
        <div className="kpi-card" style={{ cursor: 'pointer' }} onClick={() => navigate('/staff/orders')}>
          <div className="kpi-icon" style={{ background: '#dbeafe', color: '#1e40af' }}>
            <ClipboardList size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--color-muted)', fontWeight: 600 }}>PACKING QUEUE</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--color-primary-dark)' }}>
              {loading ? <RefreshCw size={18} className="spin" /> : stats?.confirmed ?? '—'}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-muted)', fontWeight: 600 }}>Confirmed orders to pack</div>
          </div>
        </div>

        <div className="kpi-card" style={{ cursor: 'pointer' }} onClick={() => navigate('/staff/orders')}>
          <div className="kpi-icon" style={{ background: '#dcfce7', color: '#166534' }}>
            <PackageCheck size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--color-muted)', fontWeight: 600 }}>TOTAL ORDERS</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--color-primary-dark)' }}>
              {loading ? <RefreshCw size={18} className="spin" /> : stats?.total ?? '—'}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-muted)', fontWeight: 600 }}>All time orders in system</div>
          </div>
        </div>

        <div className="kpi-card" style={{ cursor: 'pointer' }} onClick={() => navigate('/staff/orders')}>
          <div className="kpi-icon" style={{ background: '#fef3c7', color: '#92400e' }}>
            <Clock size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--color-muted)', fontWeight: 600 }}>AWAITING STOCK</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--color-primary-dark)' }}>
              {loading ? <RefreshCw size={18} className="spin" /> : stats?.pending ?? '—'}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-muted)', fontWeight: 600 }}>Pending reservation</div>
          </div>
        </div>

        <div className="kpi-card" style={{ cursor: 'pointer' }} onClick={() => navigate('/staff/inventory')}>
          <div className="kpi-icon" style={{ background: '#fee2e2', color: '#dc2626' }}>
            <AlertTriangle size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--color-muted)', fontWeight: 600 }}>LOW STOCK</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: invSummary?.lowStockCount > 0 ? '#dc2626' : 'var(--color-primary-dark)' }}>
              {invSummary === null ? <RefreshCw size={18} className="spin" /> : (invSummary?.lowStockCount ?? '—')}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-muted)', fontWeight: 600 }}>Products below reorder level</div>
          </div>
        </div>
      </div>

      {/* Quick Access Modules */}
      <div style={{ marginTop: 32 }}>
        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.4rem', color: 'var(--color-primary-dark)', marginBottom: 16 }}>
          Staff Operations Modules
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
          <div
            onClick={() => navigate('/staff/products')}
            style={{ background: '#fff', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: 20, cursor: 'pointer', boxShadow: 'var(--shadow-sm)', transition: 'all 0.2s ease' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
              <div style={{ background: '#eff6ff', color: '#2563eb', padding: 8, borderRadius: 8 }}>
                <PackageCheck size={22} />
              </div>
              <div style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--color-primary-dark)' }}>Product Catalog</div>
            </div>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-muted)' }}>
              Add, edit, price, and activate/deactivate store products.
            </p>
          </div>

          <div
            onClick={() => navigate('/staff/categories')}
            style={{ background: '#fff', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: 20, cursor: 'pointer', boxShadow: 'var(--shadow-sm)', transition: 'all 0.2s ease' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
              <div style={{ background: '#fdf4ff', color: '#c026d3', padding: 8, borderRadius: 8 }}>
                <PackageCheck size={22} />
              </div>
              <div style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--color-primary-dark)' }}>Categories</div>
            </div>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-muted)' }}>
              Organize departments, banners, and product classifications.
            </p>
          </div>

          <div
            onClick={() => navigate('/staff/inventory')}
            style={{ background: '#fff', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: 20, cursor: 'pointer', boxShadow: 'var(--shadow-sm)', transition: 'all 0.2s ease' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
              <div style={{ background: '#f0fdf4', color: '#16a34a', padding: 8, borderRadius: 8 }}>
                <AlertTriangle size={22} />
              </div>
              <div style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--color-primary-dark)' }}>Inventory Management</div>
            </div>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-muted)' }}>
              Add, remove, adjust shelf stock, view history & replenishment.
            </p>
          </div>

          <div
            onClick={() => navigate('/staff/orders')}
            style={{ background: '#fff', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: 20, cursor: 'pointer', boxShadow: 'var(--shadow-sm)', transition: 'all 0.2s ease' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
              <div style={{ background: '#fef3c7', color: '#d97706', padding: 8, borderRadius: 8 }}>
                <ClipboardList size={22} />
              </div>
              <div style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--color-primary-dark)' }}>Packing Queue</div>
            </div>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-muted)' }}>
              Pick, pack, and prepare confirmed grocery customer orders.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
