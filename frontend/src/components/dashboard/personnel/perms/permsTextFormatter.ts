const ACRONYMS = new Set([
  'SP',
  'GP',
  'RP',
  'RT',
  'HC',
  'ID',
  'URL',
  'UPI',
  'WU',
  'J2C',
  'LOA',
  'GFX',
  'RI',
  'RIV',
  'RGH',
  'RNG',
  'WT',
  'MOIA',
  'MOT',
  'MOC',
  'MOP',
  'MOF',
  'MOGGER',
  'XP',
  'DM',
  'VC',
  'API',
  'I',
  'II',
  'III',
  'IV',
  'V',
  'VI',
  'VII',
  'VIII',
  'IX',
  'X',
]);

function formatSegment(part: string): string {
  if (!part) return '';
  const upperPart = part.toUpperCase();
  if (ACRONYMS.has(upperPart)) return upperPart;
  if (part.toLowerCase() === 'perms') return 'Permissions';

  const camelParts = part
    .replace(/(?<!^)(?=[A-Z][a-z])|(?<=[a-z0-9])(?=[A-Z])/g, ' ')
    .trim()
    .split(/\s+/);

  return camelParts
    .map((cp) => {
      const up = cp.toUpperCase();
      if (ACRONYMS.has(up)) return up;
      if (cp.toLowerCase() === 'perms') return 'Permissions';
      return cp.charAt(0).toUpperCase() + cp.slice(1).toLowerCase();
    })
    .join(' ');
}

export function formatPermKey(raw: string): string {
  if (!raw || !raw.trim()) return '';

  if (raw.includes('.')) {
    const segments = raw.split('.').filter(Boolean);
    return segments
      .map((seg) => {
        if (seg.toLowerCase() === '[serverid]') return 'SERVERID';
        const subParts = seg.split(/[-_]+/).filter(Boolean);
        return subParts.map(formatSegment).join(' ');
      })
      .join(' : ');
  }

  if (raw.toLowerCase() === '[serverid]') return 'SERVERID';

  const parts = raw.split(/[-_]+/).filter(Boolean);
  return parts.map(formatSegment).join(' ');
}
