import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- BEGIN: Copied from server/constellation-utils.ts ---
const CONSTELLATION_BOUNDARIES = [
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

function getConstellationFromCoordinates(ra, dec) {
  const raHours = ra / 15;
  let normalizedRa = raHours % 24;
  if (normalizedRa < 0) normalizedRa += 24;
  for (const boundary of CONSTELLATION_BOUNDARIES) {
    let raInRange = false;
    if (boundary.raMin <= boundary.raMax) {
      raInRange = normalizedRa >= boundary.raMin && normalizedRa <= boundary.raMax;
    } else {
      raInRange = normalizedRa >= boundary.raMin || normalizedRa <= boundary.raMax;
    }
    if (raInRange && dec >= boundary.decMin && dec <= boundary.decMax) {
      return boundary.name;
    }
  }
  return null;
}
// --- END: Copied from server/constellation-utils.ts ---

// Read the storage file
const storagePath = path.join(__dirname, 'data', 'storage.json');
const storageData = JSON.parse(fs.readFileSync(storagePath, 'utf8'));

console.log('Updating constellations for existing images...');

let updatedCount = 0;

// Update each image with constellation information
storageData.astroImages.forEach(image => {
  if (image.plateSolved && image.ra && image.dec && !image.constellation) {
    const ra = parseFloat(image.ra);
    const dec = parseFloat(image.dec);
    
    if (!isNaN(ra) && !isNaN(dec)) {
      const constellation = getConstellationFromCoordinates(ra, dec);
      if (constellation) {
        image.constellation = constellation;
        updatedCount++;
        console.log(`Updated ${image.title}: ${constellation} (RA: ${ra}, Dec: ${dec})`);
      } else {
        console.log(`No constellation found for ${image.title} (RA: ${ra}, Dec: ${dec})`);
      }
    } else {
      console.log(`Invalid coordinates for ${image.title}: RA=${image.ra}, Dec=${image.dec}`);
    }
  } else if (image.constellation) {
    console.log(`Image ${image.title} already has constellation: ${image.constellation}`);
  } else if (!image.plateSolved) {
    console.log(`Image ${image.title} not plate solved, skipping`);
  } else {
    console.log(`Image ${image.title} missing coordinates, skipping`);
  }
});

// Write the updated data back to the file
fs.writeFileSync(storagePath, JSON.stringify(storageData, null, 2));

console.log(`\nUpdated ${updatedCount} images with constellation information.`);
console.log('Storage file updated successfully.'); 