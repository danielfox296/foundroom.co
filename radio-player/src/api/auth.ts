import { apiFetch } from './client';

interface LoginResponse {
  token: string;
  username: string;
}

export async function login(
  code: string,
): Promise<LoginResponse> {
  const res = await apiFetch('/auth-login', {
    method: 'POST',
    body: JSON.stringify({ code }),
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || 'Login failed');
  }
  return res.json();
}
