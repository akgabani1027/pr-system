import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('pr_auth_token') || '');
  const [loading, setLoading] = useState(true);

  // Run on mount only to restore active session
  useEffect(() => {
    const restoreSession = async () => {
      const savedToken = localStorage.getItem('pr_auth_token');
      if (savedToken) {
        try {
          const res = await authAPI.getMe();
          if (res && res.data) {
            setUser(res.data);
            setToken(savedToken);
          } else {
            setUser(null);
            setToken('');
          }
        } catch (err) {
          console.warn("Session restore failed, clearing token:", err);
          localStorage.removeItem('pr_auth_token');
          setUser(null);
          setToken('');
        }
      }
      setLoading(false);
    };

    restoreSession();
  }, []);

  const login = async (email, password) => {
    const res = await authAPI.login({ email, password });
    if (res && res.data) {
      const { access_token, user: userData } = res.data;
      localStorage.setItem('pr_auth_token', access_token);
      setToken(access_token);
      setUser(userData);
      return userData;
    }
    throw new Error("Invalid response from login service");
  };

  const register = async (name, email, password, department, role) => {
    const res = await authAPI.register({ name, email, password, department, role });
    if (res && res.data) {
      const { access_token, user: userData } = res.data;
      localStorage.setItem('pr_auth_token', access_token);
      setToken(access_token);
      setUser(userData);
      return userData;
    }
    throw new Error("Invalid response from register service");
  };

  const logout = () => {
    localStorage.removeItem('pr_auth_token');
    setToken('');
    setUser(null);
  };

  const hasRole = (roles) => {
    if (!user) return false;
    if (Array.isArray(roles)) {
      return roles.includes(user.role);
    }
    return user.role === roles;
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
