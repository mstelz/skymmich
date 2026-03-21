import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import {
  Loader2,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import type { AdminSettings } from '@/pages/admin';

interface AstrometrySectionProps {
  settings: AdminSettings;
  setSettings: React.Dispatch<React.SetStateAction<AdminSettings>>;
  astrometryTestStatus: 'idle' | 'testing' | 'success' | 'error';
  astrometryTestMessage: string;
  testAstrometryConnection: () => void;
}

export function AstrometrySection({
  settings,
  setSettings,
  astrometryTestStatus,
  astrometryTestMessage,
  testAstrometryConnection,
}: AstrometrySectionProps) {
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

  return (
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
        <p className="text-sm text-muted-foreground mb-4">
          This enables manual plate solving from the UI. An API key is required for any plate solving functionality.
        </p>

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

            <div className="flex items-center space-x-2 mb-4">
              <Switch
                id="astrometryAutoEnabled"
                checked={settings.astrometry.autoEnabled}
                onCheckedChange={(checked) => setSettings(prev => ({
                  ...prev,
                  astrometry: { ...prev.astrometry, autoEnabled: checked }
                }))}
                disabled={!settings.astrometry.apiKey.trim()}
              />
              <Label htmlFor="astrometryAutoEnabled">Enable automatic background plate solving</Label>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              When enabled, the background worker will automatically process plate solving jobs. Requires API key to be configured.
            </p>

            {settings.astrometry.autoEnabled && (
              <>
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
  );
}
