// Simple test script to verify the configuration system
import { configService } from './server/config.js';

async function testConfig() {
  console.log('Testing configuration system...\n');

  // Test getting config
  console.log('1. Getting current config...');
  const config = await configService.getConfig();
  console.log('Current config:', JSON.stringify(config, null, 2));

  // Test updating config
  console.log('\n2. Updating config with test values...');
  const testConfig = {
    immich: {
      host: 'https://test-immich.example.com',
      apiKey: 'test-immich-key',
      autoSync: true,
      syncFrequency: '0 */2 * * *',
    },
    astrometry: {
      apiKey: 'test-astrometry-key',
      enabled: true,
    },
    app: {
      debugMode: true,
    },
  };

  await configService.updateConfig(testConfig);

  // Test getting updated config
  console.log('\n3. Getting updated config...');
  const updatedConfig = await configService.getConfig();
  console.log('Updated config:', JSON.stringify(updatedConfig, null, 2));

  // Test specific config methods
  console.log('\n4. Testing specific config methods...');
  const immichConfig = await configService.getImmichConfig();
  const astrometryConfig = await configService.getAstrometryConfig();
  const appConfig = await configService.getAppConfig();

  console.log('Immich config:', immichConfig);
  console.log('Astrometry config:', astrometryConfig);
  console.log('App config:', appConfig);

  console.log('\nConfiguration system test completed!');
}

testConfig().catch(console.error); 