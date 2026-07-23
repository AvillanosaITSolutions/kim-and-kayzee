import type { Guest, RsvpStatus } from '../types';

interface Props {
  guests: Guest[];
  onEdit: (guest: Guest) => void;
  onDelete: (guest: Guest) => void;
  onRsvp: (guest: Guest, status: RsvpStatus) => void;
}

function priorityChip(priority: string) {
  if (priority === 'Important Person')
    return <span className="chip chip-priority-Important">★ Important</span>;
  if (priority === 'Unsure')
    return <span className="chip chip-priority-Unsure">Unsure</span>;
  if (priority === 'Regular')
    return <span className="chip chip-priority-Regular">Regular</span>;
  return <span className="name-sub">—</span>;
}

function displayName(g: Guest) {
  const full = `${g.firstName} ${g.lastName}`.trim();
  return full || g.nameOnInvitation || g.includedBy || g.id;
}

export default function GuestTable({
  guests,
  onEdit,
  onDelete,
  onRsvp,
}: Props) {
  if (guests.length === 0) {
    return (
      <div className="table-wrap">
        <div className="empty">
          No guests match these filters. Try clearing the search or adding a new
          guest.
        </div>
      </div>
    );
  }

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Guest</th>
            <th>Category</th>
            <th>Side</th>
            <th>Priority</th>
            <th>Invite</th>
            <th>RSVP</th>
            <th style={{ textAlign: 'right' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {guests.map((g) => (
            <tr key={g.id}>
              <td className="id-cell">{g.id}</td>
              <td>
                <div className="name-main">{displayName(g)}</div>
                {(g.nameOnInvitation || g.includedBy) && (
                  <div className="name-sub">
                    {g.nameOnInvitation
                      ? `“${g.nameOnInvitation}”`
                      : `via ${g.includedBy}`}
                  </div>
                )}
              </td>
              <td>
                <span className="chip chip-type">{g.guestType}</span>
              </td>
              <td>
                <span className={`chip chip-side-${g.invitedBy}`}>
                  {g.invitedBy}
                </span>
              </td>
              <td>{priorityChip(g.priority)}</td>
              <td>
                <span className="invite-dot">
                  <span
                    className={`dot ${g.hasInvite ? 'dot-yes' : 'dot-no'}`}
                  />
                  {g.hasInvite ? 'Yes' : 'No'}
                </span>
              </td>
              <td>
                <select
                  className={`rsvp-select rsvp-${g.rsvpStatus}`}
                  value={g.rsvpStatus}
                  onChange={(e) => onRsvp(g, e.target.value as RsvpStatus)}
                >
                  <option value="Pending">Pending</option>
                  <option value="Attending">Attending</option>
                  <option value="Declined">Declined</option>
                </select>
              </td>
              <td>
                <div className="row-actions">
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => onEdit(g)}
                  >
                    Edit
                  </button>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => onDelete(g)}
                  >
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
