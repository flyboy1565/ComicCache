import React, { useState, useEffect } from 'react';
import { fetchUsers, resetPassword } from '../utilities/api';

export default function AdminScreen({ onBack }) {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [resetting, setResetting] = useState(null);
  const [message, setMessage] = useState(null);

  const load = () => {
    setLoading(true);
    fetchUsers()
      .then(setEmployees)
      .catch(() => setEmployees([]))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleReset = async (userId) => {
    setResetting(userId);
    setMessage(null);
    try {
      const data = await resetPassword(userId);
      setMessage({ type: 'success', text: data.message });
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setResetting(null);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
        <button onClick={onBack}
          style={{
            background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer',
            padding: '4px 8px', color: '#4a5568',
          }}
        >
          ←
        </button>
        <h2 style={{ margin: 0, fontSize: '20px', color: '#2d3748' }}>Staff Management</h2>
      </div>

      {message && (
        <div style={{
          padding: '10px 14px', borderRadius: '8px', fontSize: '14px', marginBottom: '16px',
          background: message.type === 'success' ? '#f0fff4' : '#fff5f5',
          color: message.type === 'success' ? '#276749' : '#c53030',
          border: message.type === 'success' ? '1px solid #c6f6d5' : '1px solid #fed7d7',
        }}>
          {message.text}
        </div>
      )}

      {loading ? (
        <div style={{ fontSize: '14px', color: '#718096' }}>Loading...</div>
      ) : employees.length === 0 ? (
        <div style={{ fontSize: '14px', color: '#718096', fontStyle: 'italic' }}>
          No staff accounts yet.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {employees.map((emp) => (
            <div key={emp.id} style={{
              display: 'flex', alignItems: 'center', gap: '12px',
              padding: '14px', background: '#fff', borderRadius: '8px',
              border: '1px solid #e2e8f0',
            }}>
              <div style={{
                width: '36px', height: '36px', borderRadius: '50%',
                background: '#a0aec0', color: '#fff', display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                fontSize: '16px', fontWeight: 'bold', flexShrink: 0,
              }}>
                {(emp.username || '?')[0].toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '15px', fontWeight: 600, color: '#2d3748' }}>{emp.username}</div>
                <div style={{ fontSize: '12px', color: '#718096' }}>{emp.email}</div>
              </div>
              {emp.must_change_password && (
                <span style={{
                  fontSize: '11px', padding: '2px 8px', borderRadius: '999px',
                  background: '#fefcbf', color: '#744210', fontWeight: 600,
                }}>
                  Pending
                </span>
              )}
              <button onClick={() => handleReset(emp.id)} disabled={resetting === emp.id}
                style={{
                  padding: '8px 14px', fontSize: '13px', fontWeight: 600,
                  background: '#edf2f7', color: '#4a5568', border: 'none', borderRadius: '6px',
                  cursor: resetting === emp.id ? 'not-allowed' : 'pointer',
                  opacity: resetting === emp.id ? 0.6 : 1,
                }}
              >
                {resetting === emp.id ? 'Sending...' : 'Reset Password'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
