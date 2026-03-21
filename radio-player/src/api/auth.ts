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
  const text = await res.text();
  console.log('[radio] auth-login response:', res.status, text.substring(0, 200));
  if (!text) {
    throw new Error('Empty response from server — is the edge function deployed?');
  }
  const data = JSON.parse(text);
  if (!res.ok) {
    throw new Error(data.error || 'Login failed');
  }
  return data;
}
