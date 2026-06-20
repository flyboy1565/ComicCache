import React, { memo, useRef } from 'react';
import ComicBubbleIcon from './ComicBubbleIcon';
import styles from './ComicDetailModal.module.css';

const ComicDetailModal = memo(function ComicDetailModal({ comic, onClose, onViewSeries, onAddToPicklist }) {
  const swipeStartY = useRef(0);

  const handleTouchStart = (e) => {
    swipeStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e) => {
    const dy = e.changedTouches[0].clientY - swipeStartY.current;
    if (dy > 100) onClose();
  };

  const handleClose = (e) => {
    e.stopPropagation();
    onClose();
  };

  return (
    <>
      <div onClick={onClose} className={styles.overlay} />
      <div
        className={styles.modal}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <button onPointerDown={handleClose} onTouchEnd={handleClose} className={styles.closeBtn}>
          ✕
        </button>

        <div className={styles.coverWrap}>
          <div className={`${styles.coverFrame} ${
            comic.cover_status === 'cached' ? styles.coverFrameCached
            : comic.cover_status === 'pending' ? styles.coverFramePending
            : styles.coverFrameNotFound
          }`}>
            {comic.cover_image ? (
              <img src={comic.cover_image} alt="" />
            ) : comic.cover_status === 'pending' ? (
              <span style={{ fontSize: '24px', opacity: 0.6 }}>⏳</span>
            ) : (
              <ComicBubbleIcon size={40} color="#e53e3e" />
            )}
          </div>
          {comic.cover_status && comic.cover_status !== 'cached' && (
            <span className={`${styles.coverStatusBadge} ${comic.cover_status === 'pending' ? styles.coverStatusPending : styles.coverStatusNotFound}`}>
              {comic.cover_status === 'pending' ? 'FETCHING' : 'NOT FOUND'}
            </span>
          )}
        </div>

        <h3 className={styles.comicTitle}>
          {comic.title} #{comic.issue_number}
        </h3>
        <p className={styles.comicPublisher}>
          {comic.publisher}
        </p>

        <div className={styles.detailGrid}>
          <div className={styles.detailRow}>
            <span className={styles.detailLabel}>Barcode</span>
            <span className={`${styles.detailValue} ${styles.detailValueMono}`}>{comic.barcode}</span>
          </div>
          <div className={styles.detailRow}>
            <span className={styles.detailLabel}>Est. Value</span>
            <span className={`${styles.detailValue} ${styles.detailValueGreen}`}>${comic.estimated_value.toFixed(2)}</span>
          </div>
          {comic.date_scanned && (
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Scanned</span>
              <span className={styles.detailValue}>{new Date(comic.date_scanned).toLocaleDateString()}</span>
            </div>
          )}
        </div>

        {comic.cover_status === 'not_found' && comic.interest_count > 0 && (
          <div className={styles.interestBanner}>
            🔍 Requested <strong>{comic.interest_count}</strong> time{comic.interest_count !== 1 ? 's' : ''} — potential re-order opportunity
          </div>
        )}

        <button
          onClick={() => { onAddToPicklist({ title: comic.title, issue_number: comic.issue_number, publisher: comic.publisher }); onClose(); }}
          className={`${styles.actionBtn} ${styles.picklistBtn}`}
        >
          📋 Add to Picklist
        </button>

        <button
          onClick={() => { onClose(); onViewSeries(comic.title, comic.publisher); }}
          className={`${styles.actionBtn} ${styles.seriesBtn}`}
        >
          📚 View Full Series Run
        </button>
      </div>
    </>
  );
});

export default ComicDetailModal;
