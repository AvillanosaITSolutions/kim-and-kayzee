import { useCallback, useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { fetchSession } from '../auth';
import LoginPage from '../pages/LoginPage';

/**
 * Gate for the admin area. Checks the session on mount and renders the login
 * screen until the visitor is authenticated. Also listens for the global
 * `kk-unauthorized` event (dispatched by api.ts on any 401) so an expired
 * session bounces back to the login screen mid-use.
 */
export default function RequireAuth() {
  const [state, setState] = useState<'checking' | 'in' | 'out'>('checking');

  const check = useCallback(async () => {
    const session = await fetchSession();
    setState(session.authenticated ? 'in' : 'out');
  }, []);

  useEffect(() => {
    check();
  }, [check]);

  useEffect(() => {
    const onUnauthorized = () => setState('out');
    window.addEventListener('kk-unauthorized', onUnauthorized);
    return () => window.removeEventListener('kk-unauthorized', onUnauthorized);
  }, []);

  if (state === 'checking') {
    return (
      <div className="app">
        <div className="loading">Loading…</div>
      </div>
    );
  }

  if (state === 'out') {
    return <LoginPage onSuccess={() => setState('in')} />;
  }

  return <Outlet />;
}
