import React from 'react';

export const CSSDonutChart = () => {
  return (
    <div className="chart-card" style={{ textAlign: 'center' }}>
      <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', marginBottom: 20 }}>Sales by Category</h3>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 160, color: 'var(--color-muted)', fontSize: '0.9rem' }}>
        No chart data available.
      </div>
    </div>
  );
};
