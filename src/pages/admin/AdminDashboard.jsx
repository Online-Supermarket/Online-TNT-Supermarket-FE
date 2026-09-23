import React from 'react';
import { DollarSign, ShoppingCart, Users, AlertTriangle } from 'lucide-react';
import { CSSBarChart } from '../../components/CSSBarChart';
import { CSSDonutChart } from '../../components/CSSDonutChart';

export const AdminDashboard = () => {
  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '2.2rem', color: 'var(--color-primary-dark)' }}>
          Executive Dashboard Overview
        </h1>
        <p style={{ color: 'var(--color-muted)' }}>Real-time sales performance, store fulfillment, and inventory health.</p>
      </div>

      {/* 4 KPI STAT CARDS */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-icon"><DollarSign size={24} /></div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--color-muted)', fontWeight: 600 }}>TOTAL REVENUE</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--color-primary-dark)' }}>—</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-muted)', fontWeight: 600 }}>Connect API to see data</div>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon" style={{ background: '#dbeafe', color: '#1e40af' }}><ShoppingCart size={24} /></div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--color-muted)', fontWeight: 600 }}>TOTAL ORDERS</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--color-primary-dark)' }}>—</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-muted)', fontWeight: 600 }}>Connect API to see data</div>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon" style={{ background: '#fef3c7', color: '#b45309' }}><Users size={24} /></div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--color-muted)', fontWeight: 600 }}>ACTIVE CUSTOMERS</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--color-primary-dark)' }}>—</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-muted)', fontWeight: 600 }}>Connect API to see data</div>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon" style={{ background: '#fee2e2', color: '#dc2626' }}><AlertTriangle size={24} /></div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--color-muted)', fontWeight: 600 }}>LOW STOCK ALERTS</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--color-primary-dark)' }}>—</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-muted)', fontWeight: 600 }}>Connect API to see data</div>
          </div>
        </div>
      </div>

      {/* CSS CHARTS SECTION */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 24, marginBottom: 32 }}>
        <CSSBarChart />
        <CSSDonutChart />
      </div>

      {/* RECENT ORDERS DATA TABLE */}
      <div style={{ background: '#ffffff', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: 24, boxShadow: 'var(--shadow-sm)' }}>
        <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.3rem', marginBottom: 16 }}>Recent Customer Orders</h3>
        <table className="data-table">
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Customer</th>
              <th>Total</th>
              <th>Status</th>
              <th>Time</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={5} style={{ textAlign: 'center', padding: 32, color: 'var(--color-muted)' }}>
                No recent orders to display.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};
