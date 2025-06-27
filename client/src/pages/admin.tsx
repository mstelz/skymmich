import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Header } from "@/components/header";
import { 
  Settings, 
  Database, 
  Key, 
  Globe, 
  Album, 
  Save,
  TestTube,
  CheckCircle,
  XCircle
} from "lucide-react";
import { Link } from "wouter";

interface AdminSettings {
  immich: {
    host: string;
    apiKey: string;
    syncAlbums: string[];
    autoSync: boolean;
    syncFrequency: string;
  };
  astrometry: {
    apiKey: string;
    enabled: boolean;
  };
  app: {
    debugMode: boolean;
  };
}

export default function AdminPage() {
  const [settings, setSettings] = useState<AdminSettings>({
    immich: {
      host: localStorage.getItem('immichHost') || '',
      apiKey: localStorage.getItem('immichApiKey') || '',
      syncAlbums: JSON.parse(localStorage.getItem('immichSyncAlbums') || '[]'),
      autoSync: localStorage.getItem('immichAutoSync') === 'true',
      syncFrequency: localStorage.getItem('immichSyncFrequency') || '0 */4 * * *',
    },
    astrometry: {
      apiKey: localStorage.getItem('astrometryApiKey') || '',
      enabled: localStorage.getItem('astrometryEnabled') !== 'false',
    },
    app: {
      debugMode: localStorage.getItem('debugMode') === 'true',
    },
  });

  const [immichTestStatus, setImmichTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [immichTestMessage, setImmichTestMessage] = useState('');
  const [astrometryTestStatus, setAstrometryTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [astrometryTestMessage, setAstrometryTestMessage] = useState('');

  const handleSync = async () => {
    try {
      const response = await fetch("/api/sync-immich", { 
        method: "POST",
        credentials: "include"
      });
      
      if (response.ok) {
        console.log("Sync completed");
      }
    } catch (error) {
      console.error("Sync failed:", error);
    }
  };

  const saveSettings = () => {
    localStorage.setItem('immichHost', settings.immich.host);
    localStorage.setItem('immichApiKey', settings.immich.apiKey);
    localStorage.setItem('immichSyncAlbums', JSON.stringify(settings.immich.syncAlbums));
    localStorage.setItem('immichAutoSync', settings.immich.autoSync.toString());
    localStorage.setItem('immichSyncFrequency', settings.immich.syncFrequency);
    localStorage.setItem('astrometryApiKey', settings.astrometry.apiKey);
    localStorage.setItem('astrometryEnabled', settings.astrometry.enabled.toString());
    localStorage.setItem('debugMode', settings.app.debugMode.toString());
  };

  const testImmichConnection = async () => {
    setImmichTestStatus('testing');
    setImmichTestMessage('Testing connection...');
    
    try {
      // Test through our backend to avoid CORS issues
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
      
      if (response.ok && data.success) {
        setImmichTestStatus('success');
        setImmichTestMessage('Connection successful!');
      } else {
        setImmichTestStatus('error');
        setImmichTestMessage(data.message || 'Connection failed. Please check your host and API key.');
      }
    } catch (error) {
      setImmichTestStatus('error');
      setImmichTestMessage(`Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}. Please check your host URL and API key.`);
    }
  };

  const testAstrometryConnection = async () => {
    setAstrometryTestStatus('testing');
    setAstrometryTestMessage('Testing Astrometry.net connection...');
    
    try {
      // Test through our backend to avoid CORS issues
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
      
      if (response.ok && data.success) {
        setAstrometryTestStatus('success');
        setAstrometryTestMessage('Astrometry.net connection successful!');
      } else {
        setAstrometryTestStatus('error');
        setAstrometryTestMessage(data.message || 'Astrometry.net connection failed. Please check your API key.');
      }
    } catch (error) {
      setAstrometryTestStatus('error');
      setAstrometryTestMessage(`Astrometry.net connection failed: ${error instanceof Error ? error.message : 'Unknown error'}. Please check your API key.`);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header onSync={handleSync} />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center space-x-4 mb-8">
          <Link href="/" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
            <Settings className="text-primary text-2xl" />
            <h1 className="text-2xl font-bold text-foreground">Admin Settings</h1>
          </Link>
        </div>

        <div className="space-y-6">
          {/* Immich Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Database className="text-primary" />
                <span>Immich Configuration</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="immich-host">Immich Host</Label>
                  <Input
                    id="immich-host"
                    placeholder="https://your-immich-instance.com"
                    value={settings.immich.host}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      immich: { ...prev.immich, host: e.target.value }
                    }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="immich-api-key">API Key</Label>
                  <Input
                    id="immich-api-key"
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
                  id="auto-sync"
                  checked={settings.immich.autoSync}
                  onCheckedChange={(checked) => setSettings(prev => ({
                    ...prev,
                    immich: { ...prev.immich, autoSync: checked }
                  }))}
                />
                <Label htmlFor="auto-sync">Enable automatic sync</Label>
              </div>

              {settings.immich.autoSync && (
                <div className="space-y-2">
                  <Label htmlFor="sync-frequency">Sync Schedule (Cron Expression)</Label>
                  <Input
                    id="sync-frequency"
                    placeholder="0 */4 * * *"
                    value={settings.immich.syncFrequency}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      immich: { ...prev.immich, syncFrequency: e.target.value }
                    }))}
                  />
                  <div className="text-sm text-muted-foreground">
                    <p>Example: <code className="bg-muted px-1 rounded">0 */4 * * *</code> (every 4 hours) • 
                      <a 
                        href="https://crontab.guru/" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-primary hover:underline ml-1"
                      >
                        Learn syntax →
                      </a>
                    </p>
                  </div>
                </div>
              )}

              <div className="flex justify-end items-center space-x-3">
                {immichTestStatus === 'error' && (
                  <p className="text-sm text-red-600 text-left">
                    {immichTestMessage}
                  </p>
                )}
                <Button onClick={testImmichConnection} disabled={immichTestStatus === 'testing'} size="sm" variant="outline">
                  {immichTestStatus === 'success' && <CheckCircle className="mr-2 h-4 w-4 text-green-600" />}
                  {immichTestStatus === 'error' && <XCircle className="mr-2 h-4 w-4 text-red-600" />}
                  Test Connection
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Astrometry Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Key className="text-primary" />
                <span>Astrometry.net Configuration</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="astrometry-api-key">Astrometry.net API Key</Label>
                <Input
                  id="astrometry-api-key"
                  type="password"
                  placeholder="Enter your Astrometry.net API key"
                  value={settings.astrometry.apiKey}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    astrometry: { ...prev.astrometry, apiKey: e.target.value }
                  }))}
                />
                <p className="text-sm text-muted-foreground">
                  Get your API key from{' '}
                  <a href="http://nova.astrometry.net/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                    nova.astrometry.net
                  </a>
                </p>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="astrometry-enabled"
                  checked={settings.astrometry.enabled}
                  onCheckedChange={(checked) => setSettings(prev => ({
                    ...prev,
                    astrometry: { ...prev.astrometry, enabled: checked }
                  }))}
                />
                <Label htmlFor="astrometry-enabled">Enable plate solving</Label>
              </div>

              <div className="flex justify-end items-center space-x-3">
                {astrometryTestStatus === 'error' && (
                  <p className="text-sm text-red-600 text-left">
                    {astrometryTestMessage}
                  </p>
                )}
                <Button onClick={testAstrometryConnection} disabled={astrometryTestStatus === 'testing'} size="sm" variant="outline">
                  {astrometryTestStatus === 'success' && <CheckCircle className="mr-2 h-4 w-4 text-green-600" />}
                  {astrometryTestStatus === 'error' && <XCircle className="mr-2 h-4 w-4 text-red-600" />}
                  Test Connection
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* App Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="text-primary" />
                <span>Application Settings</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="debug-mode"
                  checked={settings.app.debugMode}
                  onCheckedChange={(checked) => setSettings(prev => ({
                    ...prev,
                    app: { ...prev.app, debugMode: checked }
                  }))}
                />
                <Label htmlFor="debug-mode">Enable debug mode</Label>
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button onClick={saveSettings} className="astro-button-primary">
              <Save className="mr-2 h-4 w-4" />
              Save Settings
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
} 