import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeObjectName,
  raToDecimalDegrees,
  decToDecimalDegrees,
  parseCSVLine,
  parseNGCCSV,
  sortCatalogMatchesByPriority,
} from './catalog-utils';

// ---------------------------------------------------------------------------
// normalizeObjectName
// ---------------------------------------------------------------------------
describe('normalizeObjectName', () => {
  it('strips leading zeros from NGC names', () => {
    assert.equal(normalizeObjectName('NGC0001'), 'NGC 1');
    assert.equal(normalizeObjectName('NGC0224'), 'NGC 224');
  });

  it('adds space between prefix and number', () => {
    assert.equal(normalizeObjectName('NGC7000'), 'NGC 7000');
    assert.equal(normalizeObjectName('IC434'), 'IC 434');
  });

  it('preserves suffixes', () => {
    assert.equal(normalizeObjectName('NGC4038A'), 'NGC 4038A');
    assert.equal(normalizeObjectName('IC1396A'), 'IC 1396A');
  });

  it('normalizes Messier designations', () => {
    assert.equal(normalizeObjectName('M031'), 'M 31');
    assert.equal(normalizeObjectName('M1'), 'M 1');
    assert.equal(normalizeObjectName('M 042'), 'M 42');
  });

  it('is case-insensitive on prefix', () => {
    assert.equal(normalizeObjectName('ngc7000'), 'NGC 7000');
    assert.equal(normalizeObjectName('ic0434'), 'IC 434');
    assert.equal(normalizeObjectName('m31'), 'M 31');
  });

  it('trims whitespace', () => {
    assert.equal(normalizeObjectName('  NGC 224  '), 'NGC 224');
  });

  it('returns input unchanged for non-matching names', () => {
    assert.equal(normalizeObjectName('Barnard 33'), 'Barnard 33');
    assert.equal(normalizeObjectName('Sh2-240'), 'Sh2-240');
    assert.equal(normalizeObjectName(''), '');
  });

  it('handles already-normalized names', () => {
    assert.equal(normalizeObjectName('NGC 7000'), 'NGC 7000');
    assert.equal(normalizeObjectName('M 42'), 'M 42');
  });
});

// ---------------------------------------------------------------------------
// raToDecimalDegrees
// ---------------------------------------------------------------------------
describe('raToDecimalDegrees', () => {
  it('converts RA 0:0:0 to 0 degrees', () => {
    assert.equal(raToDecimalDegrees('0:0:0'), 0);
  });

  it('converts RA 12:00:00 to 180 degrees', () => {
    assert.equal(raToDecimalDegrees('12:00:00'), 180);
  });

  it('converts RA 6:00:00 to 90 degrees', () => {
    assert.equal(raToDecimalDegrees('6:00:00'), 90);
  });

  it('converts RA 23:59:59 to nearly 360 degrees', () => {
    const result = raToDecimalDegrees('23:59:59');
    assert.ok(result !== null);
    assert.ok(result > 359.99 && result < 360);
  });

  it('handles fractional seconds', () => {
    const result = raToDecimalDegrees('5:35:17.3');
    assert.ok(result !== null);
    assert.ok(Math.abs(result - 83.822) < 0.01);
  });

  it('returns null for empty string', () => {
    assert.equal(raToDecimalDegrees(''), null);
    assert.equal(raToDecimalDegrees('  '), null);
  });

  it('returns null for invalid format', () => {
    assert.equal(raToDecimalDegrees('abc'), null);
    assert.equal(raToDecimalDegrees('12:00'), null);
    assert.equal(raToDecimalDegrees('12:xx:00'), null);
  });
});

// ---------------------------------------------------------------------------
// decToDecimalDegrees
// ---------------------------------------------------------------------------
describe('decToDecimalDegrees', () => {
  it('converts Dec 0:0:0 to 0 degrees', () => {
    assert.equal(decToDecimalDegrees('0:0:0'), 0);
  });

  it('converts Dec +90:00:00 to 90 degrees', () => {
    assert.equal(decToDecimalDegrees('+90:00:00'), 90);
  });

  it('converts Dec -90:00:00 to -90 degrees', () => {
    assert.equal(decToDecimalDegrees('-90:00:00'), -90);
  });

  it('handles negative declination with minutes and seconds', () => {
    const result = decToDecimalDegrees('-5:23:28');
    assert.ok(result !== null);
    assert.ok(result < 0);
    assert.ok(Math.abs(result - (-5.391)) < 0.01);
  });

  it('handles positive declination without sign', () => {
    const result = decToDecimalDegrees('41:16:09');
    assert.ok(result !== null);
    assert.ok(result > 41 && result < 42);
  });

  it('handles explicit positive sign', () => {
    const result = decToDecimalDegrees('+41:16:09');
    assert.ok(result !== null);
    assert.ok(result > 41 && result < 42);
  });

  it('returns null for empty string', () => {
    assert.equal(decToDecimalDegrees(''), null);
    assert.equal(decToDecimalDegrees('  '), null);
  });

  it('returns null for invalid format', () => {
    assert.equal(decToDecimalDegrees('abc'), null);
    assert.equal(decToDecimalDegrees('45:00'), null);
  });
});

// ---------------------------------------------------------------------------
// parseCSVLine
// ---------------------------------------------------------------------------
describe('parseCSVLine', () => {
  it('splits on semicolons', () => {
    assert.deepEqual(parseCSVLine('a;b;c'), ['a', 'b', 'c']);
  });

  it('trims whitespace around fields', () => {
    assert.deepEqual(parseCSVLine(' foo ; bar ; baz '), ['foo', 'bar', 'baz']);
  });

  it('handles quoted fields containing semicolons', () => {
    assert.deepEqual(parseCSVLine('a;"b;c";d'), ['a', 'b;c', 'd']);
  });

  it('handles empty fields', () => {
    assert.deepEqual(parseCSVLine('a;;c'), ['a', '', 'c']);
  });

  it('handles single field', () => {
    assert.deepEqual(parseCSVLine('only'), ['only']);
  });

  it('handles empty string', () => {
    assert.deepEqual(parseCSVLine(''), ['']);
  });

  it('handles quoted field at start and end', () => {
    assert.deepEqual(parseCSVLine('"a;1";b;"c;2"'), ['a;1', 'b', 'c;2']);
  });

  it('strips quotes but preserves inner content', () => {
    assert.deepEqual(parseCSVLine('"hello world"'), ['hello world']);
  });
});

// ---------------------------------------------------------------------------
// parseNGCCSV
// ---------------------------------------------------------------------------
describe('parseNGCCSV', () => {
  const HEADER = 'Name;Type;RA;Dec;Const;MajAx;MinAx;B-Mag;V-Mag;SurfBr;Hubble;M;NGC;IC;Common names;Identifiers';

  it('parses a minimal single-object CSV', () => {
    const csv = `${HEADER}\nNGC0224;G;00:42:44.3;+41:16:09;And;190.0;60.0;4.36;3.44;22.2;SA(s)b;31;;;Andromeda Galaxy;UGC 454`;
    const result = parseNGCCSV(csv);
    assert.equal(result.length, 1);
    assert.equal(result[0].name, 'NGC 224');
    assert.equal(result[0].type, 'G');
    assert.equal(result[0].constellation, 'And');
    assert.equal(result[0].messier, 'M 31');
    assert.equal(result[0].commonNames, 'Andromeda Galaxy');
    assert.ok(result[0].raDeg !== null && result[0].raDeg > 10);
    assert.ok(result[0].decDeg !== null && result[0].decDeg > 41);
    assert.equal(result[0].vMag, 3.44);
  });

  it('parses multiple objects', () => {
    const csv = [
      HEADER,
      'NGC0224;G;00:42:44.3;+41:16:09;And;190.0;60.0;4.36;3.44;22.2;SA(s)b;31;;;Andromeda Galaxy;UGC 454',
      'IC0434;HII;05:41:00.0;-02:24:00;Ori;60.0;10.0;;7.3;;;;;;;Horsehead Nebula;',
    ].join('\n');
    const result = parseNGCCSV(csv);
    assert.equal(result.length, 2);
    assert.equal(result[0].name, 'NGC 224');
    assert.equal(result[1].name, 'IC 434');
  });

  it('returns empty array for empty input', () => {
    assert.deepEqual(parseNGCCSV(''), []);
  });

  it('returns empty array for header-only input', () => {
    assert.deepEqual(parseNGCCSV(HEADER), []);
  });

  it('skips lines with no name', () => {
    const csv = `${HEADER}\n;G;00:42:44.3;+41:16:09;And;;;;;;;;;;;;;`;
    const result = parseNGCCSV(csv);
    assert.equal(result.length, 0);
  });

  it('skips lines with fewer than 2 fields', () => {
    const csv = `${HEADER}\nonly_one_field`;
    const result = parseNGCCSV(csv);
    assert.equal(result.length, 0);
  });

  it('handles missing optional fields gracefully', () => {
    const csv = `${HEADER}\nNGC7000;HII;20:58:47;+44:19:48;Cyg;;;;;;;;;North America Nebula;`;
    const result = parseNGCCSV(csv);
    assert.equal(result.length, 1);
    assert.equal(result[0].name, 'NGC 7000');
    assert.equal(result[0].vMag, null);
    assert.equal(result[0].bMag, null);
    assert.equal(result[0].messier, null);
  });

  it('normalizes names with leading zeros', () => {
    const csv = `${HEADER}\nNGC0001;G;00:07:15.8;+27:42:29;Peg;1.2;0.8;13.65;13.4;;;;;;;`;
    const result = parseNGCCSV(csv);
    assert.equal(result[0].name, 'NGC 1');
  });

  it('normalizes Messier designations with leading zeros', () => {
    const csv = `${HEADER}\nMel022;OCl;03:47:28.6;+24:06:19;Tau;150.0;150.0;;1.2;;;045;;;Pleiades;MWSC 0305`;
    const result = parseNGCCSV(csv);
    assert.equal(result[0].messier, 'M 45');
  });
});

// ---------------------------------------------------------------------------
// sortCatalogMatchesByPriority
// ---------------------------------------------------------------------------
describe('sortCatalogMatchesByPriority', () => {
  it('puts Messier objects first', () => {
    const matches = [
      { messier: null, vMag: 5.0 },
      { messier: 'M 31', vMag: 3.4 },
      { messier: null, vMag: 2.0 },
    ];
    const sorted = sortCatalogMatchesByPriority(matches);
    assert.equal(sorted[0].messier, 'M 31');
  });

  it('sorts non-Messier objects by brightness (lower mag first)', () => {
    const matches = [
      { messier: null, vMag: 10.0 },
      { messier: null, vMag: 5.0 },
      { messier: null, vMag: 8.0 },
    ];
    const sorted = sortCatalogMatchesByPriority(matches);
    assert.equal(sorted[0].vMag, 5.0);
    assert.equal(sorted[1].vMag, 8.0);
    assert.equal(sorted[2].vMag, 10.0);
  });

  it('sorts Messier objects by brightness among themselves', () => {
    const matches = [
      { messier: 'M 45', vMag: 1.6 },
      { messier: 'M 31', vMag: 3.4 },
    ];
    const sorted = sortCatalogMatchesByPriority(matches);
    assert.equal(sorted[0].messier, 'M 45');
    assert.equal(sorted[1].messier, 'M 31');
  });

  it('treats null vMag as very faint (sorts last within tier)', () => {
    const matches = [
      { messier: null, vMag: null },
      { messier: null, vMag: 10.0 },
    ];
    const sorted = sortCatalogMatchesByPriority(matches);
    assert.equal(sorted[0].vMag, 10.0);
    assert.equal(sorted[1].vMag, null);
  });

  it('handles empty array', () => {
    assert.deepEqual(sortCatalogMatchesByPriority([]), []);
  });

  it('does not mutate original array', () => {
    const original = [
      { messier: null, vMag: 10.0 },
      { messier: 'M 1', vMag: 8.4 },
    ];
    const sorted = sortCatalogMatchesByPriority(original);
    assert.equal(original[0].vMag, 10.0); // unchanged
    assert.notStrictEqual(sorted, original);
  });
});
