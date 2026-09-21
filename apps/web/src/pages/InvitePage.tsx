import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type AnimationEvent as ReactAnimationEvent,
  type ReactNode,
  type TouchEvent as ReactTouchEvent,
} from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../api';
import type { Guest, Invitation, RsvpStatus } from '../types';
import { WEDDING } from '../wedding';
import { roleFor } from '../roles';
import coupleBadge from '../assets/couple.png';

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

interface BookPage {
  key: string;
  cls?: string;
  content: ReactNode;
}

type Turn = { dir: 'next' | 'prev'; from: number; to: number } | null;

function prefersReducedMotion() {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
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
    prefersReducedMotion() ? 'open' : 'closed',
  );

  // Book paging.
  const [idx, setIdx] = useState(0);
  const [turn, setTurn] = useState<Turn>(null);
  const touchRef = useRef<{ x: number; y: number } | null>(null);

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

  // Warn guests who try to leave with responses they never sent.
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

  // ---- Build the book's pages from the invitation ----
  const names = members.map(guestName);
  const roledMembers = members
    .map((m) => ({ guest: m, role: roleFor(m.guestType) }))
    .filter((x): x is { guest: Guest; role: NonNullable<typeof x.role> } =>
      x.role !== null,
    );
  const avoidLower = WEDDING.attire.avoid.map((c) => c.name.toLowerCase());
  const avoidPhrase =
    avoidLower.length > 1
      ? `${avoidLower.slice(0, -1).join(', ')}, or ${avoidLower[avoidLower.length - 1]}`
      : (avoidLower[0] ?? '');

  const pages: BookPage[] = [];
  if (invitation) {
    pages.push({
      key: 'cover',
      cls: 'cover',
      content: (
        <>
          <p className="eyebrow gold">You are cordially invited</p>
          <div className="couple-badge">
            <img
              src={coupleBadge}
              alt={`${WEDDING.groom} and ${WEDDING.bride}`}
            />
          </div>
          <h1 className="script" style={{ marginTop: 14 }}>
            {WEDDING.groom} <span className="amp">&amp;</span> {WEDDING.bride}
          </h1>
          <div className="divider" />
          <p className="cover-date">
            {WEDDING.dayLabel}, {WEDDING.dateLabel}
          </p>
          <p className="ornament">✦ ❦ ✦</p>
          <p className="turn-hint">Turn the page ›</p>
          <button
            className="skip-rsvp"
            onClick={() => turnTo(pages.findIndex((p) => p.key === 'rsvp'))}
          >
            Skip to RSVP
          </button>
        </>
      ),
    });

    pages.push({
      key: 'invitation',
      content: (
        <>
          <p className="ornament">❦</p>
          <p className="eyebrow gold">With joyful hearts</p>
          <p className="invite-line">{WEDDING.invitationLine}</p>
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
        </>
      ),
    });

    pages.push({
      key: 'details',
      content: (
        <>
          <p className="ornament">❦</p>
          <h3 className="page-title">When &amp; Where</h3>
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
        </>
      ),
    });

    if (roledMembers.length > 0) {
      pages.push({
        key: 'roles',
        content: (
          <>
            <p className="ornament">❦</p>
            <h3 className="page-title">
              {roledMembers.length === 1 ? 'Your Role' : 'Your Roles'}
            </h3>
            <div className="roles">
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
          </>
        ),
      });
    }

    pages.push({
      key: 'attire',
      content: (
        <>
          <p className="ornament">❦</p>
          <h3 className="page-title">Attire</h3>
          <div className="attire">
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
                    <span className="swatch-dot" style={{ background: c.hex }} />
                    {c.name}
                  </span>
                ))}
              </div>
              <p className="attire-note">
                Out of love for the bride, kindly{' '}
                <strong>avoid wearing</strong> {avoidPhrase} —{' '}
                {WEDDING.attire.avoidNote}.
              </p>
            </div>
          </div>
        </>
      ),
    });

    pages.push({
      key: 'gifts',
      content: (
        <>
          <p className="ornament">❦</p>
          <h3 className="page-title">{WEDDING.gifts.title}</h3>
          <div className="gifts">
            <p className="ornament" style={{ marginTop: 6 }}>
              ✦ ❦ ✦
            </p>
            <p className="dear-body" style={{ margin: '6px auto 0' }}>
              {WEDDING.gifts.body}
            </p>
            <p className="dear-note" style={{ marginTop: 16 }}>
              {WEDDING.gifts.closing}
            </p>
          </div>
        </>
      ),
    });

    pages.push({
      key: 'note',
      content: (
        <>
          <p className="ornament">❦</p>
          <h3 className="page-title">{WEDDING.adultsOnly.title}</h3>
          <div className="roles" style={{ textAlign: 'center' }}>
            <p className="dear-body" style={{ margin: '2px auto 0' }}>
              {WEDDING.adultsOnly.body}
            </p>
            {/* <p className="dear-note" style={{ marginTop: 14 }}>
              {WEDDING.adultsOnly.exception}
            </p> */}
            <p className="dear-body" style={{ margin: '14px auto 0' }}>
              {WEDDING.adultsOnly.closing}
            </p>
          </div>
        </>
      ),
    });

    pages.push({
      key: 'rsvp',
      content: (
        <div className="rsvp-block">
          <p className="rsvp-title">Will you celebrate with us?</p>
          <p className="rsvp-sub">
            Tap a response for {total === 1 ? 'yourself' : 'each guest'}, then
            press <strong>Send RSVP</strong> to confirm.
          </p>

          {WEDDING.rsvpBy && (
            <p className="rsvp-deadline">
              💌 Kindly accept your RSVP by <strong>{WEDDING.rsvpBy}</strong>.
            </p>
          )}

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
                  className={`rsvp-guest ${choice === 'Pending' ? 'needs-answer' : ''
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
                      className={`choice ${choice === 'Attending' ? 'choice-yes' : ''
                        }`}
                      onClick={() => setChoice(m.id, 'Attending')}
                    >
                      Joyfully accepts
                    </button>
                    <button
                      className={`choice ${choice === 'Declined' ? 'choice-no' : ''
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

          {canSend && (
            <div className="send-nudge" role="alert">
              ⚠️ Almost done! Your responses aren’t saved yet — tap the green
              <strong> Send RSVP</strong> button below.
            </div>
          )}

          {error && <p className="invite-error">{error}</p>}

          <button
            className={`btn-send ${canSend ? 'pulse' : ''} ${justConfirmed ? 'sent' : ''
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
      ),
    });

    pages.push({
      key: 'closing',
      cls: 'closing',
      content: (
        <>
          <p className="ornament gold">✦ ❦ ✦</p>
          <p className="signoff">With all our love,</p>
          <h2 className="script" style={{ fontSize: 30, margin: '6px 0 0' }}>
            {WEDDING.groom} <span className="amp">&amp;</span> {WEDDING.bride}
          </h2>
          <div className="divider" />
          <p className="detail-sub">
            {WEDDING.venueName} · {WEDDING.dateLabel}
          </p>
        </>
      ),
    });
  }

  const pageCount = pages.length;

  function turnTo(to: number) {
    if (turn) return;
    if (to < 0 || to >= pageCount || to === idx) return;
    const dir: 'next' | 'prev' = to > idx ? 'next' : 'prev';
    if (prefersReducedMotion()) {
      setIdx(to);
      return;
    }
    setTurn({ dir, from: idx, to });
  }

  function onTurnEnd(e: ReactAnimationEvent) {
    if (e.animationName !== 'leaf-next' && e.animationName !== 'leaf-prev') {
      return; // ignore the curl overlay's bubbling animationend
    }
    if (turn) setIdx(turn.to);
    setTurn(null);
  }

  // Keyboard arrows turn pages once the book is open.
  useEffect(() => {
    if (phase !== 'open') return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') turnTo(idx + 1);
      else if (e.key === 'ArrowLeft') turnTo(idx - 1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // turnTo closes over idx/turn/pageCount; re-bind when they change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, idx, turn, pageCount]);

  // Fallback: if the flip's animationend never fires (e.g. a backgrounded tab
  // throttles CSS animations), commit the turn anyway so the book can't get
  // stuck mid-page. Cleared as soon as animationend commits normally.
  useEffect(() => {
    if (!turn) return;
    const t = window.setTimeout(() => {
      setIdx(turn.to);
      setTurn(null);
    }, 900);
    return () => window.clearTimeout(t);
  }, [turn]);

  function onTouchStart(e: ReactTouchEvent) {
    const t = e.touches[0];
    touchRef.current = { x: t.clientX, y: t.clientY };
  }
  function onTouchEnd(e: ReactTouchEvent) {
    const start = touchRef.current;
    touchRef.current = null;
    if (!start) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - start.x;
    const dy = t.clientY - start.y;
    // Horizontal swipe past the threshold turns a page; vertical still scrolls.
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) {
      turnTo(dx < 0 ? idx + 1 : idx - 1);
    }
  }

  function renderPage(i: number) {
    const p = pages[i];
    if (!p) return null;
    return (
      <div className={`page ${p.cls ?? ''}`}>
        {p.content}
        {p.cls !== 'cover' && p.cls !== 'closing' && (
          <div className="page-num">{i + 1}</div>
        )}
      </div>
    );
  }

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

  const sealed = phase !== 'open';
  const basePage = turn ? (turn.dir === 'next' ? turn.to : turn.from) : idx;
  const overlayPage = turn
    ? turn.dir === 'next'
      ? turn.from
      : turn.to
    : idx;

  return (
    <div className={`invite-page ${canSend ? 'has-send-bar' : ''}`}>
      <div className="book-wrap">
        <div className="book" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
          <div className="leaf-static">{renderPage(basePage)}</div>
          {turn && (
            <div className={`leaf-turn ${turn.dir}`} onAnimationEnd={onTurnEnd}>
              <div className="leaf-face leaf-front">
                {renderPage(overlayPage)}
              </div>
              <div className="leaf-face leaf-back" />
              <div className="curl" />
            </div>
          )}
        </div>

        <div className="book-nav">
          <button
            className="book-btn"
            onClick={() => turnTo(idx - 1)}
            disabled={idx === 0 || !!turn}
            aria-label="Previous page"
          >
            ‹
          </button>
          <span className="book-progress">
            {idx + 1} / {pageCount}
          </span>
          <button
            className="book-btn"
            onClick={() => turnTo(idx + 1)}
            disabled={idx === pageCount - 1 || !!turn}
            aria-label="Next page"
          >
            ›
          </button>
        </div>

        <div className="dots">
          {pages.map((p, i) => (
            <span
              key={p.key}
              className={`dot ${i === idx ? 'on' : ''}`}
              onClick={() => turnTo(i)}
              role="button"
              aria-label={`Go to page ${i + 1}`}
            />
          ))}
        </div>
      </div>

      {/* Persistent bottom reminder while a complete response is unsent. */}
      {canSend && (
        <div className="send-bar">
          <span className="send-bar-text">You haven’t sent your RSVP yet</span>
          <button className="btn-send pulse" onClick={send} disabled={!canSend}>
            {saving ? 'Sending…' : 'Send RSVP'}
          </button>
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
            <div className="env-seal" aria-hidden="true" />
          </div>
          <p className="open-hint">Tap to open your invitation</p>
        </div>
      )}
    </div>
  );
}
