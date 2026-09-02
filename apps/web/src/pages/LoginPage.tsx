import {
  useCallback,
  useRef,
  useState,
  type ClipboardEvent,
  type CSSProperties,
  type KeyboardEvent,
} from 'react';
import { login } from '../auth';
import { WEDDING } from '../wedding';

const LEN = 4;

/**
 * Login screen: a 4-digit PIN pad shown in place of the admin dashboard when
 * there's no session. Styled inline (sage palette) so it needs no additions to
 * index.css. Auto-submits once all four digits are entered.
 */
export default function LoginPage({ onSuccess }: { onSuccess: () => void }) {
  const [digits, setDigits] = useState<string[]>(Array(LEN).fill(''));
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  const focusBox = (i: number) => inputs.current[i]?.focus();

  const submit = useCallback(
    async (pin: string) => {
      setBusy(true);
      setError(null);
      try {
        await login(pin);
        onSuccess();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Login failed');
        setDigits(Array(LEN).fill(''));
        focusBox(0);
      } finally {
        setBusy(false);
      }
    },
    [onSuccess],
  );

  function setDigit(i: number, value: string) {
    const d = value.replace(/\D/g, '').slice(-1); // keep last typed digit only
    const next = [...digits];
    next[i] = d;
    setDigits(next);
    if (d && i < LEN - 1) focusBox(i + 1);
    if (next.every((x) => x !== '')) submit(next.join(''));
  }

  function onKeyDown(i: number, e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !digits[i] && i > 0) {
      const next = [...digits];
      next[i - 1] = '';
      setDigits(next);
      focusBox(i - 1);
      e.preventDefault();
    }
  }

  function onPaste(e: ClipboardEvent<HTMLInputElement>) {
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, LEN);
    if (!text) return;
    e.preventDefault();
    const next = Array(LEN).fill('');
    for (let i = 0; i < text.length; i++) next[i] = text[i];
    setDigits(next);
    if (text.length === LEN) submit(text);
    else focusBox(text.length);
  }

  return (
    <div style={styles.wrap}>
      <div style={styles.card}>
        <p style={styles.eyebrow}>The Wedding Of</p>
        <h1 style={styles.title}>
          {WEDDING.groom} <span style={styles.amp}>&amp;</span> {WEDDING.bride}
        </h1>
        <div style={styles.divider} />
        <p style={styles.sub}>Guest &amp; Invitation Manager</p>
        <p style={styles.note}>Enter your 4-digit PIN to continue.</p>

        <div style={styles.pinRow} onPaste={onPaste}>
          {digits.map((d, i) => (
            <input
              key={i}
              ref={(el) => {
                inputs.current[i] = el;
              }}
              value={d}
              onChange={(e) => setDigit(i, e.target.value)}
              onKeyDown={(e) => onKeyDown(i, e)}
              onFocus={(e) => e.target.select()}
              type="password"
              inputMode="numeric"
              autoComplete="off"
              maxLength={1}
              disabled={busy}
              aria-label={`PIN digit ${i + 1}`}
              autoFocus={i === 0}
              style={{
                ...styles.pinBox,
                ...(d ? styles.pinBoxFilled : null),
              }}
            />
          ))}
        </div>

        {error && <p style={styles.error}>{error}</p>}
        {busy && <p style={styles.checking}>Checking…</p>}
      </div>
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
  note: { margin: '4px 0 22px', color: '#93a393', fontSize: 13 },
  pinRow: {
    display: 'flex',
    gap: 12,
    justifyContent: 'center',
  },
  pinBox: {
    width: 52,
    height: 62,
    textAlign: 'center',
    fontSize: 26,
    fontWeight: 700,
    color: '#3f6b4a',
    border: '1px solid #cdddc6',
    borderRadius: 12,
    background: '#f7faf5',
    outlineColor: '#5a7d5a',
  },
  pinBoxFilled: {
    background: '#fff',
    borderColor: '#5a7d5a',
    boxShadow: '0 0 0 3px rgba(90, 125, 90, 0.15)',
  },
  error: {
    margin: '18px 0 0',
    color: '#b23b3b',
    fontSize: 13,
    background: '#fbeaea',
    padding: '8px 10px',
    borderRadius: 8,
  },
  checking: { margin: '16px 0 0', color: '#6b7d6b', fontSize: 13 },
};
