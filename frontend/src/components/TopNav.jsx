import React from 'react';
import styles from './TopNav.module.css';

export default function TopNav({ activeTab, onTabPress, user, picklistCount, theme }) {
  const isAdmin = user && (user.role === 'admin' || user.role === 'owner');

  let themeIcon = '⚡ ';
  if (theme === 'batman') themeIcon = '🦇 ';
  else if (theme === 'msmarvel') themeIcon = '⚡ ';
  else if (theme === 'starlord') themeIcon = '🎸 ';
  else if (theme === 'superman') themeIcon = '';

  return (
    <nav className={styles.nav}>
      <div className={styles.brand}>
        {theme === 'superman' ? (
          <span className={styles.supermanS} />
        ) : (
          <span className={styles.brandIcon}>{themeIcon}</span>
        )}
        <span className={styles.brandName}>ComicCache</span>
      </div>
      <div className={styles.tabs}>
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
          <span className={styles.label}>Add</span>
        </button>
        <button
          onClick={() => onTabPress('picklist')}
          className={`${styles.tab} ${activeTab === 'picklist' ? styles.active : ''}`}
        >
          <span className={styles.icon}>
            📋
            {picklistCount > 0 && (
              <span className={styles.badge}>{picklistCount}</span>
            )}
          </span>
          <span className={styles.label}>Picklist</span>
        </button>
        <button
          onClick={() => onTabPress('user')}
          className={`${styles.tab} ${activeTab === 'user' ? styles.active : ''}`}
        >
          <span className={styles.icon}>👤</span>
          <span className={styles.label}>User</span>
        </button>
        {isAdmin && (
          <button
            onClick={() => onTabPress('admin')}
            className={`${styles.tab} ${activeTab === 'admin' ? styles.active : ''}`}
          >
            <span className={styles.icon}>⚙️</span>
            <span className={styles.label}>Admin</span>
          </button>
        )}
      </div>
    </nav>
  );
}
