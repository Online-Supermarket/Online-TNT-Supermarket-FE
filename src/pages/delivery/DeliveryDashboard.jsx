import React from 'react';
import { Truck, CheckCircle2, DollarSign } from 'lucide-react';

export const DeliveryDashboard = () => {
  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '2.2rem', color: 'var(--color-primary-dark)' }}>
          Driver Dispatch Dashboard
        </h1>
        <p style={{ color: 'var(--color-muted)' }}>Mobile-optimized delivery tasks, route updates, and daily tips.</p>
      </div>

      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-icon" style={{ background: '#fef08a', color: '#854d0e' }}><Truck size={24} /></div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--color-muted)', fontWeight: 600 }}>ACTIVE DELIVERIES</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--color-primary-dark)' }}>—</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-muted)', fontWeight: 600 }}>Connect API to see data</div>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon" style={{ background: '#dcfce7', color: '#166534' }}><CheckCircle2 size={24} /></div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--color-muted)', fontWeight: 600 }}>COMPLETED TODAY</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--color-primary-dark)' }}>—</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-muted)', fontWeight: 600 }}>Connect API to see data</div>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon" style={{ background: '#dbeafe', color: '#1e40af' }}><DollarSign size={24} /></div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--color-muted)', fontWeight: 600 }}>TODAY'S EARNINGS</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--color-primary-dark)' }}>—</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-muted)', fontWeight: 600 }}>Connect API to see data</div>
          </div>
        </div>
      </div>
    </div>
  );
};
