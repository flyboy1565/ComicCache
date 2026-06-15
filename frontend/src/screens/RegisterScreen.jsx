import React, { useState, useEffect } from 'react';
import { register, fetchRoles } from '../utilities/api';

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
      <div style={{ maxWidth: '400px', margin: '0 auto' }}>
        <div style={{
          background: '#fff', borderRadius: '12px', padding: '24px',
          boxShadow: '0 1px 4px rgba(0,0,0,0.08)', border: '1px solid #e2e8f0',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '40px', marginBottom: '12px' }}>📧</div>
          <h2 style={{ margin: '0 0 8px 0', fontSize: '18px', color: '#2d3748' }}>Setup Email Sent</h2>
          <p style={{ margin: '0 0 20px 0', fontSize: '14px', color: '#718096' }}>
            A temporary password has been sent to <strong>{username}@comiccache.local</strong>.
          </p>
          <button onClick={onCancel}
            style={{
              padding: '10px 24px', fontSize: '15px', fontWeight: 600,
              background: '#e53e3e', color: '#fff', border: 'none', borderRadius: '8px',
              cursor: 'pointer',
            }}
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '400px', margin: '0 auto' }}>
      <div style={{
        background: '#fff', borderRadius: '12px', padding: '24px',
        boxShadow: '0 1px 4px rgba(0,0,0,0.08)', border: '1px solid #e2e8f0',
      }}>
        <h2 style={{ margin: '0 0 4px 0', fontSize: '20px', color: '#2d3748' }}>Add Staff Account</h2>
        <p style={{ margin: '0 0 20px 0', fontSize: '13px', color: '#718096' }}>Create a new employee login. Setup instructions will be sent to their email.</p>

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
            type="text" placeholder="Username" value={username}
            onChange={e => setUsername(e.target.value)} required autoFocus
            style={{
              width: '100%', padding: '12px 14px', fontSize: '15px',
              border: '2px solid #e2e8f0', borderRadius: '8px', boxSizing: 'border-box',
            }}
          />
          <select value={roleId} onChange={e => setRoleId(parseInt(e.target.value))}
            style={{
              width: '100%', padding: '12px 14px', fontSize: '15px',
              border: '2px solid #e2e8f0', borderRadius: '8px', boxSizing: 'border-box',
              background: '#fff',
            }}>
            {roles.map(r => (
              <option key={r.id} value={r.id}>
                {r.display_name} ({r.name})
              </option>
            ))}
          </select>
          <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
            <button type="button" onClick={onCancel}
              style={{
                flex: 1, padding: '12px', fontSize: '15px', fontWeight: 600,
                background: '#edf2f7', color: '#4a5568', border: 'none', borderRadius: '8px',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button type="submit" disabled={loading}
              style={{
                flex: 1, padding: '12px', fontSize: '15px', fontWeight: 'bold',
                background: '#e53e3e', color: '#fff', border: 'none', borderRadius: '8px',
                cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? 'Sending...' : 'Send Setup Email'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
