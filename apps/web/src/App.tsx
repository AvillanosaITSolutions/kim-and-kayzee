import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import GuestsPage from './pages/GuestsPage';
import InvitationsPage from './pages/InvitationsPage';
import InvitePage from './pages/InvitePage';

export default function App() {
  return (
    <Routes>
      {/* Standalone public e-invite — no admin chrome. */}
      <Route path="/i/:slug" element={<InvitePage />} />

      {/* Admin area with shared header + tabs. */}
      <Route element={<Layout />}>
        <Route path="/" element={<GuestsPage />} />
        <Route path="/invitations" element={<InvitationsPage />} />
      </Route>
    </Routes>
  );
}
