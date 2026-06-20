import React, { useEffect, useState, useRef, useCallback } from 'react';
import { fetchSeriesOverview, fetchComicDetail, fetchCoverForIssue, addToPicklist } from '../utilities/api';
import ComicBubbleIcon from './ComicBubbleIcon';
import ComicDetailModal from './ComicDetailModal';
import Skeleton from './Skeleton';
import styles from './SeriesVolumeViewer.module.css';

export default function SeriesVolumeViewer({ title, publisher, onClose }) {
  const [seriesData, setSeriesData] = useState(null);
  const [loading, setLoading] = useState(true);
  const pollRef = useRef(null);
  const [selectedComic, setSelectedComic] = useState(null);
  const [comicLoading, setComicLoading] = useState(false);
  const swipeStartX = useRef(0);

  const handleTouchStart = (e) => {
    swipeStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e) => {
    const dx = e.changedTouches[0].clientX - swipeStartX.current;
    if (dx > 80) onClose();
  };
  
  const [filterMode, setFilterMode] = useState('all');

  const loadSeries = () => {
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
  };

  useEffect(() => {
    loadSeries();
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [title, publisher]);

  const handleCloseModal = useCallback(() => setSelectedComic(null), []);
  const handleViewSeries = useCallback(() => { setSelectedComic(null); }, []);
  const handleAddToPicklist = useCallback((item) => addToPicklist(item), []);

  useEffect(() => {
    if (pollRef.current) clearInterval(pollRef.current);
    if (seriesData?.cover_gathering?.pending > 0) {
      pollRef.current = setInterval(() => {
        fetchSeriesOverview(title, publisher)
          .then(data => {
            setSeriesData(data);
            if (data.cover_gathering?.pending === 0) {
              clearInterval(pollRef.current);
              pollRef.current = null;
            }
          })
          .catch(() => {});
      }, 8000);
    }
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [seriesData?.cover_gathering?.pending, title, publisher]);

  if (!title || !publisher) return null;

  const filteredTimeline = seriesData?.timeline.filter(item => {
    if (filterMode === 'have') return item.status === 'in_stock';
    if (filterMode === 'missing') return item.status !== 'in_stock';
    return true;
  }) || [];

  const gathering = seriesData?.cover_gathering;

  return (
    <>
      <div onClick={onClose} className={styles.overlay} />

      <div
        className={styles.drawer}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        
        <div className={styles.header}>
          <div className={styles.headerTop}>
            <div>
              <span className={styles.publisherLabel}>
                {publisher} COLLECTION
              </span>
              <h2 className={styles.seriesTitle}>
                {title}
              </h2>
            </div>
            <button onClick={onClose} className={styles.closeBtn}>
              ✕
            </button>
          </div>

          {seriesData && (
            <div className={styles.filterRow}>
              
              <button
                onClick={() => setFilterMode(filterMode === 'have' ? 'all' : 'have')}
                className={`${styles.filterBtn} ${filterMode === 'have' ? styles.filterHaveActive : styles.filterHave}`}
              >
                🟩 Have: {seriesData.total_owned}
                {filterMode === 'have' && <span style={{ fontSize: '10px', marginLeft: '2px' }}>✕</span>}
              </button>

              <button
                onClick={() => setFilterMode(filterMode === 'missing' ? 'all' : 'missing')}
                className={`${styles.filterBtn} ${filterMode === 'missing' ? styles.filterMissingActive : styles.filterMissing}`}
              >
                🟥 Missing: {seriesData.total_missing}
                {filterMode === 'missing' && <span style={{ fontSize: '10px', marginLeft: '2px' }}>✕</span>}
              </button>

              <div className={styles.valueBadge}>
                Value: <strong className={styles.valueAmount}>${seriesData.total_series_value.toFixed(2)}</strong>
              </div>
            </div>
          )}

          {filterMode !== 'all' && (
            <div className={styles.activeFilter}>
              <span className={styles.activeFilterText}>
                Showing only <strong>{filterMode.toUpperCase()}</strong> variants ({filteredTimeline.length} items)
              </span>
              <button onClick={() => setFilterMode('all')} className={styles.clearFilterBtn}>
                Clear Filter ✕
              </button>
            </div>
          )}
        </div>

        {gathering && gathering.pending > 0 && (
          <div className={styles.gatheringBanner}>
            <span style={{ fontSize: '14px' }}>🔄</span>
            <span>
              Gathering comic covers: <strong>{gathering.cached}</strong> found ·{' '}
              <strong>{gathering.pending}</strong> remaining
              {gathering.not_found > 0 && ` · ${gathering.not_found} unavailable`}
            </span>
          </div>
        )}

        <div className={styles.scrollArea}>
          {loading ? (
            <div className={styles.loadingText}>
              <Skeleton width="100%" height={32} count={8} />
            </div>
          ) : filteredTimeline.length === 0 ? (
            <div className={styles.emptyText}>
              No issues match this filter view state.
            </div>
          ) : (
            filteredTimeline.map((item) => {
              const hasBook = item.status === 'in_stock';
              
              return (
                <div 
                  key={item.id}
                  onClick={() => {
                    setComicLoading(true);
                    if (hasBook) {
                      fetchComicDetail(item.id)
                        .then(data => {
                          setSelectedComic(data);
                          setComicLoading(false);
                        })
                        .catch(() => setComicLoading(false));
                    } else {
                      fetchCoverForIssue(title, item.issue_number, publisher)
                        .then(data => {
                          setSelectedComic({
                            title: title,
                            issue_number: item.issue_number,
                            publisher: publisher,
                            barcode: null,
                            estimated_value: 0,
                            cover_image: data.cover_url,
                            cover_status: data.cover_status,
                            interest_count: data.interest_count,
                            date_scanned: null,
                            writer: null,
                            penciler: null,
                            keywords: null,
                            box: { name: item.box_name, location: item.box_location },
                          });
                          setComicLoading(false);
                        })
                        .catch(() => setComicLoading(false));
                    }
                  }}
                  className={`${styles.timelineItem} ${!hasBook ? styles.timelineItemMissing : ''}`}
                >
                  <div className={`${styles.coverBox} ${
                    item.cover_status === 'cached' ? styles.coverBoxCached
                    : item.cover_status === 'pending' ? styles.coverBoxPending
                    : hasBook ? styles.coverBoxHave
                    : styles.coverBoxMissing
                  }`}>
                    {item.cover_image ? (
                      <img src={item.cover_image} alt="" />
                    ) : item.cover_status === 'pending' ? (
                      <span className={styles.coverPlaceholder}>⏳</span>
                    ) : (
                      <ComicBubbleIcon size={18} color={hasBook ? '#48bb78' : '#fc8181'} />
                    )}
                  </div>

                  <div className={styles.metaArea}>
                    <div className={styles.metaTop}>
                      <span className={hasBook ? styles.haveBadge : styles.missingBadge}>
                        {hasBook ? 'HAVE' : 'MISSING'}
                      </span>
                      <strong className={styles.issueNumber}>
                        Issue #{item.issue_number}
                      </strong>
                    </div>
                    
                    <div className={styles.boxLocation}>
                      {hasBook ? `📦 ${item.box_name}` : 'Not registered in vault inventory'}
                    </div>
                  </div>

                  <div className={styles.financialCol}>
                    <div className={styles.qtyLabel}>
                      QTY: {hasBook ? '1' : '0'}
                    </div>
                    <div className={`${styles.issueValue} ${hasBook ? styles.issueValueHave : styles.issueValueMissing}`}>
                      ${hasBook ? item.estimated_value.toFixed(2) : '0.00'}
                    </div>
                  </div>

                </div>
              );
            })
          )}
        </div>

      </div>

      {comicLoading && (
        <div className={styles.loadingOverlay}>
          <Skeleton width="80%" height={40} count={3} />
        </div>
      )}

      {selectedComic && (
        <ComicDetailModal
          comic={selectedComic}
          onClose={handleCloseModal}
          onViewSeries={handleViewSeries}
          onAddToPicklist={handleAddToPicklist}
        />
      )}
    </>
  );
}
