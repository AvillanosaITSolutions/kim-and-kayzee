import { NavLink, Outlet } from 'react-router-dom';
import { WEDDING } from '../wedding';

export default function Layout() {
  return (
    <div className="app">
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
