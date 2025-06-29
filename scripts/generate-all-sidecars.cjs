const fs = require('fs');

// Read the storage data directly
const storageData = JSON.parse(fs.readFileSync('./data/storage.json', 'utf8'));

function escapeXml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function generateXmpContent(data) {
  const {
    calibration,
    annotations,
    machineTags,
    imageId,
    filename,
    astrometryJobId,
    plateSolvedAt
  } = data;

  const xmpContent = `<?xml version="1.0" encoding="UTF-8"?>
<x:xmpmeta xmlns:x="adobe:ns:meta/" x:xmptk="Astrorep">
  <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
    
    <!-- Dublin Core -->
    <rdf:Description rdf:about=""
      xmlns:dc="http://purl.org/dc/elements/1.1/">
      <dc:title>${escapeXml(filename)}</dc:title>
      <dc:description>Astronomical image plate solved by Astrometry.net</dc:description>
      <dc:subject>
        <rdf:Bag>
          ${machineTags.map(tag => `<rdf:li>${escapeXml(tag)}</rdf:li>`).join('\n          ')}
        </rdf:Bag>
      </dc:subject>
    </rdf:Description>

    <!-- Custom Astronomical Metadata -->
    <rdf:Description rdf:about=""
      xmlns:astro="http://ns.astrometry.net/1.0/">
      <astro:plateSolved>true</astro:plateSolved>
      <astro:astrometryJobId>${astrometryJobId}</astro:astrometryJobId>
      <astro:plateSolvedAt>${plateSolvedAt.toISOString()}</astro:plateSolvedAt>
      <astro:imageId>${imageId}</astro:imageId>
      
      <!-- Calibration Data -->
      <astro:calibration>
        <rdf:Description>
          <astro:ra>${calibration.ra}</astro:ra>
          <astro:dec>${calibration.dec}</astro:dec>
          <astro:pixelScale>${calibration.pixscale}</astro:pixelScale>
          <astro:radius>${calibration.radius}</astro:radius>
          <astro:orientation>${calibration.orientation}</astro:orientation>
          <astro:parity>${calibration.parity}</astro:parity>
          ${calibration.width_arcsec ? `<astro:widthArcsec>${calibration.width_arcsec}</astro:widthArcsec>` : ''}
          ${calibration.height_arcsec ? `<astro:heightArcsec>${calibration.height_arcsec}</astro:heightArcsec>` : ''}
        </rdf:Description>
      </astro:calibration>

      <!-- Annotations -->
      <astro:annotations>
        <rdf:Bag>
          ${annotations.map(ann => `
          <rdf:li>
            <rdf:Description>
              <astro:type>${ann.type}</astro:type>
              <astro:names>
                <rdf:Bag>
                  ${ann.names.map(name => `<rdf:li>${escapeXml(name)}</rdf:li>`).join('\n                  ')}
                </rdf:Bag>
              </astro:names>
              <astro:pixelX>${ann.pixelx}</astro:pixelX>
              <astro:pixelY>${ann.pixely}</astro:pixelY>
              ${ann.radius ? `<astro:radius>${ann.radius}</astro:radius>` : ''}
              ${ann.ra ? `<astro:ra>${ann.ra}</astro:ra>` : ''}
              ${ann.dec ? `<astro:dec>${ann.dec}</astro:dec>` : ''}
              ${ann.vmag ? `<astro:magnitude>${ann.vmag}</astro:magnitude>` : ''}
            </rdf:Description>
          </rdf:li>`).join('\n          ')}
        </rdf:Bag>
      </astro:annotations>
    </rdf:Description>

    <!-- IPTC Keywords (for compatibility with photo management software) -->
    <rdf:Description rdf:about=""
      xmlns:iptc="http://iptc.org/std/Iptc4xmpCore/1.0/xmlns/">
      <iptc:Keywords>
        <rdf:Bag>
          ${machineTags.map(tag => `<rdf:li>${escapeXml(tag)}</rdf:li>`).join('\n        ')}
        </rdf:Bag>
      </iptc:Keywords>
    </rdf:Description>

  </rdf:RDF>
</x:xmpmeta>`;

  return xmpContent;
}

function generateAllSidecars() {
  // Find all plate-solved images
  const plateSolvedImages = storageData.astroImages.filter(img => img.plateSolved);
  
  console.log(`Found ${plateSolvedImages.length} plate-solved images.`);

  // Create sidecars directory if it doesn't exist
  const sidecarDir = './sidecars';
  if (!fs.existsSync(sidecarDir)) {
    fs.mkdirSync(sidecarDir, { recursive: true });
  }

  let successCount = 0;
  let errorCount = 0;

  for (const image of plateSolvedImages) {
    try {
      console.log(`Processing: ${image.filename}`);
      
      // Find the corresponding job
      const job = storageData.plateSolvingJobs.find(j => j.imageId === image.id && j.status === 'success');
      if (!job) {
        console.log(`  ⚠️  No successful job found, skipping`);
        continue;
      }

      // Build the data object
      const data = {
        calibration: {
          ra: job.result.ra,
          dec: job.result.dec,
          pixscale: job.result.pixscale,
          radius: job.result.radius,
          orientation: job.result.orientation,
          parity: job.result.parity,
          width_arcsec: job.result.width_arcsec,
          height_arcsec: job.result.height_arcsec
        },
        annotations: job.result.annotations || [],
        machineTags: image.tags.filter(tag => tag !== 'astrophotography'),
        imageId: image.immichId,
        filename: image.filename,
        astrometryJobId: job.astrometryJobId,
        plateSolvedAt: new Date()
      };

      const xmpContent = generateXmpContent(data);
      const sidecarPath = `${sidecarDir}/${image.filename}.xmp`;
      fs.writeFileSync(sidecarPath, xmpContent, 'utf8');
      
      console.log(`  ✓ Generated: ${sidecarPath} (${xmpContent.length} bytes)`);
      successCount++;
      
    } catch (error) {
      console.error(`  ✗ Failed to process ${image.filename}:`, error.message);
      errorCount++;
    }
  }

  console.log(`\n=== SUMMARY ===`);
  console.log(`Successfully generated: ${successCount} XMP sidecars`);
  console.log(`Errors: ${errorCount}`);
  console.log(`Total processed: ${successCount + errorCount}`);
}

generateAllSidecars(); 