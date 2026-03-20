import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { computeVisibility } from './visibility';

describe('computeVisibility', () => {
  // Northern hemisphere observer at ~45°N (typical mid-latitude)
  const LAT_45N = 45;

  it('returns seasonal status for typical mid-dec objects', () => {
    // Orion Nebula: RA ~83.8°, Dec ~-5.4°
    const result = computeVisibility(83.8, -5.4, LAT_45N);
    assert.equal(result.status, 'seasonal');
    assert.ok(result.maxAltitude > 0, 'should be observable');
  });

  it('detects circumpolar objects in northern hemisphere', () => {
    // Polaris-like: Dec ~89° from 45°N (poleLimit = 45, 89 >= 45 → circumpolar)
    const result = computeVisibility(0, 89, LAT_45N);
    assert.equal(result.status, 'circumpolar');
  });

  it('detects never-rises objects in northern hemisphere', () => {
    // Deep southern object: Dec -80° from 45°N (poleLimit = 45, -80 <= -45 → never-rises)
    const result = computeVisibility(0, -80, LAT_45N);
    assert.equal(result.status, 'never-rises');
  });

  it('detects circumpolar objects in southern hemisphere', () => {
    // Dec -80° from -45° latitude (poleLimit = 45, -80 <= -45 → circumpolar)
    const result = computeVisibility(0, -80, -45);
    assert.equal(result.status, 'circumpolar');
  });

  it('detects never-rises objects in southern hemisphere', () => {
    // Dec +80° from -45° latitude (poleLimit = 45, 80 >= 45 → never-rises)
    const result = computeVisibility(0, 80, -45);
    assert.equal(result.status, 'never-rises');
  });

  it('computes correct best month for RA 0h (September)', () => {
    // RA 0° = 0h → best month should be ~September (9)
    const result = computeVisibility(0, 20, LAT_45N);
    assert.equal(result.bestMonth, 9);
  });

  it('computes correct best month for RA 12h (March)', () => {
    // RA 180° = 12h → best month should be ~March (3)
    const result = computeVisibility(180, 20, LAT_45N);
    assert.equal(result.bestMonth, 3);
  });

  it('computes correct best month for RA 6h (December)', () => {
    // RA 90° = 6h → best month should be ~December (12)
    const result = computeVisibility(90, 20, LAT_45N);
    assert.equal(result.bestMonth, 12);
  });

  it('computes correct best month for RA 18h (June)', () => {
    // RA 270° = 18h → best month should be ~June (6)
    const result = computeVisibility(270, 20, LAT_45N);
    assert.equal(result.bestMonth, 6);
  });

  it('returns monthRange as a 2-element tuple', () => {
    const result = computeVisibility(83.8, -5.4, LAT_45N);
    assert.equal(result.monthRange.length, 2);
    assert.ok(result.monthRange[0] >= 1 && result.monthRange[0] <= 12);
    assert.ok(result.monthRange[1] >= 1 && result.monthRange[1] <= 12);
  });

  it('computes maxAltitude correctly at meridian transit', () => {
    // Object at Dec 45° from 45°N → directly overhead → maxAlt = 90
    const result = computeVisibility(0, 45, 45);
    assert.equal(result.maxAltitude, 90);
  });

  it('computes maxAltitude for object at Dec 0° from 45°N', () => {
    // Dec 0° from 45°N → maxAlt = 90 - |45 - 0| = 45
    const result = computeVisibility(0, 0, 45);
    assert.equal(result.maxAltitude, 45);
  });

  it('computes maxAltitude for southern object from northern hemisphere', () => {
    // Dec -20° from 45°N → maxAlt = 90 - |45 - (-20)| = 90 - 65 = 25
    const result = computeVisibility(0, -20, 45);
    assert.equal(result.maxAltitude, 25);
  });

  it('handles equatorial observer correctly', () => {
    // From equator (lat 0°), poleLimit = 90, so everything is seasonal
    const north = computeVisibility(0, 85, 0);
    assert.equal(north.status, 'seasonal');

    const south = computeVisibility(0, -85, 0);
    assert.equal(south.status, 'seasonal');

    // Only exactly ±90 would be circumpolar/never-rises
    const pole = computeVisibility(0, 90, 0);
    assert.equal(pole.status, 'circumpolar');
  });

  it('handles polar observer correctly', () => {
    // From north pole (lat 90°), poleLimit = 0
    // Any positive dec → circumpolar, any negative → never-rises
    const pos = computeVisibility(0, 10, 90);
    assert.equal(pos.status, 'circumpolar');

    const neg = computeVisibility(0, -10, 90);
    assert.equal(neg.status, 'never-rises');

    // Dec 0° is the boundary — depends on >= check
    const zero = computeVisibility(0, 0, 90);
    assert.equal(zero.status, 'circumpolar');
  });

  it('bestMonth is always between 1 and 12', () => {
    for (let ra = 0; ra < 360; ra += 15) {
      const result = computeVisibility(ra, 20, LAT_45N);
      assert.ok(result.bestMonth >= 1 && result.bestMonth <= 12,
        `bestMonth ${result.bestMonth} out of range for RA ${ra}`);
    }
  });
});
