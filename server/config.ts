import { storage } from './storage';

export interface AppConfig {
  immich: {
    host: string;
    apiKey: string;
    autoSync: boolean;
    syncFrequency: string;
    syncByAlbum: boolean;
    selectedAlbumIds: string[];
  };
  astrometry: {
    apiKey: string;
    enabled: boolean;
  };
  app: {
    debugMode: boolean;
  };
}

class ConfigService {
  private config: AppConfig | null = null;

  async getConfig(): Promise<AppConfig> {
    if (this.config) {
      return this.config;
    }

    // Try to get admin settings first (from storage)
    const adminSettings = await this.getAdminSettings();
    
    // Fall back to environment variables if admin settings are not available
    const envConfig = this.getEnvConfig();
    
    // Merge with admin settings taking priority
    this.config = {
      immich: {
        host: adminSettings.immich?.host || envConfig.immich.host,
        apiKey: adminSettings.immich?.apiKey || envConfig.immich.apiKey,
        autoSync: adminSettings.immich?.autoSync ?? envConfig.immich.autoSync,
        syncFrequency: adminSettings.immich?.syncFrequency || envConfig.immich.syncFrequency,
        syncByAlbum: adminSettings.immich?.syncByAlbum ?? envConfig.immich.syncByAlbum ?? true,
        selectedAlbumIds: adminSettings.immich?.selectedAlbumIds || envConfig.immich.selectedAlbumIds || [],
      },
      astrometry: {
        apiKey: adminSettings.astrometry?.apiKey || envConfig.astrometry.apiKey,
        enabled: adminSettings.astrometry?.enabled ?? envConfig.astrometry.enabled,
      },
      app: {
        debugMode: adminSettings.app?.debugMode ?? envConfig.app.debugMode,
      },
    };

    return this.config;
  }

  private async getAdminSettings(): Promise<Partial<AppConfig>> {
    try {
      const settings = await storage.getAdminSettings();
      return settings;
    } catch (error) {
      console.warn('Failed to load admin settings:', error);
      return {};
    }
  }

  private getEnvConfig(): AppConfig {
    return {
      immich: {
        host: process.env.IMMICH_URL || process.env.IMMICH_API_URL || "",
        apiKey: process.env.IMMICH_API_KEY || process.env.IMMICH_KEY || "",
        autoSync: process.env.IMMICH_AUTO_SYNC === 'true',
        syncFrequency: process.env.IMMICH_SYNC_FREQUENCY || "0 */4 * * *",
        syncByAlbum: process.env.IMMICH_SYNC_BY_ALBUM === 'true',
        selectedAlbumIds: process.env.IMMICH_SELECTED_ALBUM_IDS ? process.env.IMMICH_SELECTED_ALBUM_IDS.split(',') : [],
      },
      astrometry: {
        apiKey: process.env.ASTROMETRY_API_KEY || process.env.ASTROMETRY_KEY || "",
        enabled: process.env.ASTROMETRY_ENABLED !== 'false',
      },
      app: {
        debugMode: process.env.DEBUG_MODE === 'true',
      },
    };
  }

  async updateConfig(newConfig: Partial<AppConfig>): Promise<void> {
    // Update admin settings in storage
    await this.saveAdminSettings(newConfig);
    
    // Clear cached config so it will be reloaded
    this.config = null;
  }

  private async saveAdminSettings(config: Partial<AppConfig>): Promise<void> {
    try {
      await storage.updateAdminSettings(config);
    } catch (error) {
      console.error('Failed to save admin settings:', error);
      throw error;
    }
  }

  // Method to get specific config values
  async getImmichConfig() {
    const config = await this.getConfig();
    return config.immich;
  }

  async getAstrometryConfig() {
    const config = await this.getConfig();
    return config.astrometry;
  }

  async getAppConfig() {
    const config = await this.getConfig();
    return config.app;
  }
}

export const configService = new ConfigService(); 