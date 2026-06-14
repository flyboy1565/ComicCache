import React from 'react';

export default function ValuationSummary({ valuation }) {
  return (
    <div style={{ marginBottom: '25px', padding: '15px', background: '#ebf8ff', borderRadius: '6px', border: '1px solid #bee3f8' }}>
      <h4 style={{ margin: '0 0 10px 0' }}>📈 Container Valuation Summary</h4>
      <p><strong>Total Items Listed:</strong> {valuation.total_comics} books</p>
      <p><strong>Total Store Invested Capital (COGS):</strong> ${valuation.financials.total_store_cost_cogs}</p>
      <p><strong>Current Fair Market Capitalization:</strong> ${valuation.financials.total_estimated_retail_value}</p>
      <p><strong>Projected Gross Margins:</strong> ${valuation.financials.potential_profit}</p>
    </div>
  );
}