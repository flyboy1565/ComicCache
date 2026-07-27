import React, { useState, useEffect } from 'react';
import LoginScreen from './screens/LoginScreen';
import SetPasswordScreen from './screens/SetPasswordScreen';
import DashboardScreen from './screens/DashboardScreen';
import ComicBookLoader from './components/ComicBookLoader';
import { getToken, fetchMe, clearToken } from './utilities/api';
import './themes.css';

function getStoredTheme() {
  try {
    return localStorage.getItem('comiccache-theme') || 'default';
  } catch {
    return 'default';
  }
}

function applyTheme(theme) {
  const html = document.documentElement;
  html.className = html.className.replace(/theme-\w+/g, '').trim();
  if (theme !== 'default') {
    html.classList.add(`theme-${theme}`);
  }
}

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [passwordChangeRequired, setPasswordChangeRequired] = useState(false);
  const [theme, setTheme] = useState(getStoredTheme);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  useEffect(() => {
    const token = getToken();
    if (token) {
      fetchMe()
        .then(u => {
          setUser(u);
          setPasswordChangeRequired(u.must_change_password === true);
        })
        .catch(() => {
          clearToken();
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const handleLogin = (userData, mustChange) => {
    setUser(userData);
    setPasswordChangeRequired(mustChange === true);
  };

  const handlePasswordChangeComplete = () => {
    setPasswordChangeRequired(false);
  };

  const handleLogout = () => {
    clearToken();
    setUser(null);
    setPasswordChangeRequired(false);
  };

  const handleThemeChange = (newTheme) => {
    setTheme(newTheme);
    try {
      localStorage.setItem('comiccache-theme', newTheme);
    } catch {}
  };

  if (loading) {
    return <ComicBookLoader />;
  }

  if (!user) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  if (passwordChangeRequired) {
    return <SetPasswordScreen user={user} onComplete={handlePasswordChangeComplete} />;
  }

  return <DashboardScreen user={user} onLogout={handleLogout} theme={theme} onThemeChange={handleThemeChange} />;
}
