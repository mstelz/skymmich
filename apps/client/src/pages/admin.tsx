import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Header } from '@/components/header';
import { 
  Settings, 
  Database, 
  Key, 
  Globe, 
  Album, 
  Save,
  TestTube,
  CheckCircle,
  XCircle,
  Loader2,
  AlertTriangle,
  Info,
  Bell
} from 'lucide-react';
import { Link } from 'wouter';
import { useToast } from '@/hooks/use-toast';

interface ImmichAlbum {
  id: string;
  albumName: string;
}

interface AdminSettings {
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
    checkInterval: number; // Worker check interval in seconds
    pollInterval: number; // Active polling interval in seconds
    maxConcurrent: number; // Max concurrent jobs
    autoResubmit: boolean; // Whether to auto-resubmit failed jobs
  };
  app: {
    debugMode: boolean;
  };
}

interface Notification {
  id: number;
  type: 'error' | 'warning' | 'info' | 'success';
  title: string;
  message: string;
  details?: any;
  timestamp: string;
  acknowledged: boolean;
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
    },
    astrometry: {
      apiKey: '',
      enabled: true,
      checkInterval: 30, // 30 seconds
      pollInterval: 5, // 5 seconds
      maxConcurrent: 3,
      autoResubmit: false, // Don't auto-resubmit failed jobs
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
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [albums, setAlbums] = useState<ImmichAlbum[]>([]);
  const [albumsLoading, setAlbumsLoading] = useState(false);
  const [albumError, setAlbumError] = useState<string | null>(null);

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
    loadNotifications();
    fetchAlbums();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await fetch('/api/admin/settings');
      if (response.ok) {
        const data = await response.json();
        setSettings(data);
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

  const loadNotifications = async () => {
    try {
      const response = await fetch('/api/notifications');
      if (response.ok) {
        const data = await response.json();
        setNotifications(data);
      }
    } catch (error) {
      console.error('Failed to load notifications:', error);
    }
  };

  const acknowledgeNotification = async (id: number) => {
    try {
      const response = await fetch(`/api/notifications/${id}/acknowledge`, {
        method: 'POST',
      });
      if (response.ok) {
        setNotifications(prev => prev.filter(n => n.id !== id));
        toast({
          title: "Success",
          description: "Notification acknowledged",
        });
      }
    } catch (error) {
      console.error('Failed to acknowledge notification:', error);
      toast({
        title: "Error",
        description: "Failed to acknowledge notification",
        variant: "destructive",
      });
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      default:
        return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
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
    setImmichTestStatus('testing');
    setImmichTestMessage('');
    
    try {
      const response = await fetch('/api/test-immich-connection', {
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

  const getTestButtonIcon = (status: 'idle' | 'testing' | 'success' | 'error') => {
    switch (status) {
      case 'testing':
        return <Loader2 className="h-4 w-4 animate-spin" />;
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return null;
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
      <Header onSync={() => {}} />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center space-x-4 mb-8">
          <Settings className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Admin Settings</h1>
            <p className="text-muted-foreground">Configure your AstroViewer application</p>
          </div>
        </div>

        {/* Notifications Section */}
        {notifications.length > 0 && (
          <Card className="mb-6 border-orange-200 bg-orange-50">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-orange-800">
                <Bell className="h-5 w-5" />
                <span>System Notifications ({notifications.length})</span>
              </CardTitle>
              <CardDescription className="text-orange-700">
                Please review and acknowledge these notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {notifications.map((notification) => (
                <div key={notification.id} className="flex items-start space-x-3 p-3 bg-white rounded-lg border">
                  {getNotificationIcon(notification.type)}
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{notification.title}</h4>
                    <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                    <p className="text-xs text-gray-500 mt-2">
                      {formatTimestamp(notification.timestamp)}
                    </p>
                  </div>
                  <Button
                    onClick={() => acknowledgeNotification(notification.id)}
                    size="sm"
                    variant="outline"
                  >
                    Acknowledge
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        <form onSubmit={(e) => { e.preventDefault(); saveSettings(); }}>
          {/* Immich Configuration */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center">
                Immich Configuration
              </CardTitle>
              <CardDescription>
                Configure your Immich server connection for image synchronization
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="immichHost">Immich Server URL</Label>
                  <Input
                    id="immichHost"
                    type="url"
                    placeholder="https://your-immich-server.com"
                    value={settings.immich.host}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      immich: { ...prev.immich, host: e.target.value }
                    }))}
                  />
                </div>
                <div>
                  <Label htmlFor="immichApiKey">API Key</Label>
                  <Input
                    id="immichApiKey"
                    type="password"
                    placeholder="Enter your Immich API key"
                    value={settings.immich.apiKey}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      immich: { ...prev.immich, apiKey: e.target.value }
                    }))}
                  />
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="immichAutoSync"
                  checked={settings.immich.autoSync}
                  onCheckedChange={(checked) => setSettings(prev => ({
                    ...prev,
                    immich: { ...prev.immich, autoSync: checked }
                  }))}
                />
                <Label htmlFor="immichAutoSync">Enable automatic synchronization</Label>
              </div>

              {/* Sync by album toggle */}
              <div className="flex items-center space-x-2">
                <Switch
                  id="immichSyncByAlbum"
                  checked={settings.immich.syncByAlbum}
                  onCheckedChange={(checked) => setSettings(prev => ({
                    ...prev,
                    immich: { ...prev.immich, syncByAlbum: checked }
                  }))}
                />
                <Label htmlFor="immichSyncByAlbum">Sync by album only</Label>
              </div>

              {/* Album selection if syncByAlbum is enabled */}
              {settings.immich.syncByAlbum && (
                <div>
                  <Label htmlFor="immichAlbums">Select albums to sync</Label>
                  {albumsLoading ? (
                    <div className="text-sm text-muted-foreground">Loading albums...</div>
                  ) : albumError ? (
                    <div className="text-sm text-red-500">{albumError}</div>
                  ) : (
                    <select
                      id="immichAlbums"
                      multiple
                      className="input w-full mt-1"
                      value={settings.immich.selectedAlbumIds}
                      onChange={e => {
                        const selected = Array.from(e.target.selectedOptions).map(opt => opt.value);
                        setSettings(prev => ({
                          ...prev,
                          immich: { ...prev.immich, selectedAlbumIds: selected }
                        }));
                      }}
                    >
                      {albums.map(album => (
                        <option key={album.id} value={album.id}>{album.albumName}</option>
                      ))}
                    </select>
                  )}
                  {/* Validation: must select at least one album */}
                  {settings.immich.syncByAlbum && settings.immich.selectedAlbumIds.length === 0 && (
                    <div className="text-xs text-red-500 mt-1">You must select at least one album to sync.</div>
                  )}
                </div>
              )}

              {settings.immich.autoSync && (
                <div>
                  <Label htmlFor="immichSyncFrequency">Sync Frequency (Cron Expression)</Label>
                  <Input
                    id="immichSyncFrequency"
                    placeholder="0 */4 * * *"
                    value={settings.immich.syncFrequency}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      immich: { ...prev.immich, syncFrequency: e.target.value }
                    }))}
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Example: "0 */4 * * *" = every 4 hours. 
                    <a 
                      href="https://crontab.guru" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:underline ml-1"
                    >
                      Learn more
                    </a>
                  </p>
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="flex-1">
                  {immichTestMessage && (
                    <p className={`text-sm ${immichTestStatus === 'error' ? 'text-red-600' : 'text-green-600'}`}>
                      {immichTestMessage}
                    </p>
                  )}
                </div>
                <Button onClick={testImmichConnection} disabled={immichTestStatus === 'testing'} size="sm" variant="outline">
                  {getTestButtonIcon(immichTestStatus)}
                  Test Connection
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Astrometry.net Configuration */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center">
                Astrometry.net Configuration
              </CardTitle>
              <CardDescription>
                Configure plate solving with Astrometry.net
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2 mb-4">
                <Switch
                  id="astrometryEnabled"
                  checked={settings.astrometry.enabled}
                  onCheckedChange={(checked) => setSettings(prev => ({
                    ...prev,
                    astrometry: { ...prev.astrometry, enabled: checked }
                  }))}
                />
                <Label htmlFor="astrometryEnabled">Enable plate solving</Label>
              </div>

              {settings.astrometry.enabled && (
                <>
                  <div>
                    <Label htmlFor="astrometryApiKey">API Key</Label>
                    <Input
                      id="astrometryApiKey"
                      type="password"
                      placeholder="Enter your Astrometry.net API key"
                      value={settings.astrometry.apiKey}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        astrometry: { ...prev.astrometry, apiKey: e.target.value }
                      }))}
                    />
                    <p className="text-sm text-muted-foreground mt-1">
                      Get your API key from{" "}
                      <a 
                        href="https://nova.astrometry.net/" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        nova.astrometry.net
                      </a>
                    </p>
                  </div>

                  <Separator />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="checkInterval">Worker Check Interval (seconds)</Label>
                      <Input
                        id="checkInterval"
                        type="number"
                        min="10"
                        max="300"
                        value={settings.astrometry.checkInterval}
                        onChange={(e) => setSettings(prev => ({
                          ...prev,
                          astrometry: { ...prev.astrometry, checkInterval: parseInt(e.target.value) || 30 }
                        }))}
                      />
                      <p className="text-sm text-muted-foreground mt-1">
                        How often the worker checks for new jobs and updates existing ones
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="pollInterval">Active Polling Interval (seconds)</Label>
                      <Input
                        id="pollInterval"
                        type="number"
                        min="1"
                        max="60"
                        value={settings.astrometry.pollInterval}
                        onChange={(e) => setSettings(prev => ({
                          ...prev,
                          astrometry: { ...prev.astrometry, pollInterval: parseInt(e.target.value) || 5 }
                        }))}
                      />
                      <p className="text-sm text-muted-foreground mt-1">
                        How often to poll when actively waiting for job completion
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="maxConcurrent">Max Concurrent Jobs</Label>
                      <Input
                        id="maxConcurrent"
                        type="number"
                        min="1"
                        max="10"
                        value={settings.astrometry.maxConcurrent}
                        onChange={(e) => setSettings(prev => ({
                          ...prev,
                          astrometry: { ...prev.astrometry, maxConcurrent: parseInt(e.target.value) || 3 }
                        }))}
                      />
                      <p className="text-sm text-muted-foreground mt-1">
                        Maximum number of plate solving jobs to run simultaneously
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="autoResubmit"
                      checked={settings.astrometry.autoResubmit}
                      onCheckedChange={(checked) => setSettings(prev => ({
                        ...prev,
                        astrometry: { ...prev.astrometry, autoResubmit: checked }
                      }))}
                    />
                    <Label htmlFor="autoResubmit">Auto-resubmit failed jobs</Label>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    When disabled, failed jobs must be manually resubmitted. When enabled, failed jobs will be automatically retried.
                  </p>
                </>
              )}

              <div className="flex items-center justify-between">
                <div className="flex-1">
                  {astrometryTestMessage && (
                    <p className={`text-sm ${astrometryTestStatus === 'error' ? 'text-red-600' : 'text-green-600'}`}>
                      {astrometryTestMessage}
                    </p>
                  )}
                </div>
                <Button 
                  onClick={testAstrometryConnection} 
                  disabled={astrometryTestStatus === 'testing' || !settings.astrometry.enabled} 
                  size="sm" 
                  variant="outline"
                >
                  {getTestButtonIcon(astrometryTestStatus)}
                  Test Connection
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* App Settings */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center">
                Application Settings
              </CardTitle>
              <CardDescription>
                General application configuration
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <Switch
                  id="debugMode"
                  checked={settings.app.debugMode}
                  onCheckedChange={(checked) => setSettings(prev => ({
                    ...prev,
                    app: { ...prev.app, debugMode: checked }
                  }))}
                />
                <Label htmlFor="debugMode">Enable debug mode</Label>
              </div>
            </CardContent>
          </Card>

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