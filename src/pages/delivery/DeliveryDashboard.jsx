import React, { useState, useEffect } from 'react';
import { Truck, CheckCircle2, DollarSign, RefreshCw } from 'lucide-react';
import axiosInstance from '../../services/axiosInstance';

export const DeliveryDashboard = () => {
  const [activeCount, setActiveCount] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);
  const [earnings, setEarnings] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const data = await axiosInstance.get('/order/rider/orders/assigned');
        const orders = Array.isArray(data) ? data : [];
        
        const active = orders.filter(o => o.status !== 'Delivered').length;
        
        const todayStr = new Date().toLocaleDateString();
        const completedToday = orders.filter(o => 
          o.status === 'Delivered' && new Date(o.createdAt).toLocaleDateString() === todayStr
        ).length;
        
        // Assuming Rs. 150 earned per completed delivery
        const earned = completedToday * 150;
        
        setActiveCount(active);
        setCompletedCount(completedToday);
        setEarnings(earned);
      } catch (err) {
        console.error('Failed to load dashboard data', err);
      } finally {
        setLoading(false);
      }
    };
    loadDashboard();
  }, []);

  return (
    <div>
      <div style={{ marginBottom: 28, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '2.2rem', color: 'var(--color-primary-dark)' }}>
            Driver Dispatch Dashboard
          </h1>
          <p style={{ color: 'var(--color-muted)' }}>Mobile-optimized delivery tasks, route updates, and daily tips.</p>
        </div>
        {loading && <RefreshCw size={24} className="spin" color="var(--color-muted)" />}
      </div>

      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-icon" style={{ background: '#fef08a', color: '#854d0e' }}><Truck size={24} /></div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--color-muted)', fontWeight: 600 }}>ACTIVE DELIVERIES</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--color-primary-dark)' }}>{loading ? '...' : activeCount}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-muted)', fontWeight: 600 }}>{loading ? 'Loading...' : 'Pending or En Route'}</div>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon" style={{ background: '#dcfce7', color: '#166534' }}><CheckCircle2 size={24} /></div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--color-muted)', fontWeight: 600 }}>COMPLETED TODAY</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--color-primary-dark)' }}>{loading ? '...' : completedCount}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-muted)', fontWeight: 600 }}>{loading ? 'Loading...' : 'Total dropped off today'}</div>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon" style={{ background: '#dbeafe', color: '#1e40af' }}><DollarSign size={24} /></div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--color-muted)', fontWeight: 600 }}>TODAY'S EARNINGS</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--color-primary-dark)' }}>{loading ? '...' : `Rs. ${earnings.toFixed(2)}`}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-muted)', fontWeight: 600 }}>{loading ? 'Loading...' : 'Calculated at Rs.150/delivery'}</div>
          </div>
        </div>
      </div>
    </div>
  );
};
