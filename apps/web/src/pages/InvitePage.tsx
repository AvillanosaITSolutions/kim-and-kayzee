import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../api';
import type { Guest, Invitation, RsvpStatus } from '../types';
import { WEDDING } from '../wedding';
import { roleFor } from '../roles';

function guestName(g: Guest) {
  return `${g.firstName} ${g.lastName}`.trim() || g.nameOnInvitation || g.id;
}

/** "A, B and C" from a list of names. */
function joinNames(names: string[]) {
  if (names.length <= 1) return names[0] ?? '';
  return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
}

function MapPinIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2C8.1 2 5 5.1 5 9c0 5.2 7 13 7 13s7-7.8 7-13c0-3.9-3.1-7-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z" />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M22 12a10 10 0 1 0-11.6 9.9v-7H7.9V12h2.5V9.8c0-2.5 1.5-3.9 3.8-3.9 1.1 0 2.2.2 2.2.2v2.5h-1.3c-1.2 0-1.6.8-1.6 1.6V12h2.8l-.4 2.9h-2.4v7A10 10 0 0 0 22 12z" />
    </svg>
  );
}

export default function InvitePage() {
  const { slug = '' } = useParams();
  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [choices, setChoices] = useState<Record<string, RsvpStatus>>({});
  const [baseline, setBaseline] = useState<Record<string, RsvpStatus>>({});
  const [saving, setSaving] = useState(false);
  const [hasSaved, setHasSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Envelope "tap to open" animation. Respect reduced-motion by skipping it.
  const [phase, setPhase] = useState<'closed' | 'opening' | 'open'>(() =>
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
      ? 'open'
      : 'closed',
  );
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    document.title = `${WEDDING.groom} & ${WEDDING.bride} — You're Invited`;
  }, []);

  function openInvite() {
    if (phase !== 'closed') return;
    setPhase('opening');
    window.setTimeout(() => setPhase('open'), 1600);
  }

  // Lock background scroll while the envelope is sealed.
  useEffect(() => {
    document.body.style.overflow = phase === 'closed' ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [phase]);

  // Hide the scroll cue once the guest starts scrolling.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const load = useCallback(async () => {
    try {
      const inv = await api.getInvitationBySlug(slug);
      setInvitation(inv);
      const initial = Object.fromEntries(
        inv.members.map((m) => [m.id, m.rsvpStatus]),
      );
      setChoices(initial);
      setBaseline(initial);
    } catch {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    load();
  }, [load]);

  const members = invitation?.members ?? [];
  const total = members.length;
  const answered = members.filter(
    (m) => (choices[m.id] ?? 'Pending') !== 'Pending',
  ).length;
  const allAnswered = total > 0 && answered === total;
  const dirty = members.some((m) => choices[m.id] !== baseline[m.id]);
  const canSend = allAnswered && dirty && !saving;
  const attending = members.filter(
    (m) => choices[m.id] === 'Attending',
  ).length;

  // Warn "idiots" who try to leave with responses they never sent.
  useEffect(() => {
    if (!dirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [dirty]);

  function setChoice(id: string, status: RsvpStatus) {
    setChoices((prev) => ({ ...prev, [id]: status }));
  }

  const send = useCallback(async () => {
    if (!invitation || !canSend) return;
    setSaving(true);
    setError(null);
    try {
      const responses = invitation.members.map((m) => ({
        guestId: m.id,
        rsvpStatus: choices[m.id] ?? 'Pending',
      }));
      const updated = await api.submitRsvp(invitation.slug, responses);
      setInvitation(updated);
      const next = Object.fromEntries(
        updated.members.map((m) => [m.id, m.rsvpStatus]),
      );
      setChoices(next);
      setBaseline(next);
      setHasSaved(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not send your RSVP');
    } finally {
      setSaving(false);
    }
  }, [invitation, canSend, choices]);

  const justConfirmed = hasSaved && !dirty;

  const sendLabel = useMemo(() => {
    if (saving) return 'Sending…';
    if (!allAnswered) return `Respond for everyone · ${answered}/${total}`;
    if (justConfirmed) return '✓ RSVP received — thank you!';
    return hasSaved ? 'Send updated RSVP' : 'Send RSVP';
  }, [saving, allAnswered, answered, total, justConfirmed, hasSaved]);

  if (loading) {
    return (
      <div className="invite-page">
        <div className="loading">Loading your invitation…</div>
      </div>
    );
  }

  if (notFound || !invitation) {
    return (
      <div className="invite-page">
        <div className="invite-card-public">
          <p className="script">
            {WEDDING.groom} <span className="amp">&amp;</span> {WEDDING.bride}
          </p>
          <p className="invite-error">
            We couldn’t find this invitation. Please check the link.
          </p>
        </div>
      </div>
    );
  }

  const names = members.map(guestName);
  const roledMembers = members
    .map((m) => ({ guest: m, role: roleFor(m.guestType) }))
    .filter((x): x is { guest: Guest; role: NonNullable<typeof x.role> } =>
      x.role !== null,
    );
  // "white, cream, or ivory"
  const avoidLower = WEDDING.attire.avoid.map((c) => c.name.toLowerCase());
  const avoidPhrase =
    avoidLower.length > 1
      ? `${avoidLower.slice(0, -1).join(', ')}, or ${avoidLower[avoidLower.length - 1]}`
      : (avoidLower[0] ?? '');

  const sealed = phase !== 'open';

  return (
    <div
      className={`invite-page ${canSend ? 'has-send-bar' : ''} ${
        sealed ? 'is-sealed' : ''
      }`}
    >
      <div className="invite-card-public">
        <p className="eyebrow gold">You are cordially invited</p>
        <h1 className="script">
          {WEDDING.groom} <span className="amp">&amp;</span> {WEDDING.bride}
        </h1>
        <div className="divider" />
        <p className="invite-line">{WEDDING.invitationLine}</p>

        <div className="invite-details">
          <div className="detail">
            <span className="detail-label">When</span>
            <span className="detail-value">
              {WEDDING.dayLabel}, {WEDDING.dateLabel}
            </span>
            <span className="detail-sub">
              {WEDDING.ceremonyTime || 'Time to be announced'}
            </span>
          </div>
          <div className="detail">
            <span className="detail-label">Where</span>
            <span className="detail-value">{WEDDING.venueName}</span>
            <span className="detail-sub">{WEDDING.venueAddress}</span>
            <span className="detail-sub">{WEDDING.receptionNote}</span>
          </div>
        </div>

        <div className="venue-actions">
          <a
            className="venue-link"
            href={WEDDING.mapUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            <MapPinIcon />
            View on map
          </a>
          <a
            className="venue-link"
            href={WEDDING.facebookUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            <FacebookIcon />
            Venue Facebook
          </a>
        </div>

        <div className="dear">
          <p className="dear-to">
            Dear {invitation.addressLabel || joinNames(names)},
          </p>
          <p className="dear-body">
            With joyful hearts, we invite you to share in our celebration of
            love. Your presence would make our day complete.
          </p>
          {invitation.message && (
            <p className="dear-note">“{invitation.message}”</p>
          )}
        </div>

        {roledMembers.length > 0 && (
          <div className="roles">
            <span className="detail-label">
              {roledMembers.length === 1 ? 'Your Role' : 'Your Roles'}
            </span>
            <p className="roles-intro">
              You hold a cherished place in our celebration —
            </p>
            <ul className="roles-list">
              {roledMembers.map(({ guest, role }) => (
                <li key={guest.id} className="role-item">
                  <span className="role-icon" aria-hidden="true">
                    {role.icon}
                  </span>
                  <span className="role-name">{guestName(guest)}</span>
                  <span className="role-badge">{role.label}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="attire">
          <span className="detail-label">Attire</span>
          <p className="attire-main">{WEDDING.attire.main}</p>
          <div className="swatches">
            {WEDDING.attire.wear.map((c) => (
              <span key={c.name} className="swatch">
                <span className="swatch-dot" style={{ background: c.hex }} />
                {c.name}
              </span>
            ))}
          </div>

          <div className="attire-avoid-block">
            <span className="no-badge">🚫 Please do not wear</span>
            <div className="swatches">
              {WEDDING.attire.avoid.map((c) => (
                <span key={c.name} className="swatch swatch-avoid">
                  <span
                    className="swatch-dot"
                    style={{ background: c.hex }}
                  />
                  {c.name}
                </span>
              ))}
            </div>
            <p className="attire-note">
              Out of love for the bride, kindly <strong>avoid wearing</strong>{' '}
              {avoidPhrase} — {WEDDING.attire.avoidNote}.
            </p>
          </div>
        </div>

        <div className="rsvp-block">
          <p className="rsvp-title">Will you celebrate with us?</p>
          <p className="rsvp-sub">
            Tap a response for {total === 1 ? 'yourself' : 'each guest'}, then
            press <strong>Send RSVP</strong> to confirm.
          </p>

          {/* Live progress so an incomplete response is obvious. */}
          <div
            className={`rsvp-progress ${allAnswered ? 'done' : ''}`}
            aria-live="polite"
          >
            {allAnswered
              ? '✓ Everyone has a response'
              : `${answered} of ${total} responded`}
          </div>

          <div className="rsvp-list">
            {members.map((m) => {
              const choice = choices[m.id] ?? 'Pending';
              return (
                <div
                  key={m.id}
                  className={`rsvp-guest ${
                    choice === 'Pending' ? 'needs-answer' : ''
                  }`}
                >
                  <span className="rsvp-guest-name">
                    {guestName(m)}
                    {choice === 'Pending' && (
                      <span className="needs-tag">tap one ↓</span>
                    )}
                  </span>
                  <div className="rsvp-choices">
                    <button
                      className={`choice ${
                        choice === 'Attending' ? 'choice-yes' : ''
                      }`}
                      onClick={() => setChoice(m.id, 'Attending')}
                    >
                      Joyfully accepts
                    </button>
                    <button
                      className={`choice ${
                        choice === 'Declined' ? 'choice-no' : ''
                      }`}
                      onClick={() => setChoice(m.id, 'Declined')}
                    >
                      Regretfully declines
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Nudge that appears the moment they're ready but haven't sent. */}
          {canSend && (
            <div className="send-nudge" role="alert">
              ⚠️ Almost done! Your responses aren’t saved yet — tap the green
              <strong> Send RSVP</strong> button below.
            </div>
          )}

          {error && <p className="invite-error">{error}</p>}

          <button
            className={`btn-send ${canSend ? 'pulse' : ''} ${
              justConfirmed ? 'sent' : ''
            }`}
            onClick={send}
            disabled={!canSend}
          >
            {sendLabel}
          </button>

          {justConfirmed && (
            <p className="thanks">
              We’ve recorded {attending} {attending === 1 ? 'guest' : 'guests'}{' '}
              attending. Changed your mind? Just update above and send again.
            </p>
          )}
        </div>

        <div className="invite-foot">
          <span>{WEDDING.venueName}</span>
          <span className="gold">{WEDDING.dateLabel}</span>
        </div>
      </div>

      {/* Persistent bottom reminder while a complete response is unsent — so
          it's always one tap away no matter where they've scrolled. */}
      {canSend && (
        <div className="send-bar">
          <span className="send-bar-text">You haven’t sent your RSVP yet</span>
          <button className="btn-send pulse" onClick={send} disabled={!canSend}>
            {saving ? 'Sending…' : 'Send RSVP'}
          </button>
        </div>
      )}

      {/* Bouncing hint so guests know the page continues below. */}
      {phase === 'open' && !scrolled && !canSend && (
        <div className="scroll-cue" aria-hidden="true">
          <span>Scroll for details &amp; RSVP</span>
          <span className="chev">⌄</span>
        </div>
      )}

      {/* Envelope cover — tap to open the invitation. */}
      {sealed && (
        <div
          className={`opening-overlay ${phase === 'opening' ? 'opening' : ''}`}
          onClick={openInvite}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') openInvite();
          }}
          role="button"
          tabIndex={0}
          aria-label="Tap to open your invitation"
        >
          <p className="open-eyebrow">The wedding of</p>
          <h2 className="open-names">
            {WEDDING.groom} <span className="amp">&amp;</span> {WEDDING.bride}
          </h2>
          <div className="envelope" aria-hidden="true">
            <div className="env-back" />
            <div className="env-letter">
              <span className="env-mono">
                {WEDDING.groom} <span className="amp">&amp;</span>{' '}
                {WEDDING.bride}
              </span>
            </div>
            <div className="env-front" />
            <div className="env-flap" />
            <div className="env-seal">
              {WEDDING.groom[0]}&amp;{WEDDING.bride[0]}
            </div>
          </div>
          <p className="open-hint">Tap to open your invitation</p>
        </div>
      )}
    </div>
  );
}
