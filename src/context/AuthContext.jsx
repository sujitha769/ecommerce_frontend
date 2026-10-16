import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { loginUser, registerUser, fetchMe, tokenExpiry, getToken, MOCK } from '../api/client';
import { useToast } from './ToastContext';

const AuthContext = createContext(null);

const loadSession = () => {
  try {
    const user = JSON.parse(localStorage.getItem('shop_session'));
    const token = getToken();
    if (!user || !token) return null;
    const exp = tokenExpiry(token);
    if (exp && exp < Date.now()) return null; // token already expired
    return user;
  } catch {
    return null;
  }
};

export function AuthProvider({ children }) {
  const toast = useToast();
  const [user, setUser] = useState(loadSession);

  const clearSession = useCallback(() => {
    localStorage.removeItem('shop_session');
    localStorage.removeItem('shop_token');
    setUser(null);
  }, []);

  const persist = ({ user: u, token }) => {
    localStorage.setItem('shop_session', JSON.stringify(u));
    localStorage.setItem('shop_token', token);
    setUser(u);
  };

  const login = useCallback(async (creds) => persist(await loginUser(creds)), []);
  const register = useCallback(async (data) => persist(await registerUser(data)), []);
  const logout = useCallback(() => clearSession(), [clearSession]);

  // App open ayinappudu token still valid aa ani backend lo verify chestam
  useEffect(() => {
    if (!user || MOCK.AUTH) return;
    fetchMe().catch((e) => {
      if (e.status === 401 || e.status === 403) clearSession();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Token expire ayyaka auto logout (user-service token = 1 hour)
  useEffect(() => {
    if (!user) return undefined;
    const exp = tokenExpiry(getToken());
    if (!exp) return undefined;
    const ms = Math.max(0, exp - Date.now());
    const t = setTimeout(() => {
      clearSession();
      toast('Session expired. Please sign in again.', 'error');
    }, Math.min(ms, 2147483647));
    return () => clearTimeout(t);
  }, [user, clearSession, toast]);

  return <AuthContext.Provider value={{ user, login, register, logout }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
