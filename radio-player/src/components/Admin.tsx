import { useState, useEffect, useCallback } from 'react';
import {
  adminList,
  adminUpdate,
  adminCreate,
  adminDelete,
  type Resource,
} from '../api/admin';
import styles from './Admin.module.css';

interface AdminProps {
  onBack: () => void;
  onLogout: () => void;
}

type Tab = { resource: Resource; label: string };

const TABS: Tab[] = [
  { resource: 'tracks', label: 'Tracks' },
  { resource: 'users', label: 'Users' },
  { resource: 'play_events', label: 'Play Events' },
  { resource: 'reports', label: 'Reports' },
];

// Column configs per resource
const COLUMNS: Record<Resource, { key: string; label: string; editable?: boolean; type?: string }[]> = {
  tracks: [
    { key: 'id', label: 'ID' },
    { key: 'filename', label: 'Filename', editable: true },
    { key: 'title', label: 'Title', editable: true },
    { key: 'duration_seconds', label: 'Duration', editable: true, type: 'number' },
    { key: 'flagged', label: 'Flagged', editable: true, type: 'boolean' },
    { key: 'flag_count', label: 'Flags' },
    { key: 'created_at', label: 'Created' },
  ],
  users: [
    { key: 'id', label: 'ID' },
    { key: 'username', label: 'Username', editable: true },
    { key: 'access_code', label: 'Access Code', editable: true },
    { key: 'active', label: 'Active', editable: true, type: 'boolean' },
    { key: 'is_admin', label: 'Admin', editable: true, type: 'boolean' },
    { key: 'created_at', label: 'Created' },
  ],
  play_events: [
    { key: 'id', label: 'ID' },
    { key: 'track_id', label: 'Track ID' },
    { key: 'user_id', label: 'User ID' },
    { key: 'started_at', label: 'Started At' },
  ],
  reports: [
    { key: 'id', label: 'ID' },
    { key: 'track_id', label: 'Track ID' },
    { key: 'user_id', label: 'User ID' },
    { key: 'reported_at', label: 'Reported At' },
  ],
};

// Which resources support create
const CREATABLE: Resource[] = ['tracks', 'users'];

const PAGE_SIZE = 50;

