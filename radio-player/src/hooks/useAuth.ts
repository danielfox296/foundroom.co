import { useState, useCallback } from 'react';
import { login as apiLogin } from '../api/auth';

function isTokenValid(): boolean {
  const token = localStorage.getItem('radio_token');
  if (!token) return false;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]!));
    return payload.exp > Date.now() / 1000;
  } catch {
    return false;
  }
}

function getUsername(): string {
  return localStorage.getItem('radio_username') || '';
}

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(isTokenValid);
  const [username, setUsername] = useState(getUsername);

  const login = useCallback(async (code: string) => {
    const { token, username: name } = await apiLogin(code);
    localStorage.setItem('radio_token', token);
    localStorage.setItem('radio_username', name);
    setUsername(name);
    setIsAuthenticated(true);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('radio_token');
    localStorage.removeItem('radio_username');
    setIsAuthenticated(false);
    setUsername('');
  }, []);

  return { isAuthenticated, username, login, logout };
}
