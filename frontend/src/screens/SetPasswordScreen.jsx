import React, { useState } from 'react';
import { changePassword } from '../utilities/api';

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
    <div style={{
      maxWidth: '400px', margin: '80px auto 0', padding: '30px',
      fontFamily: 'sans-serif',
    }}>
      <div style={{
        background: '#fff', borderRadius: '12px', padding: '24px',
        boxShadow: '0 1px 4px rgba(0,0,0,0.08)', border: '1px solid #e2e8f0',
      }}>
        <h2 style={{ margin: '0 0 4px 0', fontSize: '20px', color: '#2d3748' }}>Set Your Password</h2>
        <p style={{ margin: '0 0 20px 0', fontSize: '13px', color: '#718096' }}>
          Welcome, <strong>{user.username}</strong>! You need to set a new password before continuing.
        </p>

        {error && (
          <div style={{
            background: '#fff5f5', color: '#c53030', padding: '10px 14px',
            borderRadius: '8px', fontSize: '14px', marginBottom: '16px',
            border: '1px solid #fed7d7',
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <input
            type="password" placeholder="Temporary password" value={currentPassword}
            onChange={e => setCurrentPassword(e.target.value)} required autoFocus
            style={{
              width: '100%', padding: '12px 14px', fontSize: '15px',
              border: '2px solid #e2e8f0', borderRadius: '8px', boxSizing: 'border-box',
            }}
          />
          <input
            type="password" placeholder="New password" value={newPassword}
            onChange={e => setNewPassword(e.target.value)} required
            style={{
              width: '100%', padding: '12px 14px', fontSize: '15px',
              border: '2px solid #e2e8f0', borderRadius: '8px', boxSizing: 'border-box',
            }}
          />
          <input
            type="password" placeholder="Confirm new password" value={confirm}
            onChange={e => setConfirm(e.target.value)} required
            style={{
              width: '100%', padding: '12px 14px', fontSize: '15px',
              border: '2px solid #e2e8f0', borderRadius: '8px', boxSizing: 'border-box',
            }}
          />
          <button type="submit" disabled={loading}
            style={{
              width: '100%', padding: '12px', fontSize: '15px', fontWeight: 'bold',
              background: '#e53e3e', color: '#fff', border: 'none', borderRadius: '8px',
              cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? 'Setting password...' : 'Set Password'}
          </button>
        </form>
      </div>
    </div>
  );
}
