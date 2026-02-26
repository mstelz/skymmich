export const mockSettings = {
  immich: {
    host: 'http://localhost:2283',
    apiKey: 'test-api-key-12345',
    autoSync: false,
    syncFrequency: '0 */4 * * *',
    syncByAlbum: false,
    selectedAlbumIds: [],
  },
  astrometry: {
    apiKey: 'test-astrometry-key',
    enabled: true,
    autoEnabled: false,
    checkInterval: 30,
    pollInterval: 5,
    maxConcurrent: 3,
    autoResubmit: false,
  },
  sidecar: {
    enabled: true,
    outputPath: './sidecars',
    organizeByDate: true,
  },
  app: {
    debugMode: false,
  },
};
