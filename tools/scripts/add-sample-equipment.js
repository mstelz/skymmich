import { storage } from './server/shared-storage.js';

async function addSampleEquipment() {
  try {
    console.log('Adding sample equipment...');

    // Add sample equipment
    const equipment = [
      {
        name: "William Optics RedCat 51",
        type: "telescope",
        specifications: { 
          aperture: "51mm", 
          focalLength: "250mm", 
          focalRatio: "f/4.9",
          weight: "1.2kg"
        },
        description: "Compact apochromatic refractor ideal for wide-field imaging"
      },
      {
        name: "ZWO ASI2600MC Pro",
        type: "camera",
        specifications: { 
          sensor: "APS-C", 
          resolution: "26MP", 
          cooling: "TEC",
          pixelSize: "3.76μm"
        },
        description: "High-performance cooled color CMOS camera"
      },
      {
        name: "Sky-Watcher EQ6-R Pro",
        type: "mount",
        specifications: { 
          capacity: "20kg", 
          tracking: "0.5 arcsec",
          weight: "18kg"
        },
        description: "Equatorial mount with high precision tracking"
      },
      {
        name: "Optolong L-eXtreme",
        type: "filter",
        specifications: { 
          bandpass: "7nm", 
          transmission: "95%",
          size: "2\""
        },
        description: "Dual narrowband filter for Ha and OIII"
      },
      {
        name: "ZWO ASI120MM Mini",
        type: "camera",
        specifications: { 
          sensor: "1/3\"", 
          resolution: "1.2MP", 
          cooling: "None",
          pixelSize: "3.75μm"
        },
        description: "Compact guide camera for autoguiding"
      },
      {
        name: "Celestron EdgeHD 8",
        type: "telescope",
        specifications: { 
          aperture: "203mm", 
          focalLength: "2032mm", 
          focalRatio: "f/10",
          weight: "5.4kg"
        },
        description: "Schmidt-Cassegrain telescope with edge technology"
      }
    ];

    for (const eq of equipment) {
      const created = await storage.createEquipment(eq);
      console.log(`Created equipment: ${created.name} (ID: ${created.id})`);
    }

    console.log('Sample equipment added successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error adding sample equipment:', error);
    process.exit(1);
  }
}

addSampleEquipment(); 