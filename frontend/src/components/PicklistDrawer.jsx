import React, { useEffect, useState, useRef } from 'react';
import { fetchPicklist, removeFromPicklist, updatePicklistItem, clearPicklist } from '../utilities/api';
import Skeleton from './Skeleton';
import styles from './PicklistDrawer.module.css';

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
  const swipeStartX = useRef(0);
  const drawerRef = useRef(null);

  const handleTouchStart = (e) => {
    swipeStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e) => {
    const dx = e.changedTouches[0].clientX - swipeStartX.current;
    if (dx > 80) onClose();
  };

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
      <div onClick={onClose} className={styles.overlay} />
      <div
        ref={drawerRef}
        className={styles.drawer}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div className={styles.drawerHeader}>
          <div className={styles.headerTop}>
            <div>
              <span className={styles.wantLabel}>
                📋 WANT LIST
              </span>
              <h2 className={styles.drawerTitle}>
                Picklist ({items.length})
              </h2>
            </div>
            <button onClick={onClose} className={styles.closeBtn}>
              ✕
            </button>
          </div>
        </div>

        <div className={styles.itemsArea}>
          {loading ? (
            <div className={styles.loadingText}>
              <Skeleton width="100%" height={48} count={4} />
            </div>
          ) : items.length === 0 ? (
            <div className={styles.emptyText}>
              No items in picklist yet.
              <div className={styles.emptyHint}>
                Browse a box and add comics you're looking for!
              </div>
            </div>
          ) : (
            items.map(item => (
              <div key={item.id} className={styles.itemCard}>
                <div className={styles.itemHeader}>
                  <div className={styles.itemInfo}>
                    <div className={styles.itemName}>
                      {item.title} #{item.issue_number}
                    </div>
                    <div className={styles.itemPublisher}>
                      {item.publisher}
                    </div>
                  </div>
                  <span className={`${styles.statusBadge} ${item.status === 'found' ? styles.statusFound : styles.statusLooking}`}>
                    {item.status === 'found' ? 'FOUND' : 'LOOKING'}
                  </span>
                </div>

                {item.notes && (
                  <div className={styles.itemNote}>
                    {item.notes}
                  </div>
                )}

                <div className={styles.itemDate}>
                  Added {new Date(item.date_added).toLocaleDateString()}
                </div>

                <div className={styles.actionsRow}>
                  <button
                    onClick={() => handleToggleStatus(item)}
                    className={`${styles.actionBtn} ${item.status === 'found' ? styles.markLooking : styles.markFound}`}
                  >
                    {item.status === 'found' ? '↩ Mark Looking' : '✓ Mark Found'}
                  </button>
                  <button
                    onClick={() => handleRemove(item.id)}
                    className={styles.removeBtn}
                  >
                    ✕ Remove
                  </button>
                </div>
              </div>
            ))
          )}

          {items.length > 0 && (
            <button onClick={handleClearAll} className={styles.clearAllBtn}>
              🗑 Clear All ({items.length} items)
            </button>
          )}
        </div>
      </div>
    </>
  );
}
