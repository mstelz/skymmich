import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Settings,
  Save,
  Loader2,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Notification } from '@shared/types';
import { useQuery } from '@tanstack/react-query';
import { Header } from '@/components/header';
import { NotificationsSection } from '@/components/admin/notifications-section';
import { ImmichSection } from '@/components/admin/immich-section';
import { AstrometrySection } from '@/components/admin/astrometry-section';
import { SidecarSection } from '@/components/admin/sidecar-section';
import { CatalogSection } from '@/components/admin/catalog-section';
import { AppSettingsSection } from '@/components/admin/app-settings-section';

export interface ImmichAlbum {
  id: string;
  albumName: string;
}

export interface AdminSettings {
  immich: {
    host: string;
    apiKey: string;
    autoSync: boolean;
    syncFrequency: string;
    syncByAlbum: boolean;
    selectedAlbumIds: string[];
    metadataSyncEnabled: boolean;
    syncDescription: boolean;
    syncCoordinates: boolean;
    syncTags: boolean;
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
  sidecar: {
    enabled: boolean;
    outputPath: string;
    organizeByDate: boolean;
  };
  app: {
    debugMode: boolean;
  };
}

export default function AdminPage() {
  const { toast } = useToast();
  const [settings, setSettings] = useState<AdminSettings>({
    immich: {
      host: '',
      apiKey: '',
      autoSync: false,
      syncFrequency: '0 */4 * * *',
      syncByAlbum: true,
      selectedAlbumIds: [],
      metadataSyncEnabled: false,
      syncDescription: true,
      syncCoordinates: true,
      syncTags: true,
    },
    astrometry: {
      apiKey: '',
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
  });
  const [loading, setLoading] = useState(false);
  const [immichTestStatus, setImmichTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [astrometryTestStatus, setAstrometryTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [immichTestMessage, setImmichTestMessage] = useState('');
  const [astrometryTestMessage, setAstrometryTestMessage] = useState('');
  const [showAllNotifications, setShowAllNotifications] = useState(false);
  const [albums, setAlbums] = useState<ImmichAlbum[]>([]);
  const [albumsLoading, setAlbumsLoading] = useState(false);
  const [albumError, setAlbumError] = useState<string | null>(null);

  // Use React Query for notifications for consistent state across Header and Admin
  const { data: notifications = [] } = useQuery<Notification[]>({
    queryKey: ["/api/notifications"],
  });

  // Catalog status
  const { data: catalogStatus, refetch: refetchCatalogStatus } = useQuery<{ count: number; lastUpdated: string | null; commitSha: string | null }>({
    queryKey: ["/api/catalog/status"],
  });

  // Fetch albums helper
  const fetchAlbums = async () => {
    setAlbumsLoading(true);
    setAlbumError(null);
    try {
      const response = await fetch('/api/immich/albums', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          host: settings.immich.host,
          apiKey: settings.immich.apiKey,
        }),
      });
      if (response.ok) {
        const data = await response.json();
        setAlbums(data);
      } else {
        setAlbumError('Failed to fetch albums');
      }
    } catch (e) {
      setAlbumError('Failed to fetch albums');
    } finally {
      setAlbumsLoading(false);
    }
  };

  // Load settings on component mount
  useEffect(() => {
    loadSettings();
    fetchAlbums();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await fetch('/api/admin/settings');
      if (response.ok) {
        const data = await response.json();
        setSettings(prev => ({
          ...prev,
          ...data,
          sidecar: { ...prev.sidecar, ...data.sidecar },
        }));
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
      toast({
        title: "Error",
        description: "Failed to load settings",
        variant: "destructive",
      });
    }
  };

  const saveSettings = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Settings saved successfully",
        });
      } else {
        throw new Error('Failed to save settings');
      }
    } catch (error) {
      console.error('Failed to save settings:', error);
      toast({
        title: "Error",
        description: "Failed to save settings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const testImmichConnection = async () => {
    if (!settings.immich.host.trim() || !settings.immich.apiKey.trim()) {
      setImmichTestStatus('error');
      setImmichTestMessage('Please enter both host URL and API key before testing');
      return;
    }

    setImmichTestStatus('testing');
    setImmichTestMessage('');

    try {
      const response = await fetch('/api/immich/test-immich-connection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          host: settings.immich.host,
          apiKey: settings.immich.apiKey,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setImmichTestStatus('success');
        setImmichTestMessage(data.message);
      } else {
        setImmichTestStatus('error');
        setImmichTestMessage(data.message);
      }
    } catch (error) {
      setImmichTestStatus('error');
      setImmichTestMessage('Connection test failed');
    }
  };

  const testAstrometryConnection = async () => {
    setAstrometryTestStatus('testing');
    setAstrometryTestMessage('');

    try {
      const response = await fetch('/api/test-astrometry-connection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          apiKey: settings.astrometry.apiKey,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setAstrometryTestStatus('success');
        setAstrometryTestMessage(data.message);
      } else {
        setAstrometryTestStatus('error');
        setAstrometryTestMessage(data.message);
      }
    } catch (error) {
      setAstrometryTestStatus('error');
      setAstrometryTestMessage('Connection test failed');
    }
  };

  // Fetch albums from Immich when syncByAlbum, host, or apiKey changes
  useEffect(() => {
    if (
      settings.immich.syncByAlbum &&
      settings.immich.host &&
      settings.immich.apiKey
    ) {
      fetchAlbums();
    } else if (!settings.immich.syncByAlbum) {
      setAlbums([]);
    }
  }, [settings.immich.syncByAlbum, settings.immich.host, settings.immich.apiKey]);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center space-x-4 mb-8">
          <Settings className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Admin Settings</h1>
            <p className="text-muted-foreground">Configure your AstroViewer application</p>
          </div>
        </div>

        <NotificationsSection
          notifications={notifications}
          showAllNotifications={showAllNotifications}
          setShowAllNotifications={setShowAllNotifications}
        />

        <form onSubmit={(e) => { e.preventDefault(); saveSettings(); }}>
          <ImmichSection
            settings={settings}
            setSettings={setSettings}
            albums={albums}
            albumsLoading={albumsLoading}
            albumError={albumError}
            immichTestStatus={immichTestStatus}
            immichTestMessage={immichTestMessage}
            testImmichConnection={testImmichConnection}
          />

          <AstrometrySection
            settings={settings}
            setSettings={setSettings}
            astrometryTestStatus={astrometryTestStatus}
            astrometryTestMessage={astrometryTestMessage}
            testAstrometryConnection={testAstrometryConnection}
          />

          <SidecarSection
            settings={settings}
            setSettings={setSettings}
          />

          <CatalogSection
            catalogStatus={catalogStatus}
            refetchCatalogStatus={refetchCatalogStatus}
          />

          <AppSettingsSection
            settings={settings}
            setSettings={setSettings}
          />

          {/* Save Button */}
          <div className="flex justify-end">
            <Button type="submit" className="sky-button-primary" disabled={loading}>
              <Save className="mr-2 h-4 w-4" />
              {loading ? 'Saving...' : 'Save Settings'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
