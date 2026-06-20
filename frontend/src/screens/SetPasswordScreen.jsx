import React, { useState } from 'react';
import { changePassword } from '../utilities/api';
import styles from './SetPasswordScreen.module.css';

export default function SetPasswordScreen({ user, onComplete }) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!currentPassword) { setError('Current password is required'); return; }
    if (newPassword.length < 4) { setError('New password must be at least 4 characters'); return; }
    if (newPassword !== confirm) { setError('Passwords do not match'); return; }

    setLoading(true);
    try {
      await changePassword(currentPassword, newPassword);
      onComplete();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h2 className={styles.formTitle}>Set Your Password</h2>
        <p className={styles.formDesc}>
          Welcome, <strong>{user.username}</strong>! You need to set a new password before continuing.
        </p>

        {error && (
          <div className={styles.error}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className={styles.form}>
          <input
            type="password" placeholder="Temporary password" value={currentPassword}
            onChange={e => setCurrentPassword(e.target.value)} required autoFocus
            className={styles.input}
          />
          <input
            type="password" placeholder="New password" value={newPassword}
            onChange={e => setNewPassword(e.target.value)} required
            className={styles.input}
          />
          <input
            type="password" placeholder="Confirm new password" value={confirm}
            onChange={e => setConfirm(e.target.value)} required
            className={styles.input}
          />
          <button type="submit" disabled={loading} className={styles.submitBtn}>
            {loading ? 'Setting password...' : 'Set Password'}
          </button>
        </form>
      </div>
    </div>
  );
}
