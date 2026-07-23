import { useMemo, useState } from 'react';
import type { Guest, Invitation } from '../types';

interface Props {
  invitation: Invitation | null; // null = create
  allGuests: Guest[];
  onClose: () => void;
  onSave: (input: {
    addressLabel: string;
    message: string;
    memberIds: string[];
  }) => Promise<void>;
}

function guestName(g: Guest) {
  return `${g.firstName} ${g.lastName}`.trim() || g.nameOnInvitation || g.id;
}

export default function InvitationModal({
  invitation,
  allGuests,
  onClose,
  onSave,
}: Props) {
  const isEdit = invitation !== null;
  const [addressLabel, setAddressLabel] = useState(
    invitation?.addressLabel ?? '',
  );
  const [message, setMessage] = useState(invitation?.message ?? '');
  const [selected, setSelected] = useState<Set<string>>(
    new Set(invitation?.members.map((m) => m.id) ?? []),
  );
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return allGuests.filter((g) => {
      if (!term) return true;
      return (
        guestName(g).toLowerCase().includes(term) ||
        g.id.toLowerCase().includes(term) ||
        g.guestType.toLowerCase().includes(term)
      );
    });
  }, [allGuests, search]);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function submit() {
    setSaving(true);
    setError(null);
    try {
      await onSave({
        addressLabel: addressLabel.trim(),
        message: message.trim(),
        memberIds: [...selected],
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
      setSaving(false);
    }
  }

  return (
    <div className="overlay" onClick={onClose}>
      <div
        className="modal modal-wide"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-head">
          <h2>{isEdit ? 'Edit invitation' : 'New invitation'}</h2>
          <p>
            {isEdit
              ? `${invitation?.id} · a guest can only belong to one invitation`
              : 'Group one or more guests onto a single invite.'}
          </p>
        </div>

        <div className="modal-body invite-body">
          {error && <div className="error-banner full">{error}</div>}

          <div className="field full">
            <label>Address label</label>
            <input
              value={addressLabel}
              onChange={(e) => setAddressLabel(e.target.value)}
              placeholder="e.g. Mama and Papa (blank = auto from names)"
              autoFocus
            />
          </div>

          <div className="field full">
            <label>Personal message (optional)</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="A short note shown on the invite…"
            />
          </div>

          <div className="field full">
            <label>Members · {selected.size} selected</label>
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search guests to add…"
            />
            <div className="member-picker">
              {filtered.map((g) => {
                const inOther =
                  g.invitationId && g.invitationId !== invitation?.id;
                return (
                  <label key={g.id} className="member-row">
                    <input
                      type="checkbox"
                      checked={selected.has(g.id)}
                      onChange={() => toggle(g.id)}
                    />
                    <span className="member-name">{guestName(g)}</span>
                    <span className="member-type">{g.guestType}</span>
                    {inOther && (
                      <span className="member-warn">in {g.invitationId}</span>
                    )}
                  </label>
                );
              })}
              {filtered.length === 0 && (
                <div className="empty" style={{ padding: 20 }}>
                  No guests match “{search}”.
                </div>
              )}
            </div>
            <p className="hint">
              Ticking a guest already on another invitation will move them here.
            </p>
          </div>
        </div>

        <div className="modal-foot">
          <button className="btn btn-ghost" onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button
            className="btn btn-primary"
            onClick={submit}
            disabled={saving}
          >
            {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Create invitation'}
          </button>
        </div>
      </div>
    </div>
  );
}
