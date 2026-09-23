import React, { useState, useEffect } from 'react';
import { PackageCheck, AlertTriangle, ClipboardList, Clock, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../services/axiosInstance';

export const StaffDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats]   = useState(null);
  const [loading, setLoading] = useState(true);

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

        <div className="kpi-card">
          <div className="kpi-icon" style={{ background: '#fee2e2', color: '#dc2626' }}>
            <AlertTriangle size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--color-muted)', fontWeight: 600 }}>LOW STOCK WARNINGS</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--color-primary-dark)' }}>—</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-muted)', fontWeight: 600 }}>Inventory API pending</div>
          </div>
        </div>
      </div>
    </div>
  );
};
