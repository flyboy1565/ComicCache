import React, { useState, useEffect } from 'react';
import LoginScreen from './screens/LoginScreen';
import SetPasswordScreen from './screens/SetPasswordScreen';
import DashboardScreen from './screens/DashboardScreen';
import { getToken, fetchMe, clearToken } from './utilities/api';

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [passwordChangeRequired, setPasswordChangeRequired] = useState(false);

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

  if (loading) {
    return (
      <div style={{ fontFamily: 'sans-serif', textAlign: 'center', marginTop: '100px', color: '#718096' }}>
        Loading...
      </div>
    );
  }

  if (!user) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  if (passwordChangeRequired) {
    return <SetPasswordScreen user={user} onComplete={handlePasswordChangeComplete} />;
  }

  return <DashboardScreen user={user} onLogout={handleLogout} />;
}
