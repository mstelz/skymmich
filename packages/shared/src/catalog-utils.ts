/**
 * Normalize an OpenNGC object name for consistent matching.
 * "NGC0001" → "NGC 1", "IC0434" → "IC 434", "NGC7000" → "NGC 7000"
 */
export function normalizeObjectName(raw: string): string {
  const trimmed = raw.trim();
  const match = trimmed.match(/^(NGC|IC|M)\s*0*(\d+)(\w*)$/i);
  if (match) {
    const prefix = match[1].toUpperCase();
    const num = match[2];
    const suffix = match[3] || '';
    return `${prefix} ${num}${suffix}`;
  }
  return trimmed;
}

/**
 * Convert sexagesimal RA (HH:MM:SS.ss) to decimal degrees
 */
export function raToDecimalDegrees(ra: string): number | null {
  if (!ra || ra.trim() === '') return null;
  const parts = ra.split(':').map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) return null;
  return (parts[0] + parts[1] / 60 + parts[2] / 3600) * 15;
}

/**
 * Convert sexagesimal Dec (±DD:MM:SS.s) to decimal degrees
 */
export function decToDecimalDegrees(dec: string): number | null {
  if (!dec || dec.trim() === '') return null;
  const sign = dec.startsWith('-') ? -1 : 1;
  const cleaned = dec.replace(/^[+-]/, '');
  const parts = cleaned.split(':').map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) return null;
  return sign * (parts[0] + parts[1] / 60 + parts[2] / 3600);
}

/**
 * Parse a semicolon-delimited CSV line, handling quoted fields
 */
export function parseCSVLine(line: string): string[] {
  const fields: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === ';' && !inQuotes) {
      fields.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  fields.push(current.trim());
  return fields;
}

/**
 * Parse a float from a CSV field, returning null for empty/invalid values.
 */
function parseFloatField(val: string): number | null {
  if (!val || val.trim() === '') return null;
  const n = parseFloat(val);
  return isNaN(n) ? null : n;
}

/** Minimal shape needed by parseNGCCSV — avoids importing full Drizzle types */
export interface ParsedCatalogObject {
  name: string;
  type: string | null;
  ra: string | null;
  dec: string | null;
  raDeg: number | null;
  decDeg: number | null;
  constellation: string | null;
  majorAxis: number | null;
  minorAxis: number | null;
  bMag: number | null;
  vMag: number | null;
  surfaceBrightness: number | null;
  hubbleType: string | null;
  messier: string | null;
  ngcRef: string | null;
  icRef: string | null;
  commonNames: string | null;
  identifiers: string | null;
}

/**
 * Parse the OpenNGC CSV text into catalog objects
 */
export function parseNGCCSV(csvText: string): ParsedCatalogObject[] {
  const lines = csvText.split('\n').filter(l => l.trim());
  if (lines.length === 0) return [];

  const header = parseCSVLine(lines[0]);
  const nameIdx = header.indexOf('Name');
  const typeIdx = header.indexOf('Type');
  const raIdx = header.indexOf('RA');
  const decIdx = header.indexOf('Dec');
  const constIdx = header.indexOf('Const');
  const majAxIdx = header.indexOf('MajAx');
  const minAxIdx = header.indexOf('MinAx');
  const bMagIdx = header.indexOf('B-Mag');
  const vMagIdx = header.indexOf('V-Mag');
  const surfBrIdx = header.indexOf('SurfBr');
  const hubbleIdx = header.indexOf('Hubble');
  const messierIdx = header.indexOf('M');
  const ngcIdx = header.indexOf('NGC');
  const icIdx = header.indexOf('IC');
  const commonIdx = header.indexOf('Common names');
  const identIdx = header.indexOf('Identifiers');

  const objects: ParsedCatalogObject[] = [];

  for (let i = 1; i < lines.length; i++) {
    const fields = parseCSVLine(lines[i]);
    if (fields.length < 2) continue;

    const rawName = fields[nameIdx] || '';
    if (!rawName) continue;

    const name = normalizeObjectName(rawName);
    const raStr = fields[raIdx] || '';
    const decStr = fields[decIdx] || '';
    const messierRaw = fields[messierIdx] || '';
    const messier = messierRaw ? normalizeObjectName(`M${messierRaw}`) : null;

    objects.push({
      name,
      type: fields[typeIdx] || null,
      ra: raStr || null,
      dec: decStr || null,
      raDeg: raToDecimalDegrees(raStr),
      decDeg: decToDecimalDegrees(decStr),
      constellation: fields[constIdx] || null,
      majorAxis: parseFloatField(fields[majAxIdx]),
      minorAxis: parseFloatField(fields[minAxIdx]),
      bMag: parseFloatField(fields[bMagIdx]),
      vMag: parseFloatField(fields[vMagIdx]),
      surfaceBrightness: parseFloatField(fields[surfBrIdx]),
      hubbleType: fields[hubbleIdx] || null,
      messier,
      ngcRef: fields[ngcIdx] || null,
      icRef: fields[icIdx] || null,
      commonNames: fields[commonIdx] || null,
      identifiers: fields[identIdx] || null,
    });
  }

  return objects;
}

/**
 * Sort catalog match results by priority: Messier first, then brightest V-mag.
 * Used when matching image tags to catalog objects to pick the best candidate.
 */
export function sortCatalogMatchesByPriority<T extends { messier?: string | null; vMag?: number | null }>(
  matches: T[],
): T[] {
  return [...matches].sort((a, b) => {
    const aMessier = a.messier ? 0 : 1;
    const bMessier = b.messier ? 0 : 1;
    if (aMessier !== bMessier) return aMessier - bMessier;
    const aVMag = a.vMag ?? 999;
    const bVMag = b.vMag ?? 999;
    return aVMag - bVMag;
  });
}
