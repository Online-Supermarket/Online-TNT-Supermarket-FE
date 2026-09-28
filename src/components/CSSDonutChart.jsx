import React from 'react';

export const CSSDonutChart = ({ data = [] }) => {
  return (
    <div className="chart-card" style={{ textAlign: 'center' }}>
      <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', marginBottom: 20 }}>Order Status Breakdown</h3>

      {data.length === 0 ? <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 160, color: 'var(--color-muted)', fontSize: '0.9rem' }}>No order data available.</div> : <div style={{ display: 'grid', gap: 10, textAlign: 'left' }}>{data.map((item) => <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #eef2f7', paddingBottom: 8 }}><span>{item.label}</span><strong>{item.value}</strong></div>)}</div>}
    </div>
  );
};
