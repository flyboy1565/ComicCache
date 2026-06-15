import React, { useState, useEffect } from 'react';
import { fetchUsers, fetchRoles, fetchAdminStats, resetPassword, updateUserRole, deleteRole } from '../utilities/api';

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

export default function AdminScreen({ user, onBack }) {
  const [tab, setTab] = useState('staff');
  const [employees, setEmployees] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [resetting, setResetting] = useState(null);
  const [message, setMessage] = useState(null);
  const [roleEditor, setRoleEditor] = useState(null);
  const [permEditor, setPermEditor] = useState(null);
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(false);

  const loadStats = () => {
    setStatsLoading(true);
    fetchAdminStats()
      .then(setStats)
      .catch(() => setStats(null))
      .finally(() => setStatsLoading(false));
  };

  const loadStaff = () => {
    setLoading(true);
    fetchUsers()
      .then(setEmployees)
      .catch(() => setEmployees([]))
      .finally(() => setLoading(false));
  };

  const loadRoles = () => {
    fetchRoles()
      .then(setRoles)
      .catch(() => setRoles([]));
  };

  useEffect(() => {
    loadStaff();
    loadRoles();
  }, []);

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

  const handleRoleChange = async (userId, roleId) => {
    try {
      await updateUserRole(userId, roleId);
      setMessage({ type: 'success', text: 'Role updated' });
      loadStaff();
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  const handleDeleteRole = async (roleId, name) => {
    if (!window.confirm(`Delete role "${name}"?`)) return;
    try {
      await deleteRole(roleId);
      setMessage({ type: 'success', text: 'Role deleted' });
      loadRoles();
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  const RESOURCES = ['scan', 'comics', 'boxes', 'users', 'picklist', 'valuation', 'settings'];
  const ACTIONS = ['none', 'read', 'write', 'admin'];

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
        <h2 style={{ margin: 0, fontSize: '20px', color: '#2d3748' }}>Admin Panel</h2>
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

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <button onClick={() => setTab('staff')}
          style={{
            padding: '8px 16px', fontSize: '14px', fontWeight: 600, border: 'none',
            borderRadius: '8px', cursor: 'pointer',
            background: tab === 'staff' ? '#e53e3e' : '#edf2f7',
            color: tab === 'staff' ? '#fff' : '#4a5568',
          }}>
          Staff
        </button>
        <button onClick={() => setTab('roles')}
          style={{
            padding: '8px 16px', fontSize: '14px', fontWeight: 600, border: 'none',
            borderRadius: '8px', cursor: 'pointer',
            background: tab === 'roles' ? '#805ad5' : '#edf2f7',
            color: tab === 'roles' ? '#fff' : '#4a5568',
          }}>
          Roles
        </button>
        <button onClick={() => { setTab('stats'); if (!stats) loadStats(); }}
          style={{
            padding: '8px 16px', fontSize: '14px', fontWeight: 600, border: 'none',
            borderRadius: '8px', cursor: 'pointer',
            background: tab === 'stats' ? '#2b6cb0' : '#edf2f7',
            color: tab === 'stats' ? '#fff' : '#4a5568',
          }}>
          Stats
        </button>
      </div>

      {/* STAFF TAB */}
      {tab === 'staff' && (
        <>
          {loading ? (
            <div style={{ fontSize: '14px', color: '#718096' }}>Loading...</div>
          ) : employees.length === 0 ? (
            <div style={{ fontSize: '14px', color: '#718096', fontStyle: 'italic' }}>
              No accounts yet.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {employees.map((emp) => {
                const rColor = roleColor(emp.role_display);
                return (
                  <div key={emp.id} style={{
                    display: 'flex', alignItems: 'center', gap: '10px',
                    padding: '12px', background: '#fff', borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                  }}>
                    <div style={{
                      width: '36px', height: '36px', borderRadius: '50%',
                      background: rColor, color: '#fff', display: 'flex',
                      alignItems: 'center', justifyContent: 'center',
                      fontSize: '16px', fontWeight: 'bold', flexShrink: 0,
                    }}>
                      {(emp.username || '?')[0].toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: '#2d3748' }}>
                        {emp.username}
                      </div>
                      <div style={{ fontSize: '12px', color: '#718096' }}>
                        {emp.role_display} ({emp.role})
                      </div>
                    </div>
                    <select value={emp.role_id} onChange={e => handleRoleChange(emp.id, parseInt(e.target.value))}
                      style={{
                        padding: '6px 8px', fontSize: '12px', borderRadius: '6px',
                        border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer',
                      }}>
                      {roles.map(r => (
                        <option key={r.id} value={r.id}>{r.display_name}</option>
                      ))}
                    </select>
                    {emp.must_change_password && (
                      <span style={{
                        fontSize: '11px', padding: '2px 8px', borderRadius: '999px',
                        background: '#fefcbf', color: '#744210', fontWeight: 600,
                      }}>
                        Pending
                      </span>
                    )}
                    <button onClick={() => setPermEditor(permEditor === emp.id ? null : emp.id)}
                      style={{
                        padding: '6px 10px', fontSize: '12px', fontWeight: 600,
                        background: permEditor === emp.id ? '#805ad5' : '#edf2f7',
                        color: permEditor === emp.id ? '#fff' : '#4a5568',
                        border: 'none', borderRadius: '6px', cursor: 'pointer',
                      }}>
                      Permissions
                    </button>
                    <button onClick={() => handleReset(emp.id)} disabled={resetting === emp.id}
                      style={{
                        padding: '6px 10px', fontSize: '12px', fontWeight: 600,
                        background: '#edf2f7', color: '#4a5568', border: 'none', borderRadius: '6px',
                        cursor: resetting === emp.id ? 'not-allowed' : 'pointer',
                        opacity: resetting === emp.id ? 0.6 : 1,
                      }}>
                      {resetting === emp.id ? '...' : 'Reset'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ROLES TAB */}
      {tab === 'roles' && (
        <>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
            {roles.map(r => (
              <button key={r.id} onClick={() => setRoleEditor(roleEditor?.id === r.id ? null : r)}
                style={{
                  padding: '8px 14px', fontSize: '13px', fontWeight: 600, border: 'none',
                  borderRadius: '8px', cursor: 'pointer',
                  background: roleEditor?.id === r.id ? roleColor(r.display_name) : '#edf2f7',
                  color: roleEditor?.id === r.id ? '#fff' : '#4a5568',
                }}>
                {r.display_name}
                <span style={{ fontSize: '11px', marginLeft: '6px', opacity: 0.7 }}>
                  ({r.user_count})
                </span>
              </button>
            ))}
          </div>

          {roleEditor && (
            <div style={{ background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', padding: '16px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h3 style={{ margin: 0, fontSize: '16px', color: '#2d3748' }}>
                  {roleEditor.display_name} ({roleEditor.name})
                </h3>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {!roleEditor.is_system && (
                    <button onClick={() => handleDeleteRole(roleEditor.id, roleEditor.display_name)}
                      style={{
                        padding: '6px 12px', fontSize: '12px', fontWeight: 600,
                        background: '#fff5f5', color: '#e53e3e', border: 'none', borderRadius: '6px',
                        cursor: 'pointer',
                      }}>
                      Delete
                    </button>
                  )}
                  <button onClick={() => setRoleEditor(null)}
                    style={{
                      padding: '6px 12px', fontSize: '12px', fontWeight: 600,
                      background: '#edf2f7', color: '#4a5568', border: 'none', borderRadius: '6px',
                      cursor: 'pointer',
                    }}>
                    Close
                  </button>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {RESOURCES.map(res => (
                  <div key={res} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
                    <span style={{ width: '100px', fontWeight: 600, color: '#4a5568', textTransform: 'capitalize' }}>{res}</span>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      {ACTIONS.map(a => (
                        <button key={a}
                          onClick={async () => {
                            const perms = { ...roleEditor.permissions, [res]: a };
                            try {
                              const { updateRole } = await import('../utilities/api');
                              await updateRole(roleEditor.id, { permissions: JSON.stringify(perms) });
                              setMessage({ type: 'success', text: 'Permission updated' });
                              loadRoles();
                            } catch (err) {
                              setMessage({ type: 'error', text: err.message });
                            }
                          }}
                          style={{
                            padding: '4px 10px', fontSize: '11px', fontWeight: 600,
                            border: '1px solid #e2e8f0', borderRadius: '4px',
                            background: roleEditor.permissions[res] === a ? '#805ad5' : '#fff',
                            color: roleEditor.permissions[res] === a ? '#fff' : '#4a5568',
                            cursor: 'pointer',
                          }}>
                          {a}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* STATS TAB */}
      {tab === 'stats' && (
        <div>
          {statsLoading ? (
            <div style={{ fontSize: '14px', color: '#718096' }}>Loading stats...</div>
          ) : !stats ? (
            <div style={{ fontSize: '14px', color: '#718096', fontStyle: 'italic' }}>
              Could not load stats.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Top Searched */}
              <div style={{ background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', padding: '16px' }}>
                <h3 style={{ margin: '0 0 12px 0', fontSize: '15px', color: '#2d3748' }}>
                  🔍 Most Searched Covers
                </h3>
                {stats.top_searched.length === 0 ? (
                  <div style={{ fontSize: '13px', color: '#a0aec0', fontStyle: 'italic' }}>No cover lookups yet.</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {stats.top_searched.map((item, i) => (
                      <div key={i} style={{
                        display: 'flex', alignItems: 'center', gap: '8px',
                        padding: '8px 10px', borderRadius: '6px',
                        background: i % 2 === 0 ? '#f7fafc' : '#fff',
                        fontSize: '13px',
                      }}>
                        <span style={{ width: '20px', fontWeight: 700, color: '#a0aec0', textAlign: 'right' }}>#{i + 1}</span>
                        <span style={{ flex: 1, fontWeight: 600, color: '#2d3748' }}>
                          {item.series_title} <span style={{ color: '#718096' }}>#{item.issue_number}</span>
                        </span>
                        <span style={{ color: '#718096', fontSize: '12px', width: '100px' }}>{item.publisher}</span>
                        <span style={{
                          fontWeight: 700, color: '#dd6b20', minWidth: '50px', textAlign: 'right',
                        }}>
                          🔍 {item.hit_count}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Oldest Owned */}
              <div style={{ background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', padding: '16px' }}>
                <h3 style={{ margin: '0 0 12px 0', fontSize: '15px', color: '#2d3748' }}>
                  ⏳ Oldest Owned Comics
                </h3>
                {stats.oldest_comics.length === 0 ? (
                  <div style={{ fontSize: '13px', color: '#a0aec0', fontStyle: 'italic' }}>No comics in collection yet.</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {stats.oldest_comics.map((item, i) => (
                      <div key={i} style={{
                        display: 'flex', alignItems: 'center', gap: '8px',
                        padding: '8px 10px', borderRadius: '6px',
                        background: i % 2 === 0 ? '#f7fafc' : '#fff',
                        fontSize: '13px',
                      }}>
                        <span style={{ width: '20px', fontWeight: 700, color: '#a0aec0', textAlign: 'right' }}>#{i + 1}</span>
                        <span style={{ flex: 1, fontWeight: 600, color: '#2d3748' }}>
                          {item.title} <span style={{ color: '#718096' }}>#{item.issue_number}</span>
                        </span>
                        <span style={{ color: '#718096', fontSize: '12px', width: '100px' }}>{item.publisher}</span>
                        <span style={{ color: '#718096', fontSize: '12px', width: '140px', textAlign: 'right' }}>
                          📦 {item.box_name || '—'}
                        </span>
                        <span style={{
                          fontWeight: 600, color: '#4a5568', fontSize: '12px', minWidth: '90px', textAlign: 'right',
                        }}>
                          📅 {item.date_scanned ? new Date(item.date_scanned).toLocaleDateString() : '—'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* PERMISSION OVERRIDE EDITOR (inline per user) */}
      {permEditor && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.4)', zIndex: 10000,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{
            background: '#fff', borderRadius: '12px', padding: '20px',
            maxWidth: '480px', width: '90vw', maxHeight: '80vh', overflowY: 'auto',
          }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', color: '#2d3748' }}>
              Permission Overrides for {employees.find(e => e.id === permEditor)?.username}
            </h3>
            <p style={{ fontSize: '12px', color: '#718096', margin: '0 0 12px 0' }}>
              Leave blank to use role default.
            </p>
            {RESOURCES.map(res => {
              const emp = employees.find(e => e.id === permEditor);
              const currentOverride = (emp?.permission_overrides || {})[res];
              return (
                <div key={res} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', fontSize: '13px' }}>
                  <span style={{ width: '100px', fontWeight: 600, color: '#4a5568', textTransform: 'capitalize' }}>{res}</span>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button
                      onClick={async () => {
                        const emp2 = employees.find(e => e.id === permEditor);
                        const currentOverrides = emp2?.permission_overrides || {};
                        const newOverrides = { ...currentOverrides, [res]: 'none' };
                        try {
                          const { updateUserPermissions } = await import('../utilities/api');
                          await updateUserPermissions(permEditor, newOverrides);
                          setMessage({ type: 'success', text: 'Override saved' });
                          loadStaff();
                        } catch (err) {
                          setMessage({ type: 'error', text: err.message });
                        }
                      }}
                      style={{
                        padding: '4px 8px', fontSize: '11px', fontWeight: 600,
                        border: '1px solid #e2e8f0', borderRadius: '4px',
                        background: currentOverride === 'none' ? '#e53e3e' : '#fff',
                        color: currentOverride === 'none' ? '#fff' : '#4a5568',
                        cursor: 'pointer',
                      }}>
                      none
                    </button>
                    <button
                      onClick={async () => {
                        const emp2 = employees.find(e => e.id === permEditor);
                        const currentOverrides = emp2?.permission_overrides || {};
                        const newOverrides = { ...currentOverrides, [res]: 'read' };
                        try {
                          const { updateUserPermissions } = await import('../utilities/api');
                          await updateUserPermissions(permEditor, newOverrides);
                          setMessage({ type: 'success', text: 'Override saved' });
                          loadStaff();
                        } catch (err) {
                          setMessage({ type: 'error', text: err.message });
                        }
                      }}
                      style={{
                        padding: '4px 8px', fontSize: '11px', fontWeight: 600,
                        border: '1px solid #e2e8f0', borderRadius: '4px',
                        background: currentOverride === 'read' ? '#3182ce' : '#fff',
                        color: currentOverride === 'read' ? '#fff' : '#4a5568',
                        cursor: 'pointer',
                      }}>
                      read
                    </button>
                    <button
                      onClick={async () => {
                        const emp2 = employees.find(e => e.id === permEditor);
                        const currentOverrides = emp2?.permission_overrides || {};
                        const newOverrides = { ...currentOverrides, [res]: 'write' };
                        try {
                          const { updateUserPermissions } = await import('../utilities/api');
                          await updateUserPermissions(permEditor, newOverrides);
                          setMessage({ type: 'success', text: 'Override saved' });
                          loadStaff();
                        } catch (err) {
                          setMessage({ type: 'error', text: err.message });
                        }
                      }}
                      style={{
                        padding: '4px 8px', fontSize: '11px', fontWeight: 600,
                        border: '1px solid #e2e8f0', borderRadius: '4px',
                        background: currentOverride === 'write' ? '#38a169' : '#fff',
                        color: currentOverride === 'write' ? '#fff' : '#4a5568',
                        cursor: 'pointer',
                      }}>
                      write
                    </button>
                    <button
                      onClick={async () => {
                        const emp2 = employees.find(e => e.id === permEditor);
                        const currentOverrides = emp2?.permission_overrides || {};
                        const newOverrides = { ...currentOverrides, [res]: 'admin' };
                        try {
                          const { updateUserPermissions } = await import('../utilities/api');
                          await updateUserPermissions(permEditor, newOverrides);
                          setMessage({ type: 'success', text: 'Override saved' });
                          loadStaff();
                        } catch (err) {
                          setMessage({ type: 'error', text: err.message });
                        }
                      }}
                      style={{
                        padding: '4px 8px', fontSize: '11px', fontWeight: 600,
                        border: '1px solid #e2e8f0', borderRadius: '4px',
                        background: currentOverride === 'admin' ? '#805ad5' : '#fff',
                        color: currentOverride === 'admin' ? '#fff' : '#4a5568',
                        cursor: 'pointer',
                      }}>
                      admin
                    </button>
                  </div>
                  <button
                    onClick={async () => {
                      const emp2 = employees.find(e => e.id === permEditor);
                      const currentOverrides = emp2?.permission_overrides || {};
                      const { [res]: _, ...rest } = currentOverrides;
                      try {
                        const { updateUserPermissions } = await import('../utilities/api');
                        await updateUserPermissions(permEditor, Object.keys(rest).length > 0 ? rest : null);
                        setMessage({ type: 'success', text: 'Override cleared' });
                        loadStaff();
                      } catch (err) {
                        setMessage({ type: 'error', text: err.message });
                      }
                    }}
                    style={{
                      padding: '4px 8px', fontSize: '11px',
                      background: 'none', border: 'none', color: '#718096',
                      cursor: 'pointer', textDecoration: 'underline',
                    }}>
                    clear
                  </button>
                </div>
              );
            })}
            <button onClick={() => setPermEditor(null)}
              style={{
                marginTop: '12px', width: '100%', padding: '10px',
                background: '#edf2f7', color: '#4a5568', border: 'none',
                borderRadius: '8px', fontWeight: 600, cursor: 'pointer',
              }}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
