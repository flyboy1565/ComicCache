import React, { useState, useEffect } from 'react';
import { fetchUsers, fetchRoles, fetchAdminStats, resetPassword, updateUserRole, deleteRole } from '../utilities/api';
import Skeleton from '../components/Skeleton';
import styles from './AdminScreen.module.css';

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
    <div className={styles.container}>
      <div className={styles.topBar}>
        <button onClick={onBack} className={styles.backBtn}>
          ←
        </button>
        <h2 className={styles.pageTitle}>Admin Panel</h2>
      </div>

      {message && (
        <div className={`${styles.message} ${message.type === 'success' ? styles.messageSuccess : styles.messageError}`}>
          {message.text}
        </div>
      )}

      <div className={styles.tabBar}>
        <button onClick={() => setTab('staff')}
          className={`${styles.tabBtn} ${tab === 'staff' ? `${styles.tabActive} ${styles.tabStaffActive}` : styles.tabInactive}`}>
          Staff
        </button>
        <button onClick={() => setTab('roles')}
          className={`${styles.tabBtn} ${tab === 'roles' ? `${styles.tabActive} ${styles.tabRolesActive}` : styles.tabInactive}`}>
          Roles
        </button>
        <button onClick={() => { setTab('stats'); if (!stats) loadStats(); }}
          className={`${styles.tabBtn} ${tab === 'stats' ? `${styles.tabActive} ${styles.tabStatsActive}` : styles.tabInactive}`}>
          Stats
        </button>
      </div>

      {tab === 'staff' && (
        <>
          {loading ? (
            <div className={styles.loadingText}><Skeleton width="100%" height={48} count={4} /></div>
          ) : employees.length === 0 ? (
            <div className={styles.emptyText}>No accounts yet.</div>
          ) : (
            <div className={styles.staffList}>
              {employees.map((emp) => {
                const rColor = roleColor(emp.role_display);
                return (
                  <div key={emp.id} className={styles.staffCard}>
                    <div className={styles.staffAvatar} style={{ background: rColor }}>
                      {(emp.username || '?')[0].toUpperCase()}
                    </div>
                    <div className={styles.staffInfo}>
                      <div className={styles.staffName}>{emp.username}</div>
                      <div className={styles.staffRole}>{emp.role_display} ({emp.role})</div>
                    </div>
                    <select value={emp.role_id} onChange={e => handleRoleChange(emp.id, parseInt(e.target.value))}
                      className={styles.roleSelect}>
                      {roles.map(r => (
                        <option key={r.id} value={r.id}>{r.display_name}</option>
                      ))}
                    </select>
                    {emp.must_change_password && (
                      <span className={styles.pendingBadge}>Pending</span>
                    )}
                    <button onClick={() => setPermEditor(permEditor === emp.id ? null : emp.id)}
                      className={`${styles.actionBtnSmall} ${permEditor === emp.id ? styles.permBtnActive : styles.permBtnDefault}`}>
                      Permissions
                    </button>
                    <button onClick={() => handleReset(emp.id)} disabled={resetting === emp.id}
                      className={`${styles.actionBtnSmall} ${styles.resetBtn}`}>
                      {resetting === emp.id ? '...' : 'Reset'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {tab === 'roles' && (
        <>
          <div className={styles.roleFilterRow}>
            {roles.map(r => (
              <button key={r.id} onClick={() => setRoleEditor(roleEditor?.id === r.id ? null : r)}
                className={`${styles.roleFilterBtn} ${roleEditor?.id === r.id ? '' : styles.roleFilterInactive}`}
                style={roleEditor?.id === r.id ? { background: roleColor(r.display_name), color: '#fff' } : {}}>
                {r.display_name}
                <span style={{ fontSize: '11px', marginLeft: '6px', opacity: 0.7 }}>
                  ({r.user_count})
                </span>
              </button>
            ))}
          </div>

          {roleEditor && (
            <div className={styles.roleEditorCard}>
              <div className={styles.roleEditorHeader}>
                <h3 className={styles.roleEditorTitle}>
                  {roleEditor.display_name} ({roleEditor.name})
                </h3>
                <div className={styles.roleEditorActions}>
                  {!roleEditor.is_system && (
                    <button onClick={() => handleDeleteRole(roleEditor.id, roleEditor.display_name)}
                      className={styles.deleteRoleBtn}>
                      Delete
                    </button>
                  )}
                  <button onClick={() => setRoleEditor(null)}
                    className={`${styles.actionBtnSmall} ${styles.permBtnDefault}`}>
                    Close
                  </button>
                </div>
              </div>
              <div>
                {RESOURCES.map(res => (
                  <div key={res} className={styles.permissionRow}>
                    <span className={styles.permissionLabel}>{res}</span>
                    <div className={styles.permissionBtns}>
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
                          className={`${styles.permLevelBtn} ${roleEditor.permissions[res] === a ? styles.permLevelActive : styles.permLevelInactive}`}>
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

      {tab === 'stats' && (
        <div>
          {statsLoading ? (
            <div className={styles.loadingText}><Skeleton width="100%" height={24} count={5} /></div>
          ) : !stats ? (
            <div className={styles.emptyText}>Could not load stats.</div>
          ) : (
            <div className={styles.statsSection}>
              <div className={styles.statCard}>
                <h3 className={styles.statCardTitle}>
                  🔍 Most Searched Covers
                </h3>
                {stats.top_searched.length === 0 ? (
                  <div className={styles.emptyText}>No cover lookups yet.</div>
                ) : (
                  <div>
                    {stats.top_searched.map((item, i) => (
                      <div key={i} className={`${styles.statItem} ${i % 2 === 0 ? styles.statItemEven : styles.statItemOdd}`}>
                        <span className={styles.statRank}>#{i + 1}</span>
                        <span className={styles.statTitle}>
                          {item.series_title} <span style={{ color: '#718096' }}>#{item.issue_number}</span>
                        </span>
                        <span className={styles.statPublisher}>{item.publisher}</span>
                        <span className={styles.statCount}>🔍 {item.hit_count}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className={styles.statCard}>
                <h3 className={styles.statCardTitle}>
                  ⏳ Oldest Owned Comics
                </h3>
                {stats.oldest_comics.length === 0 ? (
                  <div className={styles.emptyText}>No comics in collection yet.</div>
                ) : (
                  <div>
                    {stats.oldest_comics.map((item, i) => (
                      <div key={i} className={`${styles.statItem} ${i % 2 === 0 ? styles.statItemEven : styles.statItemOdd}`}>
                        <span className={styles.statRank}>#{i + 1}</span>
                        <span className={styles.statTitle}>
                          {item.title} <span style={{ color: '#718096' }}>#{item.issue_number}</span>
                        </span>
                        <span className={styles.statPublisher}>{item.publisher}</span>
                        <span style={{ color: '#718096', fontSize: '12px', width: '140px', textAlign: 'right', flexShrink: 0 }}>
                          📦 {item.box_name || '—'}
                        </span>
                        <span className={styles.statDate}>
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

      {permEditor && (
        <div className={styles.permOverlay}>
          <div className={styles.permModal}>
            <h3 className={styles.permModalTitle}>
              Permission Overrides for {employees.find(e => e.id === permEditor)?.username}
            </h3>
            <p className={styles.permModalDesc}>
              Leave blank to use role default.
            </p>
            {RESOURCES.map(res => {
              const emp = employees.find(e => e.id === permEditor);
              const currentOverride = (emp?.permission_overrides || {})[res];
              return (
                <div key={res} className={styles.permRow}>
                  <span className={styles.permResource}>{res}</span>
                  <div className={styles.permOpts}>
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
                      className={`${styles.permOptBtn} ${currentOverride === 'none' ? styles.permLevelActive : styles.permLevelInactive}`}
                      style={currentOverride === 'none' ? { background: '#e53e3e' } : {}}>
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
                      className={`${styles.permOptBtn} ${currentOverride === 'read' ? styles.permLevelActive : styles.permLevelInactive}`}
                      style={currentOverride === 'read' ? { background: '#3182ce' } : {}}>
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
                      className={`${styles.permOptBtn} ${currentOverride === 'write' ? styles.permLevelActive : styles.permLevelInactive}`}
                      style={currentOverride === 'write' ? { background: '#38a169' } : {}}>
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
                      className={`${styles.permOptBtn} ${currentOverride === 'admin' ? styles.permLevelActive : styles.permLevelInactive}`}
                      style={currentOverride === 'admin' ? { background: '#805ad5' } : {}}>
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
                    className={styles.permClearBtn}>
                    clear
                  </button>
                </div>
              );
            })}
            <button onClick={() => setPermEditor(null)} className={styles.closeModalBtn}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
