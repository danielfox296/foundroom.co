import { apiFetch } from './client';

export type Resource = 'tracks' | 'users' | 'play_events' | 'reports';

export interface ListParams {
  resource: Resource;
  limit?: number;
  offset?: number;
  orderBy?: string;
  orderDir?: 'asc' | 'desc';
  filterCol?: string;
  filterVal?: string;
}

export interface ListResult<T = Record<string, unknown>> {
  data: T[];
  count: number;
}

export async function adminList<T = Record<string, unknown>>(
  params: ListParams,
): Promise<ListResult<T>> {
  const q = new URLSearchParams();
  q.set('resource', params.resource);
  if (params.limit) q.set('limit', String(params.limit));
  if (params.offset) q.set('offset', String(params.offset));
  if (params.orderBy) q.set('order_by', params.orderBy);
  if (params.orderDir) q.set('order_dir', params.orderDir);
  if (params.filterCol) q.set('filter_col', params.filterCol);
  if (params.filterVal !== undefined) q.set('filter_val', params.filterVal);

  const res = await apiFetch(`/admin?${q.toString()}`);
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Admin list failed');
  }
  return res.json();
}

export async function adminUpdate(
  resource: Resource,
  id: string,
  body: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const q = new URLSearchParams({ resource, id });
  const res = await apiFetch(`/admin?${q.toString()}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Admin update failed');
  }
  const result = await res.json();
  return result.data;
}

export async function adminCreate(
  resource: Resource,
  body: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const q = new URLSearchParams({ resource });
  const res = await apiFetch(`/admin?${q.toString()}`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Admin create failed');
  }
  const result = await res.json();
  return result.data;
}

export async function adminDelete(
  resource: Resource,
  id: string,
): Promise<void> {
  const q = new URLSearchParams({ resource, id });
  const res = await apiFetch(`/admin?${q.toString()}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Admin delete failed');
  }
}
