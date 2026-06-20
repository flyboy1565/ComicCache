import React, { useState, useEffect } from 'react';
import { register, fetchRoles } from '../utilities/api';
import styles from './RegisterScreen.module.css';

const ROLE_COLORS = {
  'Editor-in-Chief': '#e53e3e',
  'Publisher': '#805ad5',
  'Quartermaster': '#3182ce',
  'Promoter': '#38a169',
  'Page Turner': '#718096',
};

export default function RegisterScreen({ onRegistered, onCancel }) {
  const [username, setUsername] = useState('');
  const [roleId, setRoleId] = useState(5);
  const [roles, setRoles] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    fetchRoles()
      .then(setRoles)
      .catch(() => setRoles([]));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!username.trim()) { setError('Username is required'); return; }
    setLoading(true);
    try {
      const result = await register(username.trim(), roleId);
      setDone(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className={styles.wrapper}>
        <div className={styles.cardCentered}>
          <div className={styles.doneIcon}>📧</div>
          <h2 className={styles.doneTitle}>Setup Email Sent</h2>
          <p className={styles.doneText}>
            A temporary password has been sent to <strong>{username}@comiccache.local</strong>.
          </p>
          <button onClick={onCancel} className={styles.btnDone}>
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.card}>
        <h2 className={styles.formTitle}>Add Staff Account</h2>
        <p className={styles.formDesc}>Create a new employee login. Setup instructions will be sent to their email.</p>

        {error && (
          <div className={styles.error}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className={styles.form}>
          <input
            type="text" placeholder="Username" value={username}
            onChange={e => setUsername(e.target.value)} required autoFocus
            className={styles.input}
          />
          <select value={roleId} onChange={e => setRoleId(parseInt(e.target.value))}
            className={styles.input}>
            {roles.map(r => (
              <option key={r.id} value={r.id}>
                {r.display_name} ({r.name})
              </option>
            ))}
          </select>
          <div className={styles.buttonRow}>
            <button type="button" onClick={onCancel}
              className={`${styles.btn} ${styles.btnCancel}`}
            >
              Cancel
            </button>
            <button type="submit" disabled={loading}
              className={`${styles.btn} ${styles.btnSubmit}`}
            >
              {loading ? 'Sending...' : 'Send Setup Email'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
