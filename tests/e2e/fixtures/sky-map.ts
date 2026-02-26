export const mockSkyMapMarkers = [
  {
    id: 1,
    title: 'Orion Nebula (M42)',
    ra: '83.82208',
    dec: '-5.39111',
    thumbnailUrl: '/api/placeholder/400/300',
    objectType: 'Nebula',
    constellation: 'Orion',
    fieldOfView: '1.2° x 0.9°',
  },
  {
    id: 3,
    title: 'Ring Nebula (M57)',
    ra: '283.39625',
    dec: '33.02917',
    thumbnailUrl: '/api/placeholder/400/300',
    objectType: 'Planetary Nebula',
    constellation: 'Lyra',
    fieldOfView: '0.3° x 0.2°',
  },
];

export const emptySkyMapMarkers: typeof mockSkyMapMarkers = [];
