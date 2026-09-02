import { useState, type CSSProperties, type FormEvent } from 'react';
import { login } from '../auth';
import { WEDDING } from '../wedding';

/**
 * Login screen shown in place of the admin dashboard when there's no session.
 * Styled inline (sage palette) so it needs no additions to index.css.
 */
export default function LoginPage({ onSuccess }: { onSuccess: () => void }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await login(username.trim(), password);
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={styles.wrap}>
      <form style={styles.card} onSubmit={submit}>
        <p style={styles.eyebrow}>The Wedding Of</p>
        <h1 style={styles.title}>
          {WEDDING.groom} <span style={styles.amp}>&amp;</span> {WEDDING.bride}
        </h1>
        <div style={styles.divider} />
        <p style={styles.sub}>Guest &amp; Invitation Manager</p>
        <p style={styles.note}>This dashboard is private. Please sign in.</p>

        <label style={styles.label}>
          Username
          <input
            style={styles.input}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            autoFocus
            required
          />
        </label>

        <label style={styles.label}>
          Password
          <input
            style={styles.input}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
        </label>

        {error && <p style={styles.error}>{error}</p>}

        <button style={styles.button} type="submit" disabled={busy}>
          {busy ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  wrap: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px',
    background: 'linear-gradient(160deg, #eef4ec 0%, #dce8d8 100%)',
  },
  card: {
    width: '100%',
    maxWidth: 380,
    background: '#fff',
    borderRadius: 16,
    padding: '32px 28px',
    boxShadow: '0 12px 40px rgba(63, 107, 74, 0.15)',
    border: '1px solid #d7e3d2',
    textAlign: 'center',
  },
  eyebrow: {
    margin: 0,
    letterSpacing: '0.18em',
    textTransform: 'uppercase',
    fontSize: 11,
    color: '#7c9a7e',
  },
  title: { margin: '6px 0 0', fontSize: 30, color: '#3f6b4a', fontWeight: 700 },
  amp: { color: '#a8b98f' },
  divider: {
    width: 48,
    height: 2,
    background: '#c3d3ba',
    margin: '14px auto',
    borderRadius: 2,
  },
  sub: { margin: 0, color: '#6b7d6b', fontSize: 14 },
  note: { margin: '4px 0 20px', color: '#93a393', fontSize: 13 },
  label: {
    display: 'block',
    textAlign: 'left',
    fontSize: 13,
    color: '#4f6b52',
    fontWeight: 600,
    marginBottom: 14,
  },
  input: {
    width: '100%',
    boxSizing: 'border-box',
    marginTop: 6,
    padding: '11px 12px',
    borderRadius: 9,
    border: '1px solid #cdddc6',
    fontSize: 15,
    outlineColor: '#5a7d5a',
  },
  error: {
    margin: '0 0 12px',
    color: '#b23b3b',
    fontSize: 13,
    background: '#fbeaea',
    padding: '8px 10px',
    borderRadius: 8,
  },
  button: {
    width: '100%',
    padding: '12px',
    borderRadius: 10,
    border: 'none',
    background: '#4f7a5b',
    color: '#fff',
    fontSize: 15,
    fontWeight: 600,
    cursor: 'pointer',
    marginTop: 4,
  },
};
