import styles from './Skeleton.module.css';

export default function Skeleton({ width, height = 20, borderRadius = 6, count = 1, className = '' }) {
  return (
    <span className={`${styles.wrapper} ${className}`} aria-hidden="true">
      {Array.from({ length: count }, (_, i) => (
        <span
          key={i}
          className={styles.skeleton}
          style={{ width, height, borderRadius }}
        />
      ))}
    </span>
  );
}
