import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import RequireAuth from './components/RequireAuth';
import GuestsPage from './pages/GuestsPage';
import InvitationsPage from './pages/InvitationsPage';
import InvitePage from './pages/InvitePage';

export default function App() {
  return (
    <Routes>
      {/* Standalone public e-invite — no admin chrome, no login. */}
      <Route path="/i/:slug" element={<InvitePage />} />

      {/* Admin area — gated behind login, with shared header + tabs. */}
      <Route element={<RequireAuth />}>
        <Route element={<Layout />}>
          <Route path="/" element={<GuestsPage />} />
          <Route path="/invitations" element={<InvitationsPage />} />
        </Route>
      </Route>
    </Routes>
  );
}
