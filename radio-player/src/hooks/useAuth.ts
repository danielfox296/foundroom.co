import { useState, useCallback } from 'react';
import { login as apiLogin } from '../api/auth';

function getTokenPayload(): { valid: boolean; username: string; isAdmin: boolean } {
  const token = localStorage.getItem('radio_token');
  if (!token) return { valid: false, username: '', isAdmin: false };
  try {
    const payload = JSON.parse(atob(token.split('.')[1]!));
    const valid = payload.exp > Date.now() / 1000;
    return {
      valid,
      username: payload.username || '',
      isAdmin: payload.isAdmin === true,
    };
  } catch {
    return { valid: false, username: '', isAdmin: false };
  }
}

function getUsername(): string {
  return localStorage.getItem('radio_username') || '';
}

export function useAuth() {
  const initial = getTokenPayload();
  const [isAuthenticated, setIsAuthenticated] = useState(initial.valid);
  const [username, setUsername] = useState(getUsername);
  const [isAdmin, setIsAdmin] = useState(initial.isAdmin);

  const login = useCallback(async (code: string) => {
    const { token, username: name } = await apiLogin(code);
    localStorage.setItem('radio_token', token);
    localStorage.setItem('radio_username', name);
    setUsername(name);
    setIsAuthenticated(true);
    const payload = getTokenPayload();
    setIsAdmin(payload.isAdmin);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('radio_token');
    localStorage.removeItem('radio_username');
    setIsAuthenticated(false);
    setUsername('');
    setIsAdmin(false);
  }, []);

  return { isAuthenticated, username, isAdmin, login, logout };
}