export function Admin({ onBack, onLogout }: AdminProps) {
  const [activeTab, setActiveTab] = useState<Resource>('tracks');
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sortCol, setSortCol] = useState('created_at');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  // Modal state
  const [editRow, setEditRow] = useState<Record<string, unknown> | null>(null);
  const [editValues, setEditValues] = useState<Record<string, string>>({});
  const [isCreating, setIsCreating] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await adminList({
        resource: activeTab,
        limit: PAGE_SIZE,
        offset: page * PAGE_SIZE,
        orderBy: sortCol,
        orderDir: sortDir,
      });
      setRows(result.data);
      setTotal(result.count);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [activeTab, page, sortCol, sortDir]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleTabChange = (resource: Resource) => {
    setActiveTab(resource);
    setPage(0);
    setSortCol('created_at');
    setSortDir('desc');
  };

  const handleSort = (col: string) => {
    if (sortCol === col) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortCol(col);
      setSortDir('desc');
    }
    setPage(0);
  };

  const columns = COLUMNS[activeTab];

  const openEdit = (row: Record<string, unknown>) => {
    setIsCreating(false);
    setEditRow(row);
    const vals: Record<string, string> = {};
    for (const col of columns) {
      if (col.editable) {
        vals[col.key] = row[col.key] == null ? '' : String(row[col.key]);
      }
    }
    setEditValues(vals);
  };

  const openCreate = () => {
    setIsCreating(true);
    setEditRow({});
    const vals: Record<string, string> = {};
    for (const col of columns) {
      if (col.editable) {
        vals[col.key] = col.type === 'boolean' ? 'false' : '';
      }
    }
    setEditValues(vals);
  };

  const handleSave = async () => {
    try {
      const body: Record<string, unknown> = {};
      for (const col of columns) {
        if (!col.editable) continue;
        const val = editValues[col.key];
        if (col.type === 'boolean') {
          body[col.key] = val === 'true';
        } else if (col.type === 'number') {
          body[col.key] = val ? Number(val) : null;
        } else {
          body[col.key] = val || null;
        }
      }

      if (isCreating) {
        await adminCreate(activeTab, body);
      } else {
        await adminUpdate(activeTab, editRow!.id as string, body);
      }
      setEditRow(null);
      fetchData();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await adminDelete(activeTab, id);
      fetchData();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const formatCell = (col: { key: string; type?: string }, value: unknown): string => {
    if (value == null) return '—';
    if (col.type === 'boolean') return value ? 'yes' : 'no';
    if (col.key.endsWith('_at') || col.key === 'created_at') {
      return new Date(value as string).toLocaleString();
    }
    return String(value);
  };

  const cellClass = (col: { type?: string }, value: unknown): string | undefined => {
    if (col.type !== 'boolean') return undefined;
    return value ? styles.badgeTrue : styles.badgeFalse;
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className={`${styles.container} admin-container`}>
      <div className={styles.header}>
        <span className={styles.title}>Admin</span>
        <div className={styles.headerRight}>
          <button className={styles.backBtn} onClick={onBack}>
            player
          </button>
          <button className={styles.logoutBtn} onClick={onLogout}>
            logout
          </button>
        </div>
      </div>

      <div className={styles.tabs}>
        {TABS.map((tab) => (
          <button
            key={tab.resource}
            className={`${styles.tab} ${activeTab === tab.resource ? styles.tabActive : ''}`}
            onClick={() => handleTabChange(tab.resource)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {error && <div className={styles.error}>{error}</div>}

      {CREATABLE.includes(activeTab) && (
        <button className={styles.addBtn} onClick={openCreate}>
          + add {activeTab.replace('_', ' ').replace(/s$/, '')}
        </button>
      )}

      {loading ? (
        <div className={styles.loading}>loading...</div>
      ) : (
        <>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  {columns.map((col) => (
                    <th key={col.key} onClick={() => handleSort(col.key)}>
                      {col.label}
                      {sortCol === col.key ? (sortDir === 'asc' ? ' ^' : ' v') : ''}
                    </th>
                  ))}
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id as string}>
                    {columns.map((col) => (
                      <td key={col.key}>
                        <span className={cellClass(col, row[col.key])}>
                          {formatCell(col, row[col.key])}
                        </span>
                      </td>
                    ))}
                    <td>
                      <div className={styles.actions}>
                        {columns.some((c) => c.editable) && (
                          <button
                            className={styles.actionBtn}
                            onClick={() => openEdit(row)}
                          >
                            edit
                          </button>
                        )}
                        <button
                          className={styles.dangerBtn}
                          onClick={() => handleDelete(row.id as string)}
                        >
                          delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={columns.length + 1} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                      no data
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className={styles.pagination}>
            <span>
              {total} row{total !== 1 ? 's' : ''} — page {page + 1}/{totalPages || 1}
            </span>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                className={styles.pageBtn}
                disabled={page === 0}
                onClick={() => setPage((p) => p - 1)}
              >
                prev
              </button>
              <button
                className={styles.pageBtn}
                disabled={page + 1 >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                next
              </button>
            </div>
          </div>
        </>
      )}

      {editRow && (
        <div className={styles.modal} onClick={() => setEditRow(null)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalTitle}>
              {isCreating ? 'Create' : 'Edit'} {activeTab.replace('_', ' ').replace(/s$/, '')}
            </div>
            {columns
              .filter((col) => col.editable)
              .map((col) => (
                <div key={col.key} className={styles.field}>
                  <label className={styles.fieldLabel}>{col.label}</label>
                  {col.type === 'boolean' ? (
                    <select
                      className={styles.fieldInput}
                      value={editValues[col.key] || 'false'}
                      onChange={(e) =>
                        setEditValues((v) => ({ ...v, [col.key]: e.target.value }))
                      }
                    >
                      <option value="true">yes</option>
                      <option value="false">no</option>
                    </select>
                  ) : (
                    <input
                      className={styles.fieldInput}
                      type={col.type === 'number' ? 'number' : 'text'}
                      value={editValues[col.key] || ''}
                      onChange={(e) =>
                        setEditValues((v) => ({ ...v, [col.key]: e.target.value }))
                      }
                    />
                  )}
                </div>
              ))}
            <div className={styles.modalActions}>
              <button className={styles.cancelBtn} onClick={() => setEditRow(null)}>
                cancel
              </button>
              <button className={styles.saveBtn} onClick={handleSave}>
                {isCreating ? 'create' : 'save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
