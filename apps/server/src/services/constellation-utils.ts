// Constellation boundaries data based on IAU constellation boundaries
// This is a simplified version - for production use, consider using a more comprehensive dataset
interface ConstellationBoundary {
  name: string;
  raMin: number;
  raMax: number;
  decMin: number;
  decMax: number;
}

// Major constellation boundaries (simplified)
const CONSTELLATION_BOUNDARIES: ConstellationBoundary[] = [
  // Northern constellations
  { name: "Ursa Major", raMin: 8, raMax: 14, decMin: 30, decMax: 70 },
  { name: "Ursa Minor", raMin: 0, raMax: 24, decMin: 65, decMax: 90 },
  { name: "Draco", raMin: 9, raMax: 20, decMin: 50, decMax: 85 },
  { name: "Cepheus", raMin: 20, raMax: 8, decMin: 50, decMax: 90 },
  { name: "Cassiopeia", raMin: 0, raMax: 6, decMin: 45, decMax: 70 },
  { name: "Perseus", raMin: 1, raMax: 5, decMin: 30, decMax: 60 },
  { name: "Auriga", raMin: 4, raMax: 8, decMin: 30, decMax: 60 },
  { name: "Gemini", raMin: 5, raMax: 8, decMin: 10, decMax: 35 },
  { name: "Cancer", raMin: 7, raMax: 9, decMin: 5, decMax: 35 },
  { name: "Leo", raMin: 9, raMax: 12, decMin: -5, decMax: 35 },
  { name: "Virgo", raMin: 11, raMax: 15, decMin: -15, decMax: 25 },
  { name: "Bootes", raMin: 13, raMax: 16, decMin: 5, decMax: 55 },
  { name: "Corona Borealis", raMin: 15, raMax: 16, decMin: 25, decMax: 40 },
  { name: "Hercules", raMin: 16, raMax: 19, decMin: 5, decMax: 50 },
  { name: "Lyra", raMin: 18, raMax: 19, decMin: 25, decMax: 50 },
  { name: "Cygnus", raMin: 19, raMax: 22, decMin: 25, decMax: 65 },
  { name: "Aquila", raMin: 18, raMax: 21, decMin: -15, decMax: 25 },
  { name: "Delphinus", raMin: 20, raMax: 21, decMin: 0, decMax: 20 },
  { name: "Pegasus", raMin: 21, raMax: 0, decMin: 0, decMax: 35 },
  { name: "Andromeda", raMin: 22, raMax: 2, decMin: 20, decMax: 55 },
  { name: "Triangulum", raMin: 1, raMax: 2, decMin: 25, decMax: 40 },
  { name: "Aries", raMin: 1, raMax: 3, decMin: 10, decMax: 35 },
  { name: "Taurus", raMin: 3, raMax: 6, decMin: -5, decMax: 35 },
  { name: "Orion", raMin: 4, raMax: 6, decMin: -15, decMax: 25 },
  { name: "Canis Major", raMin: 6, raMax: 7, decMin: -35, decMax: -10 },
  { name: "Canis Minor", raMin: 7, raMax: 8, decMin: -5, decMax: 15 },
  { name: "Monoceros", raMin: 5, raMax: 8, decMin: -15, decMax: 15 },
  { name: "Puppis", raMin: 6, raMax: 8, decMin: -50, decMax: -10 },
  { name: "Carina", raMin: 6, raMax: 11, decMin: -75, decMax: -50 },
  { name: "Vela", raMin: 8, raMax: 11, decMin: -60, decMax: -35 },
  { name: "Centaurus", raMin: 11, raMax: 15, decMin: -65, decMax: -25 },
  { name: "Lupus", raMin: 14, raMax: 16, decMin: -55, decMax: -30 },
  { name: "Scorpius", raMin: 15, raMax: 17, decMin: -45, decMax: -5 },
  { name: "Sagittarius", raMin: 17, raMax: 20, decMin: -45, decMax: -10 },
  { name: "Capricornus", raMin: 20, raMax: 22, decMin: -30, decMax: -5 },
  { name: "Aquarius", raMin: 20, raMax: 23, decMin: -25, decMax: 5 },
  { name: "Pisces", raMin: 22, raMax: 2, decMin: -10, decMax: 35 },
  { name: "Cetus", raMin: 0, raMax: 4, decMin: -25, decMax: 15 },
  { name: "Eridanus", raMin: 1, raMax: 5, decMin: -60, decMax: 0 },
  { name: "Fornax", raMin: 1, raMax: 4, decMin: -40, decMax: -20 },
  { name: "Phoenix", raMin: 23, raMax: 2, decMin: -60, decMax: -40 },
  { name: "Tucana", raMin: 22, raMax: 1, decMin: -75, decMax: -55 },
  { name: "Hydrus", raMin: 0, raMax: 4, decMin: -80, decMax: -60 },
  { name: "Octans", raMin: 0, raMax: 24, decMin: -90, decMax: -75 },
  { name: "Mensa", raMin: 3, raMax: 8, decMin: -85, decMax: -70 },
  { name: "Chamaeleon", raMin: 7, raMax: 14, decMin: -85, decMax: -75 },
  { name: "Apus", raMin: 13, raMax: 18, decMin: -85, decMax: -65 },
  { name: "Pavo", raMin: 17, raMax: 21, decMin: -75, decMax: -55 },
  { name: "Grus", raMin: 21, raMax: 23, decMin: -55, decMax: -35 },
  { name: "Microscopium", raMin: 20, raMax: 21, decMin: -45, decMax: -25 },
  { name: "Indus", raMin: 20, raMax: 23, decMin: -75, decMax: -45 },
  { name: "Telescopium", raMin: 18, raMax: 20, decMin: -55, decMax: -35 },
  { name: "Corona Australis", raMin: 17, raMax: 19, decMin: -50, decMax: -35 },
  { name: "Ara", raMin: 16, raMax: 18, decMin: -70, decMax: -45 },
  { name: "Norma", raMin: 15, raMax: 16, decMin: -60, decMax: -40 },
  { name: "Triangulum Australe", raMin: 14, raMax: 17, decMin: -70, decMax: -55 },
  { name: "Circinus", raMin: 13, raMax: 15, decMin: -70, decMax: -50 },
  { name: "Musca", raMin: 11, raMax: 13, decMin: -75, decMax: -55 },
  { name: "Crux", raMin: 11, raMax: 13, decMin: -65, decMax: -55 },
  { name: "Volans", raMin: 6, raMax: 9, decMin: -75, decMax: -60 },
  { name: "Dorado", raMin: 4, raMax: 6, decMin: -70, decMax: -50 },
  { name: "Reticulum", raMin: 3, raMax: 4, decMin: -70, decMax: -50 },
  { name: "Horologium", raMin: 2, raMax: 4, decMin: -70, decMax: -40 },
  { name: "Pictor", raMin: 4, raMax: 7, decMin: -65, decMax: -40 },
  { name: "Columba", raMin: 5, raMax: 6, decMin: -45, decMax: -25 },
  { name: "Lepus", raMin: 4, raMax: 6, decMin: -30, decMax: -10 },
  { name: "Eridanus", raMin: 1, raMax: 5, decMin: -60, decMax: 0 },
];

