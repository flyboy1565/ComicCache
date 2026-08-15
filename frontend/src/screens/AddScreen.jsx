import React, { useEffect, useState } from 'react';
import ComicScanner from '../components/ComicScanner';
import { fetchBoxes, fetchRecentComics } from '../utilities/api';
import styles from './AddScreen.module.css';

export default function AddScreen({ onBack }) {
  const [boxes, setBoxes] = useState([]);
  const [selectedBoxId, setSelectedBoxId] = useState('');
  const [recent, setRecent] = useState([]);
  const [loadingRecent, setLoadingRecent] = useState(true);

  const loadBoxes = () => {
    fetchBoxes()
      .then(data => {
        setBoxes(data || []);
        if (data.length > 0) {
          setSelectedBoxId(prev => prev || data[0].id.toString());
        }
      })
      .catch(() => setBoxes([]));
  };

  const loadRecent = () => {
    fetchRecentComics(12)
      .then(data => setRecent(data || []))
      .catch(() => {})
      .finally(() => setLoadingRecent(false));
  };

  useEffect(() => {
    loadBoxes();
    loadRecent();
  }, []);

  const handleComicAdded = () => {
    loadRecent();
  };

  return (
    <div className={styles.page}>
      <div className={styles.pageInner}>

        <div className={styles.leftCol}>
          <div className={styles.sidebarHeader}>
            <h3 className={styles.sidebarTitle}>🕘 Recently Added</h3>
            <span className={styles.sidebarCount}>{recent.length}</span>
          </div>
          <div className={styles.recentList}>
            {loadingRecent && recent.length === 0 ? (
              <div className={styles.empty}>Loading...</div>
            ) : recent.length === 0 ? (
              <div className={styles.empty}>No comics added yet. Scan or enter your first comic on the right.</div>
            ) : (
              recent.map(c => (
                <div key={c.id} className={styles.recentItem}>
                  <div className={styles.recentCover}>
                    {c.cover_image ? (
                      <img src={c.cover_image} alt="" />
                    ) : (
                      <span className={styles.recentCoverPlaceholder}>📘</span>
                    )}
                  </div>
                  <div className={styles.recentMeta}>
                    <div className={styles.recentTitle}>{c.title} <span className={styles.recentIssue}>#{c.issue_number}</span></div>
                    <div className={styles.recentSub}>
                      {c.box_name || '—'}{c.box_location ? ` · ${c.box_location}` : ''}
                    </div>
                  </div>
                  <div className={styles.recentValue}>
                    ${Number(c.estimated_value || 0).toFixed(2)}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className={styles.mainCol}>
          <div className={styles.addHeader}>
            <div>
              <h2 className={styles.addTitle}>Add Comics</h2>
              <p className={styles.addSubtitle}>Scan barcodes or enter them manually to add to your vault.</p>
            </div>
            <button onClick={onBack} className={styles.backBtn}>← Back to Dashboard</button>
          </div>

          <div className={styles.boxSelectRow}>
            <label className={styles.boxLabel}>Destination Box Container:</label>
            <select
              value={selectedBoxId}
              onChange={e => setSelectedBoxId(e.target.value)}
              className={styles.boxSelect}
            >
              {boxes.length === 0 && <option value="">No boxes yet</option>}
              {boxes.map(b => (
                <option key={b.id} value={b.id.toString()}>{b.name} ({b.location})</option>
              ))}
            </select>
          </div>

          {selectedBoxId && (
            <div className={styles.scannerCard}>
              <ComicScanner activeBoxId={parseInt(selectedBoxId, 10)} onComicAdded={handleComicAdded} />
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
