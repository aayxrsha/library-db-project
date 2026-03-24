import { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/entityServices';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [employee, setEmployee] = useState(null);
  const [accountType, setAccountType] = useState('employee');
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('lms_token');
    const emp   = localStorage.getItem('lms_employee');
    const type  = localStorage.getItem('lms_account_type') || 'employee';
    if (token && emp) setEmployee(JSON.parse(emp));
    setAccountType(type);
    setLoading(false);
  }, []);

  const login = async ({ accountType: type, id, password }) => {
    const isMember = type === 'member';
    const credentials = isMember
      ? { Member_Id: id, password }
      : { Employee_ID: id, password };

    const { data } = isMember
      ? await authService.memberLogin(credentials)
      : await authService.login(credentials);

    const user = data.employee || data.member;
    localStorage.setItem('lms_token',    data.token);
    localStorage.setItem('lms_employee', JSON.stringify(user));
    localStorage.setItem('lms_account_type', type);
    setEmployee(user);
    setAccountType(type);
    return user;
  };

  const logout = () => {
    localStorage.removeItem('lms_token');
    localStorage.removeItem('lms_employee');
    localStorage.removeItem('lms_account_type');
    setEmployee(null);
    setAccountType('employee');
  };

  // Helper: check if current user has one of the given roles
  const hasRole = (...roles) => roles.includes(employee?.role);

  const isMember = accountType === 'member' || employee?.role === 'Member';

  return (
    <AuthContext.Provider value={{ employee, login, logout, hasRole, loading, accountType, isMember }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
