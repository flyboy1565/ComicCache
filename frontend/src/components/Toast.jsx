import React, { useEffect } from 'react';
import styles from './Toast.module.css';

const COLORS = {
  success: { bg: '#48bb78', border: '#38a169' },
  error: { bg: '#fc8181', border: '#f56565' },
};

export default function Toast({ message, type, onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 2500);
    return () => clearTimeout(timer);
  }, [onClose]);

  const toastType = type === 'error' ? styles.error : styles.success;

  return (
    <div className={`${styles.container} ${toastType}`}>
      <span className={styles.messageText}>{message}</span>
      <button onClick={onClose} className={styles.dismissBtn}>
        ✕
      </button>
    </div>
  );
}
