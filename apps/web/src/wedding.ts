/**
 * Wedding details shown on the public e-invite pages.
 * ✏️ EDIT THESE — the date and venue are set; fill in the ceremony time
 * (`ceremonyTime`) once confirmed.
 */
export const WEDDING = {
  groom: 'Kim',
  bride: 'Kayzee',

  // Confirmed date.
  date: new Date('2027-01-23T00:00:00'),
  dateLabel: 'January 23, 2027',
  dayLabel: 'Saturday',

  // TODO: set the ceremony time. Leave '' to show "Time to be announced".
  ceremonyTime: '',
  receptionNote: 'Reception to follow',

  // Venue.
  venueName: 'Ligaya Villas',
  venueAddress:
    'Purok Visapa, Brgy. Sitio Iratag, Puerto Princesa City, Palawan',
  mapUrl: 'https://maps.app.goo.gl/B7nStxZjMxboWZNn9',
  facebookUrl: 'https://www.facebook.com/p/Ligaya-Villas-61586170740962/',

  // A short line under the couple's names on the invite.
  invitationLine:
    'together with their families, request the honor of your presence',

  // Attire guidance for guests.
  attire: {
    main: 'Formal / Semi-formal — in shades of green',
    // Colors we'd love guests to wear.
    wear: [
      { name: 'Sage', hex: '#8aa06f' },
      { name: 'Pastel green', hex: '#cfe6d4' },
      { name: 'Mint', hex: '#a8d5b5' },
    ],
    // Reserved for the bride — kindly avoid.
    avoid: [
      { name: 'White', hex: '#ffffff' },
      { name: 'Cream', hex: '#f7f1e1' },
      { name: 'Ivory', hex: '#fffdf0' },
    ],
    avoidNote: 'these shades are reserved for the bride alone',
  },
} as const;
