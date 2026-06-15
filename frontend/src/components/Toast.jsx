import React, { useEffect } from 'react';

const COLORS = {
  success: { bg: '#48bb78', border: '#38a169' },
  error: { bg: '#fc8181', border: '#f56565' },
};

export default function Toast({ message, type, onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 2500);
    return () => clearTimeout(timer);
  }, [onClose]);

  const colors = COLORS[type] || COLORS.success;

  return (
    <div
      style={{
        position: 'fixed', top: '20px', left: '50%', transform: 'translateX(-50%)',
        zIndex: 10000,
        background: colors.bg, border: `1px solid ${colors.border}`,
        color: '#fff', padding: '12px 20px', borderRadius: '8px',
        fontSize: '14px', fontWeight: 'bold',
        display: 'flex', alignItems: 'center', gap: '12px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        maxWidth: '90vw',
        pointerEvents: 'auto',
      }}
    >
      <span style={{ flex: 1 }}>{message}</span>
      <button
        onClick={onClose}
        style={{
          background: 'none', border: 'none', color: '#fff',
          cursor: 'pointer', fontWeight: 'bold', fontSize: '16px',
          padding: '0', lineHeight: '1', opacity: '0.8',
        }}
      >
        ✕
      </button>
    </div>
  );
}
