import React, { useState } from 'react';
import { login, setToken } from '../utilities/api';

export default function LoginScreen({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await login(username, password);
      setToken(data.access_token);
      onLogin(data.user, data.password_change_required);
    } catch (err) {
      setError(err.message || 'Unable to connect to server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      maxWidth: '360px', margin: '80px auto 0', padding: '30px',
      fontFamily: 'sans-serif',
    }}>
      <h1 style={{ color: '#e53e3e', fontSize: '26px', textAlign: 'center', marginBottom: '8px' }}>
        ⚡ ComicCache
      </h1>
      <p style={{ textAlign: 'center', color: '#718096', fontSize: '14px', marginBottom: '30px' }}>
        Staff Login
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
          type="text"
          placeholder="Username"
          value={username}
          onChange={e => setUsername(e.target.value)}
          required
          autoFocus
          style={{
            width: '100%', padding: '12px 14px', fontSize: '15px',
            border: '2px solid #e2e8f0', borderRadius: '8px', boxSizing: 'border-box',
          }}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          style={{
            width: '100%', padding: '12px 14px', fontSize: '15px',
            border: '2px solid #e2e8f0', borderRadius: '8px', boxSizing: 'border-box',
          }}
        />
        <button
          type="submit"
          disabled={loading}
          style={{
            background: '#e53e3e', color: '#fff', border: 'none',
            padding: '12px', borderRadius: '8px', fontSize: '16px',
            fontWeight: 'bold', cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>
    </div>
  );
}
