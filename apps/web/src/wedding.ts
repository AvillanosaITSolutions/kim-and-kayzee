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

  // Kindly RSVP by this date (shown on the RSVP page).
  rsvpBy: 'October 31, 2026',

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
    { name: 'Lime', hex: '#00ff00' },
    { name: 'Apple green', hex: '#8db600' },
    { name: 'Emerald green', hex: '#50c878' },
    { name: 'Teal', hex: '#008080' },
  ],
    // Reserved for the bride — kindly avoid.
    avoid: [
      { name: 'White', hex: '#ffffff' },
      { name: 'Cream', hex: '#f7f1e1' },
      { name: 'Ivory', hex: '#fffdf0' },
    ],
    avoidNote: 'these shades are reserved for the bride alone',
  },

  // Gifts note. We warmly prefer the gift of cash (a "money dance" / monetary
  // gift), but list a few ideas for those who'd rather bring something.
  gifts: {
    title: 'The Gift of Your Presence',
    body: 'Your love and presence on our special day are truly the greatest gift of all. Should you wish to bless us further as we begin our life together, a gift of cash — to help us build our future home and dreams — would be warmly and gratefully received.',
    ideasIntro: 'If you would prefer to give a physical gift, here are a few ideas:',
    ideas: [
      'Kitchen & dining sets',
      'Home appliances',
      'Bed & bath essentials',
      'Home décor in sage / green tones',
      'Gift cards / vouchers',
    ],
    closing: 'Whatever you choose, please know your thoughtfulness means the world to us. 💚',
  },

  // A gentle note that the celebration is adults-focused. ✏️ Edit freely.
  adultsOnly: {
    title: 'An Adults’ Celebration',
    body: "With love, we've planned our wedding as an adults-only celebration — a relaxed evening for you to unwind, dance, and simply enjoy, free from the hassle of babysitting.",
    closing:
      'Thank you so much for understanding — consider it our treat: a well-deserved night off. We can’t wait to celebrate with you!',
  },
} as const;
