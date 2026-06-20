import React, { useEffect, useState } from 'react';
import { fetchBoxComics } from '../utilities/api';
import ComicDetailModal from './ComicDetailModal';
import ComicBubbleIcon from './ComicBubbleIcon';
import Skeleton from './Skeleton';
import styles from './BoxDetailScreen.module.css';

export default function BoxDetailScreen({ box, onBack, onViewSeries, onAddToPicklist }) {
  const [comics, setComics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedComic, setSelectedComic] = useState(null);

  useEffect(() => {
    setLoading(true);
    fetchBoxComics(box.id)
      .then(data => { setComics(data); setLoading(false); })
      .catch(err => { console.error(err); setLoading(false); });
  }, [box.id]);

  const handleViewSeries = (title, publisher) => {
    setSelectedComic(null);
    onViewSeries(title, publisher);
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button onClick={onBack} className={styles.backBtn}>←</button>
        <div className={styles.headerTitleBlock}>
          <h3 className={styles.boxName}>{box.name}</h3>
          <div className={styles.metaRow}>
            <span className={styles.locationBadge}>
              📍 {box.location}
            </span>
            {!loading && (
              <span className={styles.issueCount}>
                {comics.length} {comics.length === 1 ? 'issue' : 'issues'}
              </span>
            )}
          </div>
        </div>
      </div>

      {loading && (
        <div className={styles.loadingState}>
          <Skeleton width="100%" height={48} count={6} />
        </div>
      )}

      {!loading && comics.length === 0 && (
        <div className={styles.emptyState}>
          This container is empty. Scan some comics into it!
        </div>
      )}

      {!loading && comics.length > 0 && (
        <div className={styles.comicList}>
          {comics.map(comic => (
            <div key={comic.id} className={styles.comicRow}>
              <div className={styles.coverThumb}>
                {comic.cover_image ? (
                  <img src={comic.cover_image} alt="" />
                ) : (
                  <ComicBubbleIcon size={16} color="#a0aec0" />
                )}
              </div>

              <div className={styles.comicInfo}>
                <div className={styles.comicTitle}>
                  {comic.title} #{comic.issue_number}
                </div>
                <div className={styles.comicPublisher}>
                  {comic.publisher}
                </div>
              </div>

              <div className={styles.comicValue}>
                ${comic.estimated_value.toFixed(2)}
              </div>

              <button
                onClick={() => onAddToPicklist({ title: comic.title, issue_number: comic.issue_number, publisher: comic.publisher })}
                className={`${styles.actionBtn} ${styles.picklistBtn}`}
              >
                📋
              </button>
              <button
                onClick={() => setSelectedComic(comic)}
                className={`${styles.actionBtn} ${styles.viewBtn}`}
              >
                👁 View
              </button>
              <button
                onClick={() => handleViewSeries(comic.title, comic.publisher)}
                className={`${styles.actionBtn} ${styles.seriesBtn}`}
              >
                📚 Series
              </button>
            </div>
          ))}
        </div>
      )}

      {selectedComic && (
        <ComicDetailModal
          comic={selectedComic}
          onClose={() => setSelectedComic(null)}
          onViewSeries={handleViewSeries}
          onAddToPicklist={onAddToPicklist}
        />
      )}
    </div>
  );
}
