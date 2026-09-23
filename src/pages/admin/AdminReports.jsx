import React from 'react';
import { Download, BarChart3 } from 'lucide-react';
import { CSSBarChart } from '../../components/CSSBarChart';

export const AdminReports = () => {
  const downloadCsv = () => {
    alert('Export functionality requires API integration. No data available to export.');
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '2.2rem', color: 'var(--color-primary-dark)' }}>
            Financial & Sales Analytics
          </h1>
          <p style={{ color: 'var(--color-muted)' }}>Export monthly revenue breakdown and order volume logs.</p>
        </div>

        <button className="btn btn-primary" onClick={downloadCsv}>
          <Download size={18} /> Export Sales CSV
        </button>
      </div>

      <CSSBarChart />
    </div>
  );
};
