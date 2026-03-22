import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import type { AdminSettings } from '@/pages/admin';

interface AppSettingsSectionProps {
  settings: AdminSettings;
  setSettings: React.Dispatch<React.SetStateAction<AdminSettings>>;
}

export function AppSettingsSection({ settings, setSettings }: AppSettingsSectionProps) {
  return (
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
  );
}
