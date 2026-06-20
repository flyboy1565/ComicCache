import React, { useState, useEffect, useRef } from 'react';
import { fetchUsers } from '../utilities/api';
import styles from './UserMenu.module.css';

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
    <div ref={menuRef} className={styles.wrapper}>
      <button onClick={() => setOpen(!open)} className={styles.trigger}>
        <div className={styles.avatar} style={{ background: badgeColor }}>
          {initial}
        </div>
        <span className={styles.username}>{user.username}</span>
        <span className={styles.arrow}>{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className={styles.dropdown}>
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
            <div className={styles.employeeSection}>
              <div className={styles.employeeHeader}>
                <span className={styles.employeeLabel}>Employees</span>
                <button onClick={() => { setOpen(false); onAddStaff(); }}
                  className={styles.addBtn} title="Add Staff">
                  + Add
                </button>
              </div>
              {employees.length === 0 ? (
                <div className={styles.noEmployees}>No accounts yet</div>
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

          {canManageUsers && (
            <button onClick={() => { setOpen(false); onNavigate(); }} className={styles.menuBtn}>
              Admin Panel
            </button>
          )}

          <button onClick={onLogout} className={`${styles.menuBtn} ${styles.signOutBtn}`}>
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
}
