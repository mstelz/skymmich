export function computeVisibility(raDeg: number, decDeg: number, latitudeDeg: number) {
  const raHours = raDeg / 15;
  const poleLimit = 90 - Math.abs(latitudeDeg);

  // Hemisphere-aware circumpolar/never-rises detection
  let status: 'circumpolar' | 'seasonal' | 'never-rises' = 'seasonal';
  if (latitudeDeg >= 0) {
    if (decDeg >= poleLimit) status = 'circumpolar';
    else if (decDeg <= -poleLimit) status = 'never-rises';
  } else {
    if (decDeg <= -poleLimit) status = 'circumpolar';
    else if (decDeg >= poleLimit) status = 'never-rises';
  }

  // Best month = when object transits at midnight (opposition to Sun)
  // RA 0h → Sep, RA 6h → Dec, RA 12h → Mar, RA 18h → Jun
  const bestMonth = ((Math.round(raHours / 2) + 8) % 12) + 1;

  // Prime season: ±3 months around best month (heuristic, not precise)
  const startMonth = ((bestMonth + 12 - 3 - 1) % 12) + 1;
  const endMonth = ((bestMonth + 3 - 1) % 12) + 1;

  // Max altitude at upper meridian transit
  const maxAltitude = 90 - Math.abs(latitudeDeg - decDeg);

  return { bestMonth, monthRange: [startMonth, endMonth] as [number, number], status, maxAltitude };
}
