const BASE_URL = import.meta.env.VITE_API_BASE_URL;
const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export async function apiFetch(
  path: string,
  options: RequestInit = {},
): Promise<Response> {
  const token = localStorage.getItem('radio_token');
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      apikey: ANON_KEY,
      Authorization: `Bearer ${token || ANON_KEY}`,
      ...options.headers,
    },
  });
  if (res.status === 401) {
    localStorage.removeItem('radio_token');
    localStorage.removeItem('radio_username');
    window.location.reload();
  }
  return res;
}
