import { useState } from 'react';
import type { Guest, GuestInput } from '../types';

interface Props {
  guest: Guest | null; // null = creating a new guest
  guestTypes: string[];
  onClose: () => void;
  onSave: (input: Partial<GuestInput>) => Promise<void>;
}

const FALLBACK_TYPES = [
  '🥇Family Member',
  '🥉Extended family member',
  '🤵‍♂️ Best Man',
  '👰🏻Maid of honor',
  '👞 Abay (Male)',
  '👗Abay (Female)',
  '🍺 Ninong',
  '🎀Ninang',
  '🥈 Friends',
  '💼 Previous Colleagues',
  'Regular Guest',
];

export default function GuestModal({
  guest,
  guestTypes,
  onClose,
  onSave,
}: Props) {
  const isEdit = guest !== null;
  // Seed only the editable fields — never id/invitationId/createdAt/updatedAt,
  // which are read-only and would be rejected/ignored by the API.
  const [form, setForm] = useState<Partial<GuestInput>>(
    guest
      ? {
          includedBy: guest.includedBy,
          nameOnInvitation: guest.nameOnInvitation,
          firstName: guest.firstName,
          lastName: guest.lastName,
          guestType: guest.guestType,
          priority: guest.priority,
          invitedBy: guest.invitedBy,
          hasInvite: guest.hasInvite,
          rsvpStatus: guest.rsvpStatus,
          notes: guest.notes,
        }
      : {
          includedBy: '',
          nameOnInvitation: '',
          firstName: '',
          lastName: '',
          guestType: 'Regular Guest',
          priority: '',
          invitedBy: 'Groom',
          hasInvite: false,
          rsvpStatus: 'Pending',
          notes: '',
        },
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const typeOptions = Array.from(
    new Set([...guestTypes, ...FALLBACK_TYPES]),
  );

  const set = (patch: Partial<GuestInput>) =>
    setForm((prev) => ({ ...prev, ...patch }));

  async function submit() {
    setSaving(true);
    setError(null);
    try {
      await onSave(form);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
      setSaving(false);
    }
  }

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h2>{isEdit ? 'Edit guest' : 'Add a guest'}</h2>
          <p>
            {isEdit
              ? `Updating ${guest?.id}`
              : 'A new ID (G-####) is assigned automatically.'}
          </p>
        </div>

        <div className="modal-body">
          {error && (
            <div className="error-banner full" style={{ margin: 0 }}>
              {error}
            </div>
          )}

          <div className="field">
            <label>First name</label>
            <input
              value={form.firstName ?? ''}
              onChange={(e) => set({ firstName: e.target.value })}
              autoFocus
            />
          </div>
          <div className="field">
            <label>Last name</label>
            <input
              value={form.lastName ?? ''}
              onChange={(e) => set({ lastName: e.target.value })}
            />
          </div>

          <div className="field full">
            <label>Name on invitation</label>
            <input
              value={form.nameOnInvitation ?? ''}
              onChange={(e) => set({ nameOnInvitation: e.target.value })}
              placeholder="e.g. Mama, Kuya Caloy…"
            />
          </div>

          <div className="field full">
            <label>Included by / listed under</label>
            <input
              value={form.includedBy ?? ''}
              onChange={(e) => set({ includedBy: e.target.value })}
              placeholder="Optional grouping"
            />
          </div>

          <div className="field">
            <label>Category</label>
            <select
              value={form.guestType ?? ''}
              onChange={(e) => set({ guestType: e.target.value })}
            >
              {typeOptions.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Side</label>
            <select
              value={form.invitedBy ?? 'Groom'}
              onChange={(e) =>
                set({ invitedBy: e.target.value as GuestInput['invitedBy'] })
              }
            >
              <option value="Groom">Groom</option>
              <option value="Bride">Bride</option>
            </select>
          </div>

          <div className="field">
            <label>Priority</label>
            <select
              value={form.priority ?? ''}
              onChange={(e) =>
                set({ priority: e.target.value as GuestInput['priority'] })
              }
            >
              <option value="">Unclassified</option>
              <option value="Important Person">Important Person</option>
              <option value="Regular">Regular</option>
              <option value="Unsure">Unsure</option>
            </select>
          </div>
          <div className="field">
            <label>RSVP</label>
            <select
              value={form.rsvpStatus ?? 'Pending'}
              onChange={(e) =>
                set({ rsvpStatus: e.target.value as GuestInput['rsvpStatus'] })
              }
            >
              <option value="Pending">Pending</option>
              <option value="Attending">Attending</option>
              <option value="Declined">Declined</option>
            </select>
          </div>

          <div className="field full">
            <div className="checkbox-row">
              <input
                id="hasInvite"
                type="checkbox"
                checked={form.hasInvite ?? false}
                onChange={(e) => set({ hasInvite: e.target.checked })}
              />
              <label htmlFor="hasInvite" style={{ textTransform: 'none' }}>
                Invitation has been prepared / handed out
              </label>
            </div>
          </div>

          <div className="field full">
            <label>Notes</label>
            <textarea
              value={form.notes ?? ''}
              onChange={(e) => set({ notes: e.target.value })}
              placeholder="Dietary needs, plus-ones, reminders…"
            />
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
            {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Add guest'}
          </button>
        </div>
      </div>
    </div>
  );
}
