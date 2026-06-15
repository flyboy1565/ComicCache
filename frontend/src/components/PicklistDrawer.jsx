import React, { useEffect, useState } from 'react';
import { fetchPicklist, removeFromPicklist, updatePicklistItem, clearPicklist } from '../utilities/api';

const STORAGE_KEY = 'comiccache_picklist';

function loadCached() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function saveCache(items) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(items)); } catch {}
}

export default function PicklistDrawer({ onClose, showToast }) {
  const cached = loadCached();
  const [items, setItems] = useState(cached || []);
  const [loading, setLoading] = useState(true);

  const loadItems = () => {
    setLoading(true);
    fetchPicklist()
      .then(data => { setItems(data); setLoading(false); saveCache(data); })
      .catch(err => { console.error(err); setLoading(false); });
  };

  useEffect(() => { loadItems(); }, []);

  const handleRemove = async (id) => {
    try {
      await removeFromPicklist(id);
      const next = items.filter(i => i.id !== id);
      setItems(next);
      saveCache(next);
    } catch (e) { console.error(e); }
  };

  const handleToggleStatus = async (item) => {
    const newStatus = item.status === 'pending' ? 'found' : 'pending';
    try {
      const updated = await updatePicklistItem(item.id, { status: newStatus });
      const next = items.map(i => i.id === item.id ? updated : i);
      setItems(next);
      saveCache(next);
    } catch (e) { console.error(e); }
  };

  const handleClearAll = async () => {
    if (!window.confirm('Clear the entire picklist?')) return;
    try {
      await clearPicklist();
      setItems([]);
      saveCache([]);
      showToast('Picklist cleared');
    } catch (e) {
      console.error(e);
      showToast('Failed to clear picklist', 'error');
    }
  };

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          background: 'rgba(0, 0, 0, 0.4)', backdropFilter: 'blur(2px)', zIndex: 9998,
        }}
      />
      <div style={{
        position: 'fixed', top: 0, right: 0, width: '420px', maxWidth: '90vw',
        height: '100vh', background: '#1a202c',
        boxShadow: '-4px 0 25px rgba(0, 0, 0, 0.3)', zIndex: 9999,
        display: 'flex', flexDirection: 'column',
        fontFamily: 'system-ui, sans-serif', color: '#fff',
      }}>
        {/* Header */}
        <div style={{ padding: '20px', borderBottom: '1px solid #2d3748', background: '#232d3f' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span style={{ fontSize: '11px', color: '#a0aec0', fontWeight: '800', textTransform: 'uppercase' }}>
                📋 WANT LIST
              </span>
              <h2 style={{ margin: '4px 0 0 0', fontSize: '20px', color: '#fff', fontWeight: '700' }}>
                Picklist ({items.length})
              </h2>
            </div>
            <button
              onClick={onClose}
              style={{ background: '#2d3748', border: 'none', padding: '6px 10px', borderRadius: '6px', fontSize: '16px', cursor: 'pointer', color: '#a0aec0', fontWeight: 'bold' }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Items */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px', background: '#1a202c' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#718096', fontSize: '14px' }}>
              Loading picklist...
            </div>
          ) : items.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#a0aec0', fontSize: '13px', fontStyle: 'italic' }}>
              No items in picklist yet.
              <div style={{ marginTop: '8px', fontSize: '12px', color: '#718096' }}>
                Browse a box and add comics you're looking for!
              </div>
            </div>
          ) : (
            items.map(item => (
              <div key={item.id} style={{
                display: 'flex', flexDirection: 'column', gap: '8px',
                background: '#2d3748', border: '1px solid #4a5568',
                borderRadius: '8px', padding: '12px',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 'bold', fontSize: '14px', color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {item.title} #{item.issue_number}
                    </div>
                    <div style={{ fontSize: '11px', color: '#a0aec0', marginTop: '2px' }}>
                      {item.publisher}
                    </div>
                  </div>
                  <span style={{
                    fontSize: '10px', fontWeight: 'bold', padding: '2px 8px', borderRadius: '4px',
                    background: item.status === 'found' ? '#2f855a' : '#9b2c2c',
                    color: '#fff', whiteSpace: 'nowrap', marginLeft: '8px',
                  }}>
                    {item.status === 'found' ? 'FOUND' : 'LOOKING'}
                  </span>
                </div>

                {item.notes && (
                  <div style={{ fontSize: '12px', color: '#cbd5e0', fontStyle: 'italic' }}>
                    {item.notes}
                  </div>
                )}

                <div style={{ fontSize: '11px', color: '#718096' }}>
                  Added {new Date(item.date_added).toLocaleDateString()}
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
                  <button
                    onClick={() => handleToggleStatus(item)}
                    style={{
                      flex: 1, padding: '6px', borderRadius: '6px', border: 'none',
                      fontSize: '12px', fontWeight: 'bold', cursor: 'pointer',
                      background: item.status === 'found' ? '#744210' : '#2f855a',
                      color: '#fff',
                    }}
                  >
                    {item.status === 'found' ? '↩ Mark Looking' : '✓ Mark Found'}
                  </button>
                  <button
                    onClick={() => handleRemove(item.id)}
                    style={{
                      padding: '6px 12px', borderRadius: '6px', border: 'none',
                      fontSize: '12px', fontWeight: 'bold', cursor: 'pointer',
                      background: '#9b2c2c', color: '#fff',
                    }}
                  >
                    ✕ Remove
                  </button>
                </div>
              </div>
            ))
          )}

          {/* Clear All button */}
          {items.length > 0 && (
            <button
              onClick={handleClearAll}
              style={{
                width: '100%', padding: '10px', marginTop: '10px',
                borderRadius: '8px', border: '1px solid #9b2c2c',
                background: 'transparent', color: '#fc8181',
                fontSize: '13px', fontWeight: 'bold', cursor: 'pointer',
              }}
            >
              🗑 Clear All ({items.length} items)
            </button>
          )}
        </div>
      </div>
    </>
  );
}
