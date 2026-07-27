import React from 'react';
import styles from './ComicBookLoader.module.css';

export default function ComicBookLoader() {
  return (
    <div className={styles.wrapper}>
      <div className={styles.book}>
        <div className={styles.cover}>
          <div className={styles.coverSpine}>⚡</div>
          <div className={styles.coverTitle}>
            <span className={styles.coverLine1}>COMIC</span>
            <span className={styles.coverLine2}>CACHE</span>
          </div>
        </div>
        <div className={`${styles.page} ${styles.page1}`} />
        <div className={`${styles.page} ${styles.page2}`} />
        <div className={`${styles.page} ${styles.page3}`} />
        <div className={`${styles.page} ${styles.page4}`} />
      </div>
      <div className={styles.loadingText}>LOADING...</div>
    </div>
  );
}
