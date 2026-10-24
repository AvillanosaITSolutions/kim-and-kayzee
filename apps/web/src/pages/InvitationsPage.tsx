import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import type { Guest, Invitation } from '../types';
import InvitationModal from '../components/InvitationModal';

type ModalState =
  | { open: false }
  | { open: true; invitation: Invitation | null };

function guestName(g: Guest) {
  return `${g.firstName} ${g.lastName}`.trim() || g.nameOnInvitation || g.id;
}

function rsvpDot(status: string) {
  const cls =
    status === 'Attending'
      ? 'dot-yes'
      : status === 'Declined'
        ? 'dot-no-red'
        : 'dot-no';
  return <span className={`dot ${cls}`} title={status} />;
}

function acceptSummary(inv: Invitation) {
  const total = inv.members.length;
  const accepted = inv.members.filter(
    (m) => m.rsvpStatus === 'Attending',
  ).length;
  return { total, accepted };
}

function acceptBadge(inv: Invitation) {
  const { total, accepted } = acceptSummary(inv);
  if (total === 0) {
    return <span className="accept-badge none">No guests</span>;
  }
  if (accepted === total) {
    return <span className="accept-badge all">✓ All accepted</span>;
  }
  if (accepted > 0) {
    return (
      <span className="accept-badge some">
        {accepted}/{total} accepted
      </span>
    );
  }
  return <span className="accept-badge none">Awaiting RSVP</span>;
}

