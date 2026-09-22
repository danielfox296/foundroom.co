import { useState, type FormEvent } from 'react';
import styles from './AuthGate.module.css';

interface AuthGateProps {
  onLogin: (code: string) => Promise<void>;
}

export function AuthGate({ onLogin }: AuthGateProps) {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!code.trim() || loading) return;
    setError('');
    setLoading(true);
    try {
      await onLogin(code.trim());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Radio</h1>
      <form className={styles.form} onSubmit={handleSubmit}>
        <input
          className={styles.input}
          type="text"
          placeholder="access code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          autoFocus
          disabled={loading}
          autoComplete="off"
          spellCheck={false}
        />
        <button className={styles.button} type="submit" disabled={loading}>
          {loading ? '...' : 'enter'}
        </button>
      </form>
      {error && <p className={styles.error}>{error}</p>}
    </div>
  );
}
