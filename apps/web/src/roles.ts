export interface RoleInfo {
  label: string;
  icon: string;
}

/**
 * Maps a guest's `guestType` to the role we announce on the e-invite.
 * Keyword-based (not exact-string) so it's resilient to the emoji prefixes
 * and spacing variations in the type labels. Returns null for plain guests
 * (e.g. "Regular Guest"), who get no role callout.
 *
 * Order matters: check the more specific terms first — "female" contains
 * "male", and "extended family member" contains "family member".
 */
export function roleFor(guestType: string): RoleInfo | null {
  const t = (guestType ?? '').toLowerCase();

  if (t.includes('best man')) return { label: 'Best Man', icon: '🤵‍♂️' };
  if (t.includes('maid of honor'))
    return { label: 'Maid of Honor', icon: '👰🏻' };
  if (t.includes('abay') && t.includes('female'))
    return { label: 'Bridesmaid · Abay', icon: '💐' };
  if (t.includes('abay') && t.includes('male'))
    return { label: 'Groomsman · Abay', icon: '🤵' };
  if (t.includes('ninong'))
    return { label: 'Principal Sponsor · Ninong', icon: '🍷' };
  if (t.includes('ninang'))
    return { label: 'Principal Sponsor · Ninang', icon: '🎀' };
  if (t.includes('candle'))
    return { label: 'Secondary Sponsor · Candle', icon: '🕯️' };
  if (t.includes('veil'))
    return { label: 'Secondary Sponsor · Veil', icon: '🤍' };
  if (t.includes('cord'))
    return { label: 'Secondary Sponsor · Cord', icon: '🪢' };
  if (t.includes('bible bearer'))
    return { label: 'Bible Bearer', icon: '📖' };
  if (t.includes('ring bearer'))
    return { label: 'Ring Bearer', icon: '💍' };
  if (t.includes('coin bearer'))
    return { label: 'Coin Bearer · Arrhae', icon: '🪙' };
  if (t.includes('flower girl'))
    return { label: 'Flower Girl', icon: '🌸' };
  if (t.includes('extended family'))
    return { label: 'Cherished Family', icon: '💚' };
  if (t.includes('family member'))
    return { label: 'Beloved Family', icon: '💚' };
  if (t.includes('colleague'))
    return { label: 'Valued Colleague', icon: '🤝' };
  if (t.includes('friend')) return { label: 'Dear Friend', icon: '🥂' };
  if (t.includes('vip')) return { label: 'Our VIP', icon: '⭐' };

  return null;
}
