import React, { useState, useEffect, useRef } from 'react';
import { fetchUsers } from '../utilities/api';

const ROLE_COLORS = {
  'Editor-in-Chief': '#e53e3e',
  'Publisher': '#805ad5',
  'Quartermaster': '#3182ce',
  'Promoter': '#38a169',
  'Page Turner': '#718096',
};

function roleColor(displayName) {
  return ROLE_COLORS[displayName] || '#a0aec0';
}

export default function UserMenu({ user, onLogout, onAddStaff, onNavigate }) {
  const [open, setOpen] = useState(false);
  const [employees, setEmployees] = useState([]);
  const menuRef = useRef(null);

  const canManageUsers = user.role === 'admin' || user.role === 'owner';

  useEffect(() => {
    if (open && canManageUsers) {
      fetchUsers()
        .then(setEmployees)
        .catch(() => setEmployees([]));
    }
    if (!open) setEmployees([]);
  }, [open, canManageUsers]);

  useEffect(() => {
    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  const initial = (user.username || '?')[0].toUpperCase();
  const badgeColor = roleColor(user.role_display);

  return (
    <div ref={menuRef} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          background: 'none', border: 'none', cursor: 'pointer',
          padding: '4px 6px', borderRadius: '8px',
        }}
      >
        <div style={{
          width: '28px', height: '28px', borderRadius: '50%',
          background: badgeColor, color: '#fff', display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          fontSize: '14px', fontWeight: 'bold',
        }}>
          {initial}
        </div>
        <span style={{ fontSize: '13px', color: '#4a5568', fontWeight: 600 }}>
          {user.username}
        </span>
        <span style={{ fontSize: '10px', color: '#a0aec0' }}>{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div style={{
          position: 'absolute', right: 0, top: '100%', marginTop: '4px',
          minWidth: '220px', background: '#fff', borderRadius: '10px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.15)', padding: '12px',
          zIndex: 1000, border: '1px solid #e2e8f0',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px', paddingBottom: '10px', borderBottom: '1px solid #edf2f7' }}>
            <div style={{
              width: '36px', height: '36px', borderRadius: '50%',
              background: badgeColor, color: '#fff', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              fontSize: '16px', fontWeight: 'bold', flexShrink: 0,
            }}>
              {initial}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: '14px', fontWeight: 600, color: '#2d3748' }}>{user.username}</div>
              <div style={{ fontSize: '12px', color: '#718096', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.email}</div>
            </div>
            <span style={{
              marginLeft: 'auto', fontSize: '11px', fontWeight: 600, padding: '2px 8px',
              borderRadius: '999px', background: '#fff5f5',
              color: badgeColor, border: `1px solid ${badgeColor}`,
            }}>
              {user.role_display || user.role}
            </span>
          </div>

          {canManageUsers && (
            <div style={{ marginBottom: '10px', paddingBottom: '10px', borderBottom: '1px solid #edf2f7' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '12px', fontWeight: 600, color: '#a0aec0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Employees
                </span>
                <button onClick={() => { setOpen(false); onAddStaff(); }}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer', padding: '2px 6px',
                    fontSize: '14px', color: '#e53e3e', fontWeight: 'bold', borderRadius: '4px',
                  }}
                  title="Add Staff"
                >
                  + Add
                </button>
              </div>
              {employees.length === 0 ? (
                <div style={{ fontSize: '12px', color: '#a0aec0', fontStyle: 'italic', padding: '4px 0' }}>
                  No accounts yet
                </div>
              ) : (
                employees.filter(e => e.id !== user.id).map((emp) => (
                  <div key={emp.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 0' }}>
                    <div style={{
                      width: '22px', height: '22px', borderRadius: '50%',
                      background: roleColor(emp.role_display), color: '#fff', display: 'flex',
                      alignItems: 'center', justifyContent: 'center',
                      fontSize: '11px', fontWeight: 'bold',
                    }}>
                      {(emp.username || '?')[0].toUpperCase()}
                    </div>
                    <span style={{ fontSize: '13px', color: '#4a5568' }}>{emp.username}</span>
                    <span style={{ fontSize: '10px', color: '#a0aec0', marginLeft: 'auto' }}>
                      {emp.role_display}
                    </span>
                  </div>
                ))
              )}
            </div>
          )}

          {canManageUsers && (
            <button onClick={() => { setOpen(false); onNavigate(); }}
              style={{
                width: '100%', padding: '8px 0', fontSize: '13px', fontWeight: 600,
                background: 'none', color: '#4a5568', border: 'none', borderRadius: '6px',
                cursor: 'pointer', marginBottom: '6px',
              }}
            >
              Admin Panel
            </button>
          )}

          <button
            onClick={onLogout}
            style={{
              width: '100%', padding: '8px 0', fontSize: '13px', fontWeight: 600,
              background: '#fff5f5', color: '#e53e3e', border: 'none', borderRadius: '6px',
              cursor: 'pointer',
            }}
          >
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
}
