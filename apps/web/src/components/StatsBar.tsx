import type { GuestStats } from '../types';

interface Props {
  stats: GuestStats;
}

export default function StatsBar({ stats }: Props) {
  const { total, bySide, byRsvp, withInvite } = stats;
  const groomPct = total ? (bySide.Groom / total) * 100 : 0;
  const invitePct = total ? Math.round((withInvite / total) * 100) : 0;

  return (
    <div className="stats-grid">
      <div className="stat">
        <div className="label">Total Guests</div>
        <div className="value">{total}</div>
        <div className="bar">
          <span style={{ width: `${groomPct}%`, background: 'var(--groom)' }} />
          <span
            style={{ width: `${100 - groomPct}%`, background: 'var(--bride)' }}
          />
        </div>
        <div className="split">
          <span style={{ color: 'var(--groom)' }}>● Groom {bySide.Groom}</span>
          <span style={{ color: 'var(--bride)' }}>● Bride {bySide.Bride}</span>
        </div>
      </div>

      <div className="stat">
        <div className="label">Attending</div>
        <div className="value" style={{ color: 'var(--ok)' }}>
          {byRsvp.Attending}
        </div>
        <div className="split">
          <span>Declined {byRsvp.Declined}</span>
          <span>Pending {byRsvp.Pending}</span>
        </div>
      </div>

      <div className="stat">
        <div className="label">Invites Handed Out</div>
        <div className="value">{withInvite}</div>
        <div className="bar">
          <span style={{ width: `${invitePct}%`, background: 'var(--gold)' }} />
        </div>
        <div className="split">
          <span>{invitePct}% of the list</span>
        </div>
      </div>

      <div className="stat">
        <div className="label">Guest Categories</div>
        <div className="value">{stats.byGuestType.length}</div>
        <div className="split">
          <span>
            Top: {stats.byGuestType[0]?.guestType ?? '—'} (
            {stats.byGuestType[0]?.count ?? 0})
          </span>
        </div>
      </div>
    </div>
  );
}
