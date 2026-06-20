import React from 'react';
import styles from './BottomNav.module.css';

export default function BottomNav({ activeTab, onTabPress, user }) {
  return (
    <nav className={styles.nav}>
      <button
        onClick={() => onTabPress('home')}
        className={`${styles.tab} ${activeTab === 'home' ? styles.active : ''}`}
      >
        <span className={styles.icon}>📦</span>
        <span className={styles.label}>Home</span>
      </button>
      <button
        onClick={() => onTabPress('scan')}
        className={`${styles.tab} ${activeTab === 'scan' ? styles.active : ''}`}
      >
        <span className={styles.icon}>📷</span>
        <span className={styles.label}>Scan</span>
      </button>
      <button
        onClick={() => onTabPress('picklist')}
        className={`${styles.tab} ${activeTab === 'picklist' ? styles.active : ''}`}
      >
        <span className={styles.icon}>📋</span>
        <span className={styles.label}>Picklist</span>
      </button>
      <button
        onClick={() => onTabPress('user')}
        className={`${styles.tab} ${activeTab === 'user' ? styles.active : ''}`}
      >
        <span className={styles.icon}>👤</span>
        <span className={styles.label}>User</span>
      </button>
    </nav>
  );
}