export default function InvitationsPage() {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [allGuests, setAllGuests] = useState<Guest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modal, setModal] = useState<ModalState>({ open: false });
  const [search, setSearch] = useState('');
  const [copied, setCopied] = useState<string | null>(null);
  const [showBreakdown, setShowBreakdown] = useState(false);

  const load = useCallback(async () => {
    try {
      setError(null);
      const [invs, guests] = await Promise.all([
        api.listInvitations(),
        api.listGuests(),
      ]);
      setInvitations(invs);
      setAllGuests(guests);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load invitations');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return invitations;
    return invitations.filter(
      (inv) =>
        inv.addressLabel.toLowerCase().includes(term) ||
        inv.id.toLowerCase().includes(term) ||
        inv.members.some((m) => guestName(m).toLowerCase().includes(term)),
    );
  }, [invitations, search]);

  const totalAssigned = useMemo(
    () => invitations.reduce((sum, i) => sum + i.members.length, 0),
    [invitations],
  );

  const summary = useMemo(() => {
    let attending = 0;
    let declined = 0;
    let pending = 0;
    const acceptedByInvite: { inv: Invitation; members: Guest[] }[] = [];
    for (const inv of invitations) {
      const accepted: Guest[] = [];
      for (const m of inv.members) {
        if (m.rsvpStatus === 'Attending') {
          attending++;
          accepted.push(m);
        } else if (m.rsvpStatus === 'Declined') {
          declined++;
        } else {
          pending++;
        }
      }
      if (accepted.length) acceptedByInvite.push({ inv, members: accepted });
    }
    const fullyAccepted = acceptedByInvite.filter(
      (a) => a.members.length === a.inv.members.length,
    ).length;
    return { attending, declined, pending, acceptedByInvite, fullyAccepted };
  }, [invitations]);

  async function handleSave(input: {
    addressLabel: string;
    message: string;
    memberIds: string[];
  }) {
    if (modal.open && modal.invitation) {
      await api.updateInvitation(modal.invitation.id, input);
    } else {
      await api.createInvitation(input);
    }
    setModal({ open: false });
    await load();
  }

  async function handleDelete(inv: Invitation) {
    if (
      !window.confirm(
        `Delete invitation "${inv.addressLabel || inv.id}"? Its ${
          inv.members.length
        } guest(s) will become unassigned.`,
      )
    )
      return;
    try {
      await api.deleteInvitation(inv.id);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete invitation');
    }
  }

  function inviteUrl(inv: Invitation) {
    return `${window.location.origin}/i/${inv.slug}`;
  }

  async function copyLink(inv: Invitation) {
    try {
      await navigator.clipboard.writeText(inviteUrl(inv));
      setCopied(inv.id);
      setTimeout(() => setCopied((c) => (c === inv.id ? null : c)), 1500);
    } catch {
      window.prompt('Copy the invite link:', inviteUrl(inv));
    }
  }

  return (
    <>
      <div className="toolbar">
        <input
          type="search"
          placeholder="Search invitations or guests…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="spacer" />
        <span className="count-note" style={{ margin: 0 }}>
          {invitations.length} invitations · {totalAssigned} guests grouped
        </span>
        <button
          className="btn btn-primary"
          onClick={() => setModal({ open: true, invitation: null })}
        >
          + New invitation
        </button>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {!loading && invitations.length > 0 && (
        <div className="rsvp-summary">
          <div className="summary-stats">
            <div className="stat stat-ok">
              <b>{summary.attending}</b>
              <span>Accepted</span>
            </div>
            <div className="stat">
              <b>{summary.pending}</b>
              <span>Pending</span>
            </div>
            <div className="stat stat-bad">
              <b>{summary.declined}</b>
              <span>Declined</span>
            </div>
            <div className="stat">
              <b>{summary.fullyAccepted}</b>
              <span>Invites all-in</span>
            </div>
          </div>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => setShowBreakdown((v) => !v)}
            disabled={summary.attending === 0}
          >
            {showBreakdown ? 'Hide' : 'Show'} accepted breakdown
          </button>
        </div>
      )}

      {!loading && showBreakdown && (
        <div className="breakdown-panel">
          <div className="breakdown-head">
            Accepted guests · {summary.attending} across{' '}
            {summary.acceptedByInvite.length} invitation
            {summary.acceptedByInvite.length === 1 ? '' : 's'}
          </div>
          {summary.acceptedByInvite.length === 0 ? (
            <div className="empty">No guests have accepted yet.</div>
          ) : (
            <ul className="breakdown-list">
              {summary.acceptedByInvite.map(({ inv, members }) => (
                <li key={inv.id} className="breakdown-row">
                  <div className="breakdown-row-head">
                    <Link to={`/i/${inv.slug}`} className="breakdown-label">
                      {inv.addressLabel || inv.id}
                    </Link>
                    <span className="breakdown-count">
                      {members.length}/{inv.members.length}
                    </span>
                  </div>
                  <div className="breakdown-guests">
                    {members.map((m) => (
                      <span key={m.id} className="member-chip">
                        {rsvpDot(m.rsvpStatus)}
                        {guestName(m)}
                      </span>
                    ))}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {loading ? (
        <div className="loading">Loading invitations…</div>
      ) : (
        <div className="invite-grid">
          {filtered.map((inv) => (
            <div key={inv.id} className="invite-card">
              <div className="invite-card-head">
                <div>
                  <div className="invite-id">{inv.id}</div>
                  <div className="invite-address">
                    {inv.addressLabel || '(no label)'}
                  </div>
                </div>
                <span className="invite-count">{inv.members.length}</span>
              </div>

              <div className="invite-status">{acceptBadge(inv)}</div>

              <div className="invite-members">
                {inv.members.map((m) => (
                  <span key={m.id} className="member-chip">
                    {rsvpDot(m.rsvpStatus)}
                    {guestName(m)}
                  </span>
                ))}
              </div>

              <div className="invite-card-foot">
                <Link className="btn btn-ghost btn-sm" to={`/i/${inv.slug}`}>
                  Open invite
                </Link>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => copyLink(inv)}
                >
                  {copied === inv.id ? '✓ Copied' : 'Copy link'}
                </button>
                <div className="spacer" />
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => setModal({ open: true, invitation: inv })}
                >
                  Edit
                </button>
                <button
                  className="btn btn-danger btn-sm"
                  onClick={() => handleDelete(inv)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="empty">No invitations match your search.</div>
          )}
        </div>
      )}

      {modal.open && (
        <InvitationModal
          invitation={modal.invitation}
          allGuests={allGuests}
          onClose={() => setModal({ open: false })}
          onSave={handleSave}
        />
      )}
    </>
  );
}
