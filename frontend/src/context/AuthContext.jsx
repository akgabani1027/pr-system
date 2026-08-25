import React, { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

export const PERSONAS = {
  admin: {
    id: 'usr-admin-1',
    name: 'Sarah Connor (Admin)',
    email: 'admin@prsystem.com',
    department: 'Executive / Operations',
    role: 'admin',
    is_active: true
  },
  manager: {
    id: 'usr-manager-1',
    name: 'Alex Rivera (Manager)',
    email: 'manager@prsystem.com',
    department: 'Engineering',
    role: 'manager',
    is_active: true
  },
  employee: {
    id: 'usr-employee-1',
    name: 'Jordan Lee (Employee)',
    email: 'employee@prsystem.com',
    department: 'Engineering',
    role: 'employee',
    is_active: true
  }
};

export const AuthProvider = ({ children }) => {
  // Default to Admin or saved persona
  const savedRole = localStorage.getItem('pr_active_role') || 'admin';
  const [user, setUser] = useState(PERSONAS[savedRole] || PERSONAS.admin);

  const switchRole = (roleKey) => {
    const selected = PERSONAS[roleKey] || PERSONAS.admin;
    setUser(selected);
    localStorage.setItem('pr_active_role', roleKey);
    localStorage.setItem('pr_auth_token', selected.id);
  };

  const hasRole = (roles) => {
    if (!user) return true;
    if (Array.isArray(roles)) {
      return roles.includes(user.role);
    }
    return user.role === roles;
  };

  return (
    <AuthContext.Provider value={{ user, switchRole, hasRole, loading: false, PERSONAS }}>
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
