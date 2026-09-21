import type { GuestFilters } from '../types';
import CategoryFilter from './CategoryFilter';

interface Props {
  filters: GuestFilters;
  onChange: (next: GuestFilters) => void;
  guestTypes: string[];
  onAdd: () => void;
}

export default function Toolbar({
  filters,
  onChange,
  guestTypes,
  onAdd,
}: Props) {
  const set = (patch: Partial<GuestFilters>) =>
    onChange({ ...filters, ...patch });

  return (
    <div className="toolbar">
      <input
        type="search"
        placeholder="Search name, id, or included-by…"
        value={filters.search ?? ''}
        onChange={(e) => set({ search: e.target.value })}
      />

      <select
        value={filters.invitedBy ?? ''}
        onChange={(e) => set({ invitedBy: e.target.value as never })}
      >
        <option value="">Both sides</option>
        <option value="Groom">Groom's side</option>
        <option value="Bride">Bride's side</option>
      </select>

      <CategoryFilter
        options={guestTypes}
        selected={filters.guestType ?? []}
        onChange={(next) => set({ guestType: next })}
      />

      <select
        value={filters.rsvpStatus ?? ''}
        onChange={(e) => set({ rsvpStatus: e.target.value as never })}
      >
        <option value="">Any RSVP</option>
        <option value="Pending">Pending</option>
        <option value="Attending">Attending</option>
        <option value="Declined">Declined</option>
      </select>

      <select
        value={filters.hasInvite ?? ''}
        onChange={(e) => set({ hasInvite: e.target.value as never })}
      >
        <option value="">Invite: any</option>
        <option value="true">Has invite</option>
        <option value="false">No invite yet</option>
      </select>

      <div className="spacer" />

      <button className="btn btn-primary" onClick={onAdd}>
        + Add guest
      </button>
    </div>
  );
}
