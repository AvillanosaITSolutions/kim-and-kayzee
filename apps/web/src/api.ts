import type {
  Guest,
  GuestFilters,
  GuestInput,
  GuestStats,
  Invitation,
  RsvpResponse,
} from './types';

// In dev the Vite proxy forwards `/api` to the local NestJS server. In
// production the web app is a static site (GitHub Pages) on a different
// origin from the API, so point it at the deployed API via VITE_API_URL,
// e.g. https://kim-and-kayzee-api.onrender.com/api
const BASE = `${import.meta.env.VITE_API_URL ?? ''}/api`;

async function handle<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      if (body?.message) {
        message = Array.isArray(body.message)
          ? body.message.join(', ')
          : body.message;
      }
    } catch {
      // response had no JSON body; keep the generic message
    }
    throw new Error(message);
  }
  if (res.status === 204) {
    return undefined as T;
  }
  return res.json() as Promise<T>;
}

function toQuery(filters: GuestFilters): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value) params.set(key, value);
  }
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

export const api = {
  listGuests(filters: GuestFilters = {}): Promise<Guest[]> {
    return fetch(`${BASE}/guests${toQuery(filters)}`).then(handle<Guest[]>);
  },

  getStats(): Promise<GuestStats> {
    return fetch(`${BASE}/guests/stats`).then(handle<GuestStats>);
  },

  createGuest(input: Partial<GuestInput>): Promise<Guest> {
    return fetch(`${BASE}/guests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    }).then(handle<Guest>);
  },

  updateGuest(id: string, input: Partial<GuestInput>): Promise<Guest> {
    return fetch(`${BASE}/guests/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    }).then(handle<Guest>);
  },

  deleteGuest(id: string): Promise<void> {
    return fetch(`${BASE}/guests/${id}`, { method: 'DELETE' }).then(
      handle<void>,
    );
  },

  // ----- Invitations -----

  listInvitations(): Promise<Invitation[]> {
    return fetch(`${BASE}/invitations`).then(handle<Invitation[]>);
  },

  getInvitation(id: string): Promise<Invitation> {
    return fetch(`${BASE}/invitations/${id}`).then(handle<Invitation>);
  },

  getInvitationBySlug(slug: string): Promise<Invitation> {
    return fetch(`${BASE}/invitations/slug/${slug}`).then(handle<Invitation>);
  },

  createInvitation(input: {
    addressLabel?: string;
    message?: string;
    memberIds?: string[];
  }): Promise<Invitation> {
    return fetch(`${BASE}/invitations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    }).then(handle<Invitation>);
  },

  updateInvitation(
    id: string,
    input: { addressLabel?: string; message?: string; memberIds?: string[] },
  ): Promise<Invitation> {
    return fetch(`${BASE}/invitations/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    }).then(handle<Invitation>);
  },

  deleteInvitation(id: string): Promise<void> {
    return fetch(`${BASE}/invitations/${id}`, { method: 'DELETE' }).then(
      handle<void>,
    );
  },

  submitRsvp(slug: string, responses: RsvpResponse[]): Promise<Invitation> {
    return fetch(`${BASE}/invitations/slug/${slug}/rsvp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ responses }),
    }).then(handle<Invitation>);
  },
};
