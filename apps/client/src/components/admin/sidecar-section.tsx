import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { FileText } from 'lucide-react';
import type { AdminSettings } from '@/pages/admin';

interface SidecarSectionProps {
  settings: AdminSettings;
  setSettings: React.Dispatch<React.SetStateAction<AdminSettings>>;
}

export function SidecarSection({ settings, setSettings }: SidecarSectionProps) {
  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <FileText className="h-5 w-5" />
          <span>XMP Sidecar Settings</span>
        </CardTitle>
        <CardDescription>
          Configure XMP sidecar file generation after plate solving
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center space-x-2">
          <Switch
            id="sidecarEnabled"
            checked={settings.sidecar.enabled}
            onCheckedChange={(checked) => setSettings(prev => ({
              ...prev,
              sidecar: { ...prev.sidecar, enabled: checked }
            }))}
          />
          <Label htmlFor="sidecarEnabled">Enable XMP sidecar generation</Label>
        </div>
        <p className="text-sm text-muted-foreground">
          When enabled, an XMP sidecar file is generated alongside each plate-solved image containing astronomical metadata, annotations, and equipment info.
        </p>

        {settings.sidecar.enabled && (
          <>
            <Separator />

            <div>
              <Label htmlFor="sidecarOutputPath">Output Path</Label>
              <Input
                id="sidecarOutputPath"
                placeholder="/app/sidecars"
                value={settings.sidecar.outputPath}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  sidecar: { ...prev.sidecar, outputPath: e.target.value }
                }))}
              />
              <p className="text-sm text-muted-foreground mt-1">
                Directory where XMP sidecar files are written. In Docker, this path must be a mounted volume.
                The <code className="text-xs bg-muted px-1 rounded">XMP_SIDECAR_PATH</code> environment variable overrides this setting.
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="sidecarOrganizeByDate"
                checked={settings.sidecar.organizeByDate}
                onCheckedChange={(checked) => setSettings(prev => ({
                  ...prev,
                  sidecar: { ...prev.sidecar, organizeByDate: checked }
                }))}
              />
              <Label htmlFor="sidecarOrganizeByDate">Organize by capture date</Label>
            </div>
            <p className="text-sm text-muted-foreground">
              When enabled, sidecar files are organized into subdirectories by capture date (e.g., <code className="text-xs bg-muted px-1 rounded">2025-01/image.xmp</code>).
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}
