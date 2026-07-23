export type InvitedBy = 'Groom' | 'Bride';
export type Priority = 'Important Person' | 'Regular' | 'Unsure' | '';
export type RsvpStatus = 'Pending' | 'Attending' | 'Declined';

export interface Guest {
  id: string;
  includedBy: string;
  nameOnInvitation: string;
  firstName: string;
  lastName: string;
  guestType: string;
  priority: Priority;
  invitedBy: InvitedBy;
  hasInvite: boolean;
  rsvpStatus: RsvpStatus;
  notes: string;
  invitationId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Invitation {
  id: string;
  slug: string;
  addressLabel: string;
  message: string;
  members: Guest[];
  createdAt: string;
  updatedAt: string;
}

export interface RsvpResponse {
  guestId: string;
  rsvpStatus: RsvpStatus;
}

export interface GuestStats {
  total: number;
  withInvite: number;
  withoutInvite: number;
  bySide: { Groom: number; Bride: number };
  byRsvp: { Pending: number; Attending: number; Declined: number };
  byGuestType: { guestType: string; count: number }[];
  byPriority: { priority: string; count: number }[];
}

export interface GuestFilters {
  search?: string;
  invitedBy?: InvitedBy | '';
  guestType?: string;
  priority?: string;
  rsvpStatus?: RsvpStatus | '';
  hasInvite?: 'true' | 'false' | '';
}

export type GuestInput = Omit<
  Guest,
  'createdAt' | 'updatedAt'
> & { id?: string };