/**
 * Determine constellation from RA/Dec coordinates
 * @param ra Right Ascension in degrees
 * @param dec Declination in degrees
 * @returns Constellation name or null if not found
 */
export function getConstellationFromCoordinates(ra: number, dec: number): string | null {
  // Convert RA from degrees to hours (divide by 15)
  const raHours = ra / 15;
  
  // Normalize RA to 0-24 range
  let normalizedRa = raHours % 24;
  if (normalizedRa < 0) normalizedRa += 24;

  for (const boundary of CONSTELLATION_BOUNDARIES) {
    // Handle RA wraparound (e.g., Pegasus spans 21-0 hours)
    let raInRange = false;
    if (boundary.raMin <= boundary.raMax) {
      raInRange = normalizedRa >= boundary.raMin && normalizedRa <= boundary.raMax;
    } else {
      // Handle wraparound case
      raInRange = normalizedRa >= boundary.raMin || normalizedRa <= boundary.raMax;
    }

    if (raInRange && dec >= boundary.decMin && dec <= boundary.decMax) {
      return boundary.name;
    }
  }

  return null;
}

/**
 * Get constellation abbreviation from full name
 * @param constellationName Full constellation name
 * @returns 3-letter abbreviation
 */
export function getConstellationAbbreviation(constellationName: string): string {
  const abbreviations: Record<string, string> = {
    "Andromeda": "And",
    "Antlia": "Ant",
    "Apus": "Aps",
    "Aquarius": "Aqr",
    "Aquila": "Aql",
    "Ara": "Ara",
    "Aries": "Ari",
    "Auriga": "Aur",
    "Bootes": "Boo",
    "Caelum": "Cae",
    "Camelopardalis": "Cam",
    "Cancer": "Cnc",
    "Canes Venatici": "CVn",
    "Canis Major": "CMa",
    "Canis Minor": "CMi",
    "Capricornus": "Cap",
    "Carina": "Car",
    "Cassiopeia": "Cas",
    "Centaurus": "Cen",
    "Cepheus": "Cep",
    "Cetus": "Cet",
    "Chamaeleon": "Cha",
    "Circinus": "Cir",
    "Columba": "Col",
    "Coma Berenices": "Com",
    "Corona Australis": "CrA",
    "Corona Borealis": "CrB",
    "Corvus": "Crv",
    "Crater": "Crt",
    "Crux": "Cru",
    "Cygnus": "Cyg",
    "Delphinus": "Del",
    "Dorado": "Dor",
    "Draco": "Dra",
    "Equuleus": "Equ",
    "Eridanus": "Eri",
    "Fornax": "For",
    "Gemini": "Gem",
    "Grus": "Gru",
    "Hercules": "Her",
    "Horologium": "Hor",
    "Hydra": "Hya",
    "Hydrus": "Hyi",
    "Indus": "Ind",
    "Lacerta": "Lac",
    "Leo": "Leo",
    "Leo Minor": "LMi",
    "Lepus": "Lep",
    "Libra": "Lib",
    "Lupus": "Lup",
    "Lynx": "Lyn",
    "Lyra": "Lyr",
    "Mensa": "Men",
    "Microscopium": "Mic",
    "Monoceros": "Mon",
    "Musca": "Mus",
    "Norma": "Nor",
    "Octans": "Oct",
    "Ophiuchus": "Oph",
    "Orion": "Ori",
    "Pavo": "Pav",
    "Pegasus": "Peg",
    "Perseus": "Per",
    "Phoenix": "Phe",
    "Pictor": "Pic",
    "Pisces": "Psc",
    "Piscis Austrinus": "PsA",
    "Puppis": "Pup",
    "Pyxis": "Pyx",
    "Reticulum": "Ret",
    "Sagitta": "Sge",
    "Sagittarius": "Sgr",
    "Scorpius": "Sco",
    "Sculptor": "Scl",
    "Scutum": "Sct",
    "Serpens": "Ser",
    "Sextans": "Sex",
    "Taurus": "Tau",
    "Telescopium": "Tel",
    "Triangulum": "Tri",
    "Triangulum Australe": "TrA",
    "Tucana": "Tuc",
    "Ursa Major": "UMa",
    "Ursa Minor": "UMi",
    "Vela": "Vel",
    "Virgo": "Vir",
    "Volans": "Vol",
    "Vulpecula": "Vul",
  };

  return abbreviations[constellationName] || constellationName.substring(0, 3).toUpperCase();
}

/**
 * Get constellation information including name, abbreviation, and coordinates
 * @param ra Right Ascension in degrees
 * @param dec Declination in degrees
 * @returns Constellation info object
 */
export function getConstellationInfo(ra: number, dec: number) {
  const constellationName = getConstellationFromCoordinates(ra, dec);
  if (!constellationName) {
    return null;
  }

  return {
    name: constellationName,
    abbreviation: getConstellationAbbreviation(constellationName),
    ra,
    dec,
  };
} 