import type {
  Guest,
  GuestFilters,
  GuestInput,
  GuestStats,
  Invitation,
  RsvpResponse,
} from './types';

// In dev the Vite proxy forwards `/api` to the local NestJS server. In
// production the web app is served same-origin behind nginx, which proxies
// `/api` to the API container — so VITE_API_URL is left empty and the browser
// calls `/api` on whatever host served the app. Set VITE_API_URL only for a
// genuinely separate-origin API.
const BASE = `${import.meta.env.VITE_API_URL ?? ''}/api`;

async function handle<T>(res: Response): Promise<T> {
  // An expired/absent session on a protected endpoint — bounce the admin UI
  // back to the login screen (RequireAuth listens for this).
  if (res.status === 401) {
    window.dispatchEvent(new Event('kk-unauthorized'));
  }
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
    if (Array.isArray(value)) {
      // Repeated params, e.g. ?guestType=A&guestType=B (parsed as an array).
      for (const v of value) if (v) params.append(key, v);
    } else if (value) {
      params.set(key, value);
    }
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
