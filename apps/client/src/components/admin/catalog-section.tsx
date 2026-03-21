import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Loader2,
  BookOpen,
  RefreshCw,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CatalogSectionProps {
  catalogStatus: { count: number; lastUpdated: string | null; commitSha: string | null } | undefined;
  refetchCatalogStatus: () => void;
}

export function CatalogSection({ catalogStatus, refetchCatalogStatus }: CatalogSectionProps) {
  const { toast } = useToast();
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [catalogCheckLoading, setCatalogCheckLoading] = useState(false);
  const [catalogUpdateInfo, setCatalogUpdateInfo] = useState<{ hasUpdate: boolean; currentSha: string; latestSha: string } | null>(null);
  const [backfillLoading, setBackfillLoading] = useState(false);

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <BookOpen className="h-5 w-5" />
          <span>Astronomical Catalog (OpenNGC)</span>
        </CardTitle>
        <CardDescription>
          Local copy of the OpenNGC catalog for target identification and metadata enrichment
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-muted/20 rounded-lg p-3 border">
            <div className="text-sm text-muted-foreground">Objects</div>
            <div className="text-2xl font-bold">{catalogStatus?.count?.toLocaleString() || 0}</div>
          </div>
          <div className="bg-muted/20 rounded-lg p-3 border">
            <div className="text-sm text-muted-foreground">Last Updated</div>
            <div className="text-sm font-medium">
              {catalogStatus?.lastUpdated
                ? new Date(catalogStatus.lastUpdated).toLocaleDateString()
                : 'Never'}
            </div>
          </div>
          <div className="bg-muted/20 rounded-lg p-3 border">
            <div className="text-sm text-muted-foreground">Commit SHA</div>
            <div className="text-sm font-mono">
              {catalogStatus?.commitSha
                ? catalogStatus.commitSha.substring(0, 12)
                : 'N/A'}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={catalogCheckLoading}
            onClick={async () => {
              setCatalogCheckLoading(true);
              setCatalogUpdateInfo(null);
              try {
                const response = await fetch('/api/catalog/check-updates', { method: 'POST' });
                const data = await response.json();
                setCatalogUpdateInfo(data);
                toast({
                  title: data.hasUpdate ? 'Update Available' : 'Up to Date',
                  description: data.hasUpdate
                    ? 'A newer version of the catalog is available.'
                    : 'Your catalog is up to date.',
                });
              } catch {
                toast({ title: 'Error', description: 'Failed to check for updates', variant: 'destructive' });
              } finally {
                setCatalogCheckLoading(false);
              }
            }}
          >
            {catalogCheckLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
            Check for Updates
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={catalogLoading}
            onClick={async () => {
              setCatalogLoading(true);
              try {
                const response = await fetch('/api/catalog/load', { method: 'POST' });
                const data = await response.json();
                if (response.ok) {
                  toast({ title: 'Catalog Loaded', description: data.message });
                  refetchCatalogStatus();
                } else {
                  toast({ title: 'Error', description: data.message, variant: 'destructive' });
                }
              } catch {
                toast({ title: 'Error', description: 'Failed to load catalog', variant: 'destructive' });
              } finally {
                setCatalogLoading(false);
              }
            }}
          >
            {catalogLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {catalogStatus?.count ? 'Reload Catalog' : 'Load Catalog'}
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={backfillLoading || !catalogStatus?.count}
            onClick={async () => {
              setBackfillLoading(true);
              try {
                const response = await fetch('/api/catalog/backfill-targets', { method: 'POST' });
                const data = await response.json();
                if (response.ok) {
                  toast({ title: 'Backfill Complete', description: data.message });
                } else {
                  toast({ title: 'Error', description: data.message, variant: 'destructive' });
                }
              } catch {
                toast({ title: 'Error', description: 'Failed to backfill targets', variant: 'destructive' });
              } finally {
                setBackfillLoading(false);
              }
            }}
          >
            {backfillLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Backfill Targets
          </Button>
        </div>

        {catalogUpdateInfo && (
          <div className={`text-sm p-3 rounded border ${catalogUpdateInfo.hasUpdate ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-200' : 'bg-green-500/10 border-green-500/30 text-green-200'}`}>
            {catalogUpdateInfo.hasUpdate
              ? `Update available. Current: ${catalogUpdateInfo.currentSha.substring(0, 12)}, Latest: ${catalogUpdateInfo.latestSha.substring(0, 12)}`
              : 'Catalog is up to date.'}
          </div>
        )}

        <p className="text-sm text-muted-foreground">
          The catalog auto-loads on first startup. Use "Backfill Targets" to re-match existing plate-solved images against the catalog.
        </p>
      </CardContent>
    </Card>
  );
}
