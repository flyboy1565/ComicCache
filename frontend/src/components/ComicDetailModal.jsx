import React, { memo } from 'react';
import ComicBubbleIcon from './ComicBubbleIcon';

const ComicDetailModal = memo(function ComicDetailModal({ comic, onClose, onViewSeries, onAddToPicklist }) {
  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          background: 'rgba(0, 0, 0, 0.5)', backdropFilter: 'blur(2px)',
          zIndex: 10001,
        }}
      />
      <div
        style={{
          position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          background: '#fff', borderRadius: '12px', padding: '24px',
          maxWidth: '400px', width: '90vw', zIndex: 10002,
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
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px', position: 'relative' }}>
          <div style={{
            width: '140px', height: '200px', borderRadius: '8px', overflow: 'hidden',
            background: comic.cover_status === 'cached' ? '#e2e8f0'
              : comic.cover_status === 'pending' ? 'rgba(237, 137, 54, 0.15)'
              : '#fed7d7',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: comic.cover_status === 'not_found' ? '1px dashed #e53e3e' : '1px solid #e2e8f0',
          }}>
            {comic.cover_image ? (
              <img src={comic.cover_image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : comic.cover_status === 'pending' ? (
              <span style={{ fontSize: '24px', opacity: 0.6 }}>⏳</span>
            ) : (
              <ComicBubbleIcon size={40} color="#e53e3e" />
            )}
          </div>
          {comic.cover_status && comic.cover_status !== 'cached' && (
            <span style={{
              position: 'absolute', bottom: '-4px', left: '50%', transform: 'translateX(-50%)',
              fontSize: '10px', fontWeight: 'bold', padding: '2px 8px', borderRadius: '4px',
              background: comic.cover_status === 'pending' ? '#dd6b20' : '#e53e3e',
              color: '#fff', whiteSpace: 'nowrap',
            }}>
              {comic.cover_status === 'pending' ? 'FETCHING' : 'NOT FOUND'}
            </span>
          )}
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

        {/* Interest count — shows for missing/not_found items */}
        {comic.cover_status === 'not_found' && comic.interest_count > 0 && (
          <div style={{
            marginTop: '16px', padding: '10px 14px', borderRadius: '8px',
            background: '#fef3c7', border: '1px solid #f59e0b',
            fontSize: '13px', color: '#92400e', textAlign: 'center',
          }}>
            🔍 Requested <strong>{comic.interest_count}</strong> time{comic.interest_count !== 1 ? 's' : ''} — potential re-order opportunity
          </div>
        )}

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
});

export default ComicDetailModal;
