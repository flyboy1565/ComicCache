// src/components/SeriesVolumeViewer.jsx
import React, { useEffect, useState } from 'react';
import { fetchSeriesOverview } from '../utilities/api';

export default function SeriesVolumeViewer({ title, publisher, onClose }) {
  const [seriesData, setSeriesData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // 💡 Filter state: 'all' | 'have' | 'missing'
  const [filterMode, setFilterMode] = useState('all');

  useEffect(() => {
    if (!title || !publisher) return;
    setLoading(true);
    fetchSeriesOverview(title, publisher)
      .then(data => {
        setSeriesData(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [title, publisher]);

  if (!title || !publisher) return null;

  // 💡 Filter processing logic
  const filteredTimeline = seriesData?.timeline.filter(item => {
    if (filterMode === 'have') return item.status === 'in_stock';
    if (filterMode === 'missing') return item.status !== 'in_stock';
    return true; // 'all'
  }) || [];

  return (
    <>
      {/* BACKGROUND OVERLAY BLUR CLOAK */}
      <div 
        onClick={onClose}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(0, 0, 0, 0.4)',
          backdropFilter: 'blur(2px)',
          zIndex: 9998,
        }}
      />

      {/* RIGHT SIDE SLIDE-OUT PANEL */}
      <div style={{
        position: 'fixed',
        top: 0,
        right: 0,
        width: '420px',
        maxWidth: '90vw',
        height: '100vh',
        background: '#1a202c', // Hardened matching dark theme canvas background
        boxShadow: '-4px 0 25px rgba(0, 0, 0, 0.3)',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'system-ui, sans-serif',
        color: '#fff'
      }}>
        
        {/* TOP HEADER CONTAINER */}
        <div style={{ padding: '20px', borderBottom: '1px solid #2d3748', background: '#232d3f' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span style={{ fontSize: '11px', color: '#a0aec0',委员fontWeight: '800', textTransform: 'uppercase', tracking: 'wide' }}>
                {publisher} COLLECTION
              </span>
              <h2 style={{ margin: '4px 0 0 0', fontSize: '20px', color: '#fff', fontWeight: '700' }}>
                {title}
              </h2>
            </div>
            <button 
              onClick={onClose}
              style={{ background: '#2d3748', border: 'none', padding: '6px 10px', borderRadius: '6px', fontSize: '16px', cursor: 'pointer', color: '#a0aec0', fontWeight: 'bold' }}
            >
              ✕
            </button>
          </div>

          {/* INTERACTIVE METRIC FILTER COUNTERS */}
          {seriesData && (
            <div style={{ display: 'flex', gap: '10px', marginTop: '15px', alignItems: 'center' }}>
              
              {/* HAVE BADGE BUTTON */}
              <button
                onClick={() => setFilterMode(filterMode === 'have' ? 'all' : 'have')}
                style={{
                  border: 'none',
                  background: filterMode === 'have' ? '#2f855a' : '#234e52',
                  color: '#e6fffa',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  cursor: 'pointer',
                  fontWeight: filterMode === 'have' ? 'bold' : 'normal',
                  outline: filterMode === 'have' ? '2px solid #48bb78' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                🟩 Have: {seriesData.total_owned}
                {filterMode === 'have' && <span style={{ fontSize: '10px', marginLeft: '2px' }}>✕</span>}
              </button>

              {/* MISSING BADGE BUTTON */}
              <button
                onClick={() => setFilterMode(filterMode === 'missing' ? 'all' : 'missing')}
                style={{
                  border: 'none',
                  background: filterMode === 'missing' ? '#9b2c2c' : '#742a2a',
                  color: '#fff5f5',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  cursor: 'pointer',
                  fontWeight: filterMode === 'missing' ? 'bold' : 'normal',
                  outline: filterMode === 'missing' ? '2px solid #f56565' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                🟥 Missing: {seriesData.total_missing}
                {filterMode === 'missing' && <span style={{ fontSize: '10px', marginLeft: '2px' }}>✕</span>}
              </button>

              {/* CASH WORTH VALUE CONTAINER */}
              <div style={{ background: '#2d3748', color: '#cbd5e0', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', marginLeft: 'auto' }}>
                Value: <strong style={{ color: '#68d391' }}>${seriesData.total_series_value.toFixed(2)}</strong>
              </div>
            </div>
          )}

          {/* ACTIVE FILTER DISMISSAL STRIP */}
          {filterMode !== 'all' && (
            <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#2d3748', padding: '6px 10px', borderRadius: '4px', fontSize: '11px' }}>
              <span style={{ color: '#cbd5e0' }}>
                Showing only <strong>{filterMode.toUpperCase()}</strong> variants ({filteredTimeline.length} items)
              </span>
              <button 
                onClick={() => setFilterMode('all')}
                style={{ background: 'none', border: 'none', color: '#fc8181', cursor: 'pointer', fontWeight: 'bold', padding: 0 }}
              >
                Clear Filter ✕
              </button>
            </div>
          )}
        </div>

        {/* VERTICAL SCROLLABLE TRACK */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px', background: '#1a202c' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#718096', fontSize: '14px' }}>
              Parsing series history checklist...
            </div>
          ) : filteredTimeline.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#a0aec0', fontSize: '13px', fontStyle: 'italic' }}>
              No issues match this filter view state.
            </div>
          ) : (
            filteredTimeline.map((item) => {
              const hasBook = item.status === 'in_stock';
              
              return (
                <div 
                  key={item.id}
                  style={{
                    display: 'flex',
                    background: '#2d3748',
                    border: '1px solid #4a5568',
                    borderRadius: '8px',
                    padding: '12px',
                    alignItems: 'center',
                    gap: '12px',
                    opacity: hasBook ? 1 : 0.65
                  }}
                >
                  {/* COVER PORTRAIT THUMBNAIL */}
                  <div style={{ 
                    width: '50px', 
                    height: '72px', 
                    background: '#1a202c', 
                    borderRadius: '4px', 
                    overflow: 'hidden', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    flexShrink: 0,
                    border: hasBook ? '1px solid #4a5568' : '1px dashed #e53e3e'
                  }}>
                    {hasBook && item.cover_image ? (
                      <img src={item.cover_image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <span style={{ fontSize: '16px', fontWeight: 'bold', color: hasBook ? '#718096' : '#e53e3e' }}>
                        🕵️‍♂️
                      </span>
                    )}
                  </div>

                  {/* META LABELS */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                      <span style={{ 
                        fontSize: '10px', 
                        fontWeight: 'bold', 
                        color: '#fff', 
                        background: hasBook ? '#38a169' : '#e53e3e', 
                        padding: '2px 6px', 
                        borderRadius: '4px' 
                      }}>
                        {hasBook ? 'HAVE' : 'MISSING'}
                      </span>
                      <strong style={{ fontSize: '15px', color: '#fff' }}>
                        Issue #{item.issue_number}
                      </strong>
                    </div>
                    
                    <div style={{ fontSize: '12px', color: '#a0aec0', marginTop: '6px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {hasBook ? `📦 ${item.box_name}` : 'Not registered in vault inventory'}
                    </div>
                  </div>

                  {/* FINANCIAL MARKERS */}
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: '11px', color: '#718096', fontWeight: 'bold' }}>
                      QTY: {hasBook ? '1' : '0'}
                    </div>
                    <div style={{ 
                      fontSize: '14px', 
                      fontWeight: 'bold', 
                      color: hasBook ? '#48bb78' : '#718096',
                      marginTop: '4px' 
                    }}>
                      ${hasBook ? item.estimated_value.toFixed(2) : '0.00'}
                    </div>
                  </div>

                </div>
              );
            })
          )}
        </div>

      </div>
    </>
  );
}