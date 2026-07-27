import React, { useState, useEffect, useRef } from 'react';
import { fetchUsers } from '../utilities/api';
import styles from './UserPanel.module.css';

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

const THEMES = [
  { id: 'default',  label: 'Default' },
  { id: 'batman',   label: 'Batman' },
  { id: 'superman', label: 'Superman' },
  { id: 'msmarvel', label: 'Ms. Marvel' },
  { id: 'starlord', label: 'Star-Lord' },
];

export default function UserPanel({ user, onClose, onLogout, onAddStaff, onNavigate, theme, onThemeChange }) {
  const [employees, setEmployees] = useState([]);
  const swipeStartX = useRef(0);

  const canManageUsers = user.role === 'admin' || user.role === 'owner';

  useEffect(() => {
    if (canManageUsers) {
      fetchUsers()
        .then(setEmployees)
        .catch(() => setEmployees([]));
    }
  }, [canManageUsers]);

  const handleTouchStart = (e) => {
    swipeStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e) => {
    const dx = e.changedTouches[0].clientX - swipeStartX.current;
    if (dx > 80) onClose();
  };

  const initial = (user.username || '?')[0].toUpperCase();
  const badgeColor = roleColor(user.role_display);

  return (
    <>
      <div onClick={onClose} className={styles.overlay} />
      <div
        className={styles.drawer}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div className={styles.drawerHeader}>
          <div className={styles.headerTop}>
            <div>
              <span className={styles.headerLabel}>ACCOUNT</span>
              <h2 className={styles.drawerTitle}>User Profile</h2>
            </div>
            <button onClick={onClose} className={styles.closeBtn}>✕</button>
          </div>
        </div>

        <div className={styles.contentArea}>
          <div className={styles.userSection}>
            <div className={styles.userAvatarLarge} style={{ background: badgeColor }}>
              {initial}
            </div>
            <div className={styles.userInfo}>
              <div className={styles.userName}>{user.username}</div>
              <div className={styles.userEmail}>{user.email}</div>
            </div>
            <span className={styles.userRoleBadge} style={{ color: badgeColor, border: `1px solid ${badgeColor}` }}>
              {user.role_display || user.role}
            </span>
          </div>

          {canManageUsers && (
            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <span className={styles.sectionLabel}>Employees</span>
                <button onClick={() => { onClose(); onAddStaff(); }} className={styles.addBtn}>+ Add</button>
              </div>
              {employees.length === 0 ? (
                <div className={styles.emptyText}>No accounts yet</div>
              ) : (
                employees.filter(e => e.id !== user.id).map((emp) => (
                  <div key={emp.id} className={styles.employeeRow}>
                    <div className={styles.employeeAvatar} style={{ background: roleColor(emp.role_display) }}>
                      {(emp.username || '?')[0].toUpperCase()}
                    </div>
                    <span className={styles.employeeName}>{emp.username}</span>
                    <span className={styles.employeeRoleLabel}>{emp.role_display}</span>
                  </div>
                ))
              )}
            </div>
          )}

          <div className={styles.section}>
            <span className={styles.sectionLabel}>Theme</span>
            <select
              value={theme}
              onChange={(e) => onThemeChange(e.target.value)}
              className={styles.themeSelect}
            >
              {THEMES.map((t) => (
                <option key={t.id} value={t.id}>{t.label}</option>
              ))}
            </select>
          </div>

          {canManageUsers && (
            <button onClick={() => { onClose(); onNavigate(); }} className={styles.adminBtn}>
              ⚙️ Admin Panel
            </button>
          )}

          <button onClick={onLogout} className={styles.signOutBtn}>
            Sign Out
          </button>
        </div>
      </div>
    </>
  );
}
