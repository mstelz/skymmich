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
    autoEnabled: boolean;
    checkInterval: number;
    pollInterval: number;
    maxConcurrent: number;
    autoResubmit: boolean;
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
    
    // Fall back to hardcoded defaults if admin settings are not available
    const defaultConfig = this.getHardcodedDefaults();
    
    // Merge with admin settings taking priority over defaults
    this.config = {
      immich: {
        host: adminSettings.immich?.host || defaultConfig.immich.host,
        apiKey: adminSettings.immich?.apiKey || defaultConfig.immich.apiKey,
        autoSync: adminSettings.immich?.autoSync ?? defaultConfig.immich.autoSync,
        syncFrequency: adminSettings.immich?.syncFrequency || defaultConfig.immich.syncFrequency,
        syncByAlbum: adminSettings.immich?.syncByAlbum ?? defaultConfig.immich.syncByAlbum,
        selectedAlbumIds: adminSettings.immich?.selectedAlbumIds || defaultConfig.immich.selectedAlbumIds,
      },
      astrometry: {
        apiKey: adminSettings.astrometry?.apiKey || defaultConfig.astrometry.apiKey,
        enabled: adminSettings.astrometry?.enabled ?? defaultConfig.astrometry.enabled,
        autoEnabled: adminSettings.astrometry?.autoEnabled ?? defaultConfig.astrometry.autoEnabled,
        checkInterval: adminSettings.astrometry?.checkInterval ?? defaultConfig.astrometry.checkInterval,
        pollInterval: adminSettings.astrometry?.pollInterval ?? defaultConfig.astrometry.pollInterval,
        maxConcurrent: adminSettings.astrometry?.maxConcurrent ?? defaultConfig.astrometry.maxConcurrent,
        autoResubmit: adminSettings.astrometry?.autoResubmit ?? defaultConfig.astrometry.autoResubmit,
      },
      app: {
        debugMode: adminSettings.app?.debugMode ?? defaultConfig.app.debugMode,
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

  private getHardcodedDefaults(): AppConfig {
    // These are minimal defaults used only when DB is empty on first run
    // User must configure URLs/API keys through admin UI to make anything functional
    return {
      immich: {
        host: "",  // Empty - user must configure
        apiKey: "",  // Empty - user must configure
        autoSync: false,  // Disabled by default
        syncFrequency: "0 */4 * * *",  // Default cron (every 4 hours)
        syncByAlbum: false,  // Disabled by default
        selectedAlbumIds: [],  // Empty array
      },
      astrometry: {
        apiKey: "",  // Empty - user must configure
        enabled: false,  // Disabled until user provides API key
        autoEnabled: false,  // Disabled by default
        checkInterval: 30,  // Reasonable default (seconds)
        pollInterval: 5,  // Reasonable default (seconds)
        maxConcurrent: 3,  // Reasonable default
        autoResubmit: false,  // Disabled by default
      },
      app: {
        debugMode: false,  // Disabled by default
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