import { NavLink, Outlet } from 'react-router-dom';
import { WEDDING } from '../wedding';
import { logout } from '../auth';

async function handleLogout() {
  await logout();
  // Flip RequireAuth back to the login screen.
  window.dispatchEvent(new Event('kk-unauthorized'));
}

export default function Layout() {
  return (
    <div className="app">
      <button
        type="button"
        onClick={handleLogout}
        style={{
          position: 'absolute',
          top: 16,
          right: 16,
          padding: '7px 14px',
          borderRadius: 8,
          border: '1px solid #cdddc6',
          background: '#ffffffcc',
          color: '#4f6b52',
          fontSize: 13,
          fontWeight: 600,
          cursor: 'pointer',
        }}
      >
        Sign out
      </button>

      <header className="header">
        <p className="eyebrow">The Wedding Of</p>
        <h1>
          {WEDDING.groom} <span className="amp">&amp;</span> {WEDDING.bride}
        </h1>
        <div className="divider" />
        <p className="sub">{WEDDING.dateLabel} · Guest &amp; Invitation Manager</p>
      </header>

      <nav className="tabs">
        <NavLink
          to="/"
          end
          className={({ isActive }) => `tab ${isActive ? 'active' : ''}`}
        >
          Guest List
        </NavLink>
        <NavLink
          to="/invitations"
          className={({ isActive }) => `tab ${isActive ? 'active' : ''}`}
        >
          Invitations
        </NavLink>
      </nav>

      <Outlet />
    </div>
  );
}
