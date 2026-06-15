import React from 'react';

export default function ComicDetailModal({ comic, onClose, onViewSeries, onAddToPicklist }) {
  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          background: 'rgba(0, 0, 0, 0.5)', backdropFilter: 'blur(2px)',
          zIndex: 9998,
        }}
      />
      <div
        style={{
          position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          background: '#fff', borderRadius: '12px', padding: '24px',
          maxWidth: '400px', width: '90vw', zIndex: 9999,
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute', top: '12px', right: '12px',
            background: '#edf2f7', border: 'none', borderRadius: '6px',
            width: '32px', height: '32px', fontSize: '16px', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#4a5568', fontWeight: 'bold',
          }}
        >
          ✕
        </button>

        {/* Cover image */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
          <div style={{
            width: '140px', height: '200px', borderRadius: '8px', overflow: 'hidden',
            background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '1px solid #e2e8f0',
          }}>
            {comic.cover_image ? (
              <img src={comic.cover_image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <span style={{ fontSize: '40px' }}>📘</span>
            )}
          </div>
        </div>

        {/* Comic info */}
        <h3 style={{ margin: '0 0 4px 0', color: '#2d3748', fontSize: '18px', textAlign: 'center' }}>
          {comic.title} #{comic.issue_number}
        </h3>
        <p style={{ margin: '0 0 16px 0', color: '#718096', fontSize: '13px', textAlign: 'center' }}>
          {comic.publisher}
        </p>

        {/* Details grid */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderTop: '1px solid #edf2f7' }}>
            <span style={{ color: '#718096' }}>Barcode</span>
            <span style={{ color: '#2d3748', fontWeight: 'bold', fontFamily: 'monospace' }}>{comic.barcode}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderTop: '1px solid #edf2f7' }}>
            <span style={{ color: '#718096' }}>Est. Value</span>
            <span style={{ color: '#2f855a', fontWeight: 'bold' }}>${comic.estimated_value.toFixed(2)}</span>
          </div>
          {comic.date_scanned && (
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderTop: '1px solid #edf2f7' }}>
              <span style={{ color: '#718096' }}>Scanned</span>
              <span style={{ color: '#4a5568' }}>{new Date(comic.date_scanned).toLocaleDateString()}</span>
            </div>
          )}
        </div>

        {/* Add to Picklist button */}
        <button
          onClick={() => { onAddToPicklist({ title: comic.title, issue_number: comic.issue_number, publisher: comic.publisher }); onClose(); }}
          style={{
            width: '100%', marginTop: '16px', padding: '10px',
            background: '#805ad5', color: '#fff', border: 'none', borderRadius: '8px',
            fontSize: '14px', fontWeight: 'bold', cursor: 'pointer',
          }}
        >
          📋 Add to Picklist
        </button>

        {/* View Series button */}
        <button
          onClick={() => { onClose(); onViewSeries(comic.title, comic.publisher); }}
          style={{
            width: '100%', marginTop: '8px', padding: '10px',
            background: '#3182ce', color: '#fff', border: 'none', borderRadius: '8px',
            fontSize: '14px', fontWeight: 'bold', cursor: 'pointer',
          }}
        >
          📚 View Full Series Run
        </button>
      </div>
    </>
  );
}
