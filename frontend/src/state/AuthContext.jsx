import { createContext, useContext, useMemo, useState } from 'react';

const AuthContext = createContext(null);

const readJson = (key, fallback) => {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
};

export function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem('nur_token') || '');
  const [user, setUser] = useState(readJson('nur_user', null));

  const login = (nextToken, nextUser) => {
    localStorage.setItem('nur_token', nextToken);
    localStorage.setItem('nur_user', JSON.stringify(nextUser));
    setToken(nextToken);
    setUser(nextUser);
  };

  const logout = () => {
    localStorage.removeItem('nur_token');
    localStorage.removeItem('nur_user');
    setToken('');
    setUser(null);
  };

  const updateUser = (nextUser) => {
    localStorage.setItem('nur_user', JSON.stringify(nextUser));
    setUser(nextUser);
  };

  const value = useMemo(
    () => ({ token, user, isLoggedIn: Boolean(token), login, logout, updateUser }),
    [token, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return value;
}
