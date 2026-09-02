// Admin-login client. The dashboard is gated; the public e-invite pages are not.
// Same-origin in production (nginx proxies /api), so the session cookie is sent
// automatically — `credentials: 'include'` keeps it working if the API is ever
// hosted on a separate origin too.
const API = `${import.meta.env.VITE_API_URL ?? ''}/api`;

export interface Session {
  authenticated: boolean;
  username: string | null;
}

export async function fetchSession(): Promise<Session> {
  try {
    const res = await fetch(`${API}/auth/me`, { credentials: 'include' });
    if (!res.ok) return { authenticated: false, username: null };
    return (await res.json()) as Session;
  } catch {
    return { authenticated: false, username: null };
  }
}

export async function login(pin: string): Promise<void> {
  const res = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ pin }),
  });
  if (!res.ok) {
    if (res.status === 401) throw new Error('Incorrect PIN');
    let message =
      res.status === 429 ? 'Too many attempts — please wait a minute.' : 'Login failed';
    try {
      const body = await res.json();
      if (body?.message) {
        message = Array.isArray(body.message)
          ? body.message.join(', ')
          : body.message;
      }
    } catch {
      // keep the generic message
    }
    throw new Error(message);
  }
}

export async function logout(): Promise<void> {
  try {
    await fetch(`${API}/auth/logout`, {
      method: 'POST',
      credentials: 'include',
    });
  } catch {
    // best-effort; the UI logs out regardless
  }
}
