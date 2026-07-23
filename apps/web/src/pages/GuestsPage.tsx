import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '../api';
import type {
  Guest,
  GuestFilters,
  GuestInput,
  GuestStats,
  RsvpStatus,
} from '../types';
import StatsBar from '../components/StatsBar';
import Toolbar from '../components/Toolbar';
import GuestTable from '../components/GuestTable';
import GuestModal from '../components/GuestModal';

type ModalState = { open: false } | { open: true; guest: Guest | null };

export default function GuestsPage() {
  const [guests, setGuests] = useState<Guest[]>([]);
  const [stats, setStats] = useState<GuestStats | null>(null);
  const [filters, setFilters] = useState<GuestFilters>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modal, setModal] = useState<ModalState>({ open: false });

  const [debouncedSearch, setDebouncedSearch] = useState('');
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(filters.search ?? ''), 250);
    return () => clearTimeout(t);
  }, [filters.search]);

  const effectiveFilters = useMemo<GuestFilters>(
    () => ({ ...filters, search: debouncedSearch }),
    [filters, debouncedSearch],
  );

  const loadGuests = useCallback(async () => {
    try {
      setError(null);
      setGuests(await api.listGuests(effectiveFilters));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load guests');
    } finally {
      setLoading(false);
    }
  }, [effectiveFilters]);

  const loadStats = useCallback(async () => {
    try {
      setStats(await api.getStats());
    } catch {
      /* stats are non-critical */
    }
  }, []);

  useEffect(() => {
    loadGuests();
  }, [loadGuests]);
  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const guestTypes = useMemo(
    () => (stats ? stats.byGuestType.map((g) => g.guestType).sort() : []),
    [stats],
  );

  async function refreshAll() {
    await Promise.all([loadGuests(), loadStats()]);
  }

  async function handleRsvp(guest: Guest, status: RsvpStatus) {
    setGuests((prev) =>
      prev.map((g) => (g.id === guest.id ? { ...g, rsvpStatus: status } : g)),
    );
    try {
      await api.updateGuest(guest.id, { rsvpStatus: status });
      loadStats();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to update RSVP');
      loadGuests();
    }
  }

  async function handleDelete(guest: Guest) {
    const name = `${guest.firstName} ${guest.lastName}`.trim() || guest.id;
    if (!window.confirm(`Remove ${name} from the guest list?`)) return;
    try {
      await api.deleteGuest(guest.id);
      await refreshAll();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete guest');
    }
  }

  async function handleSave(input: Partial<GuestInput>) {
    if (modal.open && modal.guest) {
      await api.updateGuest(modal.guest.id, input);
    } else {
      await api.createGuest(input);
    }
    setModal({ open: false });
    await refreshAll();
  }

  return (
    <>
      {stats && <StatsBar stats={stats} />}

      <Toolbar
        filters={filters}
        onChange={setFilters}
        guestTypes={guestTypes}
        onAdd={() => setModal({ open: true, guest: null })}
      />

      {error && <div className="error-banner">{error}</div>}

      {loading ? (
        <div className="loading">Loading the guest list…</div>
      ) : (
        <>
          <GuestTable
            guests={guests}
            onEdit={(g) => setModal({ open: true, guest: g })}
            onDelete={handleDelete}
            onRsvp={handleRsvp}
          />
          <p className="count-note">
            Showing {guests.length} guest{guests.length === 1 ? '' : 's'}
            {stats ? ` of ${stats.total} total` : ''}.
          </p>
        </>
      )}

      {modal.open && (
        <GuestModal
          guest={modal.guest}
          guestTypes={guestTypes}
          onClose={() => setModal({ open: false })}
          onSave={handleSave}
        />
      )}
    </>
  );
}
