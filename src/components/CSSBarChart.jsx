import React from 'react';

export const CSSBarChart = ({ data = [] }) => {
  const maxValue = data.length > 0 ? Math.max(...data.map(d => d.value)) : 0;

  return (
    <div className="chart-card">
      <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', marginBottom: 16 }}>Weekly Revenue Growth (Rs.)</h3>
      {data.length === 0 ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 160, color: 'var(--color-muted)', fontSize: '0.9rem' }}>
          No chart data available.
        </div>
      ) : (
        <div className="css-bar-chart">
          {data.map((item, idx) => {
            const heightPercent = (item.value / maxValue) * 100;
            return (
              <div key={idx} className="bar-column">
                <div
                  className="bar-fill"
                  style={{ height: `${heightPercent}%` }}
                  title={`Rs. ${item.value * 120}`}
                />
                <span className="bar-label">{item.label}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
