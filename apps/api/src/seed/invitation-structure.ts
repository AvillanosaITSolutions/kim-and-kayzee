/**
 * The invitation groupings, exactly as provided. Each entry is one invitation:
 * an `address` (may be blank — the seed will generate one from member names)
 * and the guest member tags. Members are resolved to guests by NAME first
 * (falling back to id), because the guest ids in these tags were renumbered
 * after the original masterlist while the names stayed stable.
 */
export interface InvitationRow {
  address: string;
  tags: string[];
}

export const invitationStructure: InvitationRow[] = [
  { address: 'Mama and Papa', tags: ['G-0001-🥇Family Member-Janette_Avillanosa', 'G-0002-🥇Family Member-Alan_Avillanosa'] },
  { address: 'Kuya Caloy and Ate Joelle', tags: ['G-0003-🥇Family Member-Carl Ace_Avillanosa', 'G-0004-🥇Family Member-Joelle_Avillanosa'] },
  { address: 'Ate Anika and Kuya Glenn', tags: ['G-0005-🥇Family Member-Anika_Avillanosa - Rose', 'G-0006-🥇Family Member-Glenn Ace_Rose'] },
  { address: 'Spike and Kelly', tags: ['G-0007-🥇Family Member-Spike_Avillanosa', 'G-0008-🥉Extended family member-Kelly_Fernandez'] },
  { address: 'Caye and JHOMAR EDEP ZABALO', tags: ['G-0064-👗Abay (Female)-Caye Jhaycez_Chua', 'G-0009-🤵‍♂️ Best Man-Jhomar_Zabalo'] },
  { address: 'Ride or die brother for life', tags: ['G-0010-‼️ VIP-Jesse_Canonigo', 'G-0017-🥈 Friends-Ritchell_Asuero'] },
  { address: '', tags: ['G-0011-👞 Abay (Male)-Rey_Omiple'] },
  { address: '', tags: ['G-0012-👞 Abay (Male)-Ariel_Dancil'] },
  { address: '', tags: ['G-0013-👞 Abay (Male)-Arvie_Cabatingan'] },
  { address: '', tags: ['G-0014-👞 Abay (Male)-John_Salvame', 'G-0019-Regular Guest-Cherry_Asotilla'] },
  { address: '', tags: ['G-0015-👞 Abay (Male)-Brylle_Romualdo'] },
  { address: '', tags: ['G-0016-👞 Abay (Male)-Julius_Tan'] },
  { address: '', tags: ['G-0018-🥈 Friends-Mhay_Arenio'] },
  { address: '', tags: ['G-0020-🥉Extended family member-Itchu_Atanacio', 'G-0021-🥉Extended family member-Jojo_Atanacio'] },
  { address: '', tags: ['G-0022-🥉Extended family member-Boy_Patino', 'G-0023-🥉Extended family member-Pipit_Avillanosa'] },
  { address: '', tags: ['G-0026-🍺 Ninong-Arman_Solpico', 'G-0027-🎀Ninang-May_Aaron-Solpico'] },
  { address: '', tags: ['G-0029-🎀Ninang-Princess Shaira_Abo-Abo', 'G-0028-🍺 Ninong-Joshua_Saac'] },
  { address: '', tags: ['G-0025-🍺 Ninong-Juanito_Relampagos', 'G-0024-🎀Ninang-Rona_Relampagos'] },
  // Duplicate of the Boy/Pipit invitation above — after global de-dup this row
  // ends up empty and is skipped.
  { address: '', tags: ['G-0023-🥉Extended family member-Pipit_Avillanosa', 'G-0022-🥉Extended family member-Boy_Patino'] },
  { address: 'Uncle Josef and Uncle Boying', tags: ['G-0079-🥉Extended family member-Joseph_Andao', 'G-0080-🥉Extended family member-Boying_Pasion'] },
  { address: '', tags: ['G-0030-💼 Previous Colleagues-Celso_Ducao'] },
  { address: '', tags: ['G-0034-💼 Previous Colleagues-Cedie_Gabinete'] },
  { address: '', tags: ['G-0033-💼 Previous Colleagues-Oh_Pimentel'] },
  { address: '', tags: ['G-0036-💼 Previous Colleagues-Criz_Oligo'] },
  { address: '', tags: ['G-0035-💼 Previous Colleagues-Jan_Dulla'] },
  { address: '', tags: ['G-0038-💼 Previous Colleagues-Jan Erick_Santos'] },
  { address: '', tags: ['G-0031-💼 Previous Colleagues-Gillou_Carbonell'] },
  { address: '', tags: ['G-0032-💼 Previous Colleagues-Arvy_Mayor'] },
  { address: '', tags: ['G-0037-💼 Previous Colleagues-Andrew_Francisco'] },
  { address: '', tags: ['G-0039-💼 Previous Colleagues-Nico_Aplino'] },
  { address: '', tags: ['G-0040-💼 Previous Colleagues-Wendell_Saac'] },
  { address: 'Tony', tags: ['G-0041-🥉Extended family member-Virginia_Avillanosa', 'G-0049-🥉Extended family member-Walton Karl_Avillanosa'] },
  { address: 'Atty. Walter Avillanosa and Atty. Iris Avillanosa', tags: ['G-0042-🥉Extended family member-Walter_Avillanosa', 'G-0043-🥉Extended family member-Iris_Avillanosa'] },
  { address: 'Atty. Alex Rivera', tags: ['G-0050-🥉Extended family member-Alexander_Rivera'] },
  { address: '', tags: ['G-0051-🥉Extended family member-Jackie_Rivera-Pastrana', 'G-0052-🥉Extended family member-Jonie_Pastrana'] },
  { address: '', tags: ['G-0053-🥇Family Member-Marina_Pasion', 'G-0054-🥇Family Member-Valentino_Pasion'] },
  { address: '', tags: ['G-0055-🥇Family Member-Kathleen Joy_Pasion', 'G-0056-🥉Extended family member-David Steven_Grench'] },
  { address: '', tags: ['G-0065-👗Abay (Female)-Kaye_Andao', 'G-0066-🍺 Ninong-Yossef_Persov'] },
  { address: 'Tito Toots, Tita Arlene and Abby', tags: ['G-0044-🥉Extended family member-Augustus_Avillanosa', 'G-0045-🥉Extended family member-Arlene_Avillanosa', 'G-0046-🥉Extended family member-Abigail Vivien_Avillanosa'] },
  { address: 'Laki, Ate Baye and Tim Marapao', tags: ['G-0048-🥉Extended family member-Andre Kim_Avillanosa', 'G-0047-🥉Extended family member-Gabrielle_Avillanosa', 'G-0103-🥉Extended family member-Girlie_Avillanosa'] },
  { address: '', tags: ['G-0057-🥇Family Member-Cristine May_Pasion', 'G-0058-🥉Extended family member-Eurichris_Sergio'] },
  { address: '', tags: ['G-0059-👰🏻Maid of honor-Liezel_Espelita'] },
  { address: '', tags: ['G-0060-👗Abay (Female)-Kariz Jane_Zandueta'] },
  { address: '', tags: ['G-0061-👗Abay (Female)-Loradel_Pederano'] },
  { address: '', tags: ['G-0062-👗Abay (Female)-Mariam_Geralde'] },
  { address: '', tags: ['G-0063-👗Abay (Female)-Camille_Cadigal'] },
  { address: '', tags: ['G-0067-🎀Ninang-Flexie Joe_Magabo'] },
  { address: '', tags: ['G-0068-🍺 Ninong-Larry_Ylaya'] },
  { address: '', tags: ['G-0069-💼 Previous Colleagues-Batangas_Melinda'] },
  { address: '', tags: ['G-0070-💼 Previous Colleagues-Batangas_Mae'] },
  { address: '', tags: ['G-0071-💼 Previous Colleagues-Batangas_Banil'] },
  { address: '', tags: ['G-0072-💼 Previous Colleagues-Batangas_Vanessa'] },
  { address: '', tags: ['G-0073-💼 Previous Colleagues-Batangas_Beth'] },
  { address: '', tags: ['G-0074-🥈 Friends-Jacob_Urette'] },
  { address: '', tags: ['G-0075-🥈 Friends-Peter_Nepomuceno'] },
  { address: '', tags: ['G-0076-🥈 Friends-Fu_'] },
  { address: '', tags: ['G-0077-🥉Extended family member-Nelia_Andao', 'G-0078-🥉Extended family member-Isidro_Andao'] },
  { address: '', tags: ['G-0081-🥉Extended family member-Jesus_Andao', 'G-0082-🥉Extended family member-Veronica_Andao'] },
  { address: '', tags: ['G-0083-Regular Guest-Ate Fe_', 'G-0084-Regular Guest-Ate Marie_'] },
  { address: '', tags: ['G-0085-Regular Guest-Ante Chit_Dela Cruz', 'G-0104-Regular Guest-Ate Minerva_'] },
  { address: '', tags: ['G-0087-Regular Guest-Auntie_Lettie', 'G-0086-🥉Extended family member-Ninong_Eddie'] },
  { address: '', tags: ['G-0088-Regular Guest-Nang Anit_'] },
  { address: '', tags: ['G-0089-🥉Extended family member-Kuya Edward_', 'G-0090-🥉Extended family member-Ate Kambal_'] },
  { address: 'Ate tin', tags: ['G-0091-🥈 Friends-Cristine_Celedonio'] },
  { address: 'Tita Shonie and Tita Perz', tags: ['G-0094-🥉Extended family member-Shonie_Ungoco', 'G-0095-🥉Extended family member-Percival_Pasion'] },
  { address: 'Tita Vergie and Kuya Ayoy', tags: ['G-0096-🥉Extended family member-Tita Vergie_', 'G-0097-🥉Extended family member-Kuya Ayoy_'] },
  { address: 'Jake Andao, Nene Andao and Ate Quenie', tags: ['G-0098-🥉Extended family member-Jake Andao_', 'G-0100-🥉Extended family member-Nene Andao_', 'G-0099-🥉Extended family member-Ate Quenie_'] },
  { address: 'Ate dalin and Kuya Dambok', tags: ['G-0093-🥉Extended family member-Ate dalin_', 'G-0092-🥉Extended family member-Danvir_Quicho'] },
  { address: '', tags: ['G-0105-🥈 Friends-Tim_Marapao'] },
];

/** Parse a guest tag into its id and name parts. */
export function parseTag(tag: string): {
  id: string;
  firstName: string;
  lastName: string;
} {
  const trimmed = tag.trim();
  const underscore = trimmed.indexOf('_');
  const left = underscore >= 0 ? trimmed.slice(0, underscore) : trimmed;
  const lastName = underscore >= 0 ? trimmed.slice(underscore + 1).trim() : '';
  const parts = left.split('-');
  const firstName = (parts[parts.length - 1] ?? '').trim();
  const id =
    parts.length >= 2 ? `${parts[0]}-${parts[1]}`.trim() : (parts[0] ?? '').trim();
  return { id, firstName, lastName };
}
