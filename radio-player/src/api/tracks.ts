import { apiFetch } from './client';

export interface Track {
  id: string;
  title: string | null;
  durationSeconds: number | null;
}

export async function getTrackList(): Promise<Track[]> {
  const res = await apiFetch('/tracks-list');
  if (!res.ok) throw new Error('Failed to fetch tracks');
  const data = await res.json();
  return data.tracks;
}

export async function getTrackUrl(
  trackId: string,
): Promise<{ url: string }> {
  const res = await apiFetch(`/tracks-url/${trackId}`);
  if (res.status === 409) {
    throw new Error('TRACK_UNAVAILABLE');
  }
  if (!res.ok) throw new Error('Failed to fetch track URL');
  return res.json();
}

export async function reportTrack(trackId: string): Promise<void> {
  const res = await apiFetch('/tracks-report', {
    method: 'POST',
    body: JSON.stringify({ trackId }),
  });
  if (!res.ok) throw new Error('Failed to report track');
}

export async function logPlayEvent(_trackId: string): Promise<void> {
  // Play event is logged server-side when fetching the URL,
  // so this is a no-op on the client. Kept for API completeness.
}
