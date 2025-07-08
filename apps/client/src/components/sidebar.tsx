import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { 
  Crosshair, 
  History, 
  BarChart3, 
  Tags, 
  CloudUpload,
  Activity
} from "lucide-react";
import type { PlateSolvingJob } from "@shared/schema";

interface SidebarProps {
  stats?: {
    totalImages: number;
    plateSolved: number;
    totalHours: number;
    uniqueTargets: number;
  };
  tags: Array<{ tag: string; count: number }>;
  onTagClick: (tag: string) => void;
}

export function Sidebar({ stats, tags, onTagClick }: SidebarProps) {
  const { data: plateSolvingJobs = [] } = useQuery<PlateSolvingJob[]>({
    queryKey: ["/api/plate-solving/jobs"],
    refetchInterval: 5000, // Poll every 5 seconds
  });

  const recentJobs = (plateSolvingJobs as PlateSolvingJob[]).slice(0, 4);
  const processingJobs = (plateSolvingJobs as PlateSolvingJob[]).filter((job: PlateSolvingJob) => job.status === "processing");

  return (
    <aside className="lg:w-80 space-y-6 overflow-hidden overflow-y-hidden">
      
      {/* Plate Solving Status */}
      <Card className="bg-card">
        <CardHeader>
          <CardTitle className="flex items-center text-foreground">
            <Crosshair className="mr-2 text-primary" />
            Astrometry.net Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Processing Jobs</span>
            <span className="text-green-400">{processingJobs.length}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Avg Processing Time</span>
            <span className="text-foreground">~3 min</span>
          </div>
          {processingJobs.length > 0 && (
            <>
              <Progress value={75} className="h-2" />
              <p className="text-xs text-muted-foreground">
                {processingJobs.length} job(s) in progress
              </p>
            </>
          )}
          <div>
            <Link href="/plate-solving">
              <Button className="w-full astro-button-secondary">
                <CloudUpload className="mr-2 h-4 w-4" />
                Submit New Image
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card className="bg-card">
        <CardHeader>
          <CardTitle className="flex items-center text-foreground">
            <History className="mr-2 text-primary" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {recentJobs.length > 0 ? (
            recentJobs.map((job: PlateSolvingJob) => (
              <div key={job.id} className="flex items-center space-x-3 text-sm">
                <div className={`w-2 h-2 rounded-full ${
                  job.status === "success" ? "bg-green-400" :
                  job.status === "processing" ? "bg-yellow-400" :
                  job.status === "failed" ? "bg-red-400" :
                  "bg-gray-400"
                }`} />
                <div className="flex-1">
                  <p className="text-foreground">
                    {job.status === "success" ? "Plate solved successfully" :
                     job.status === "processing" ? "Processing..." :
                     job.status === "failed" ? "Plate solving failed" :
                     "Submitted for solving"}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    {job.submittedAt 
                      ? new Date(job.submittedAt).toLocaleString()
                      : "Unknown time"
                    }
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="text-sm text-muted-foreground">
              <div className="flex items-center space-x-3">
                <Activity className="w-4 h-4" />
                <p>No recent activity</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Stats */}
      {stats && (
        <Card className="bg-card">
          <CardHeader>
            <CardTitle className="flex items-center text-foreground">
              <BarChart3 className="mr-2 text-primary" />
              Quick Stats
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="text-center">
                <div className="text-2xl font-bold text-foreground">{stats.totalImages}</div>
                <div className="text-muted-foreground">Total Images</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-400">{stats.plateSolved}</div>
                <div className="text-muted-foreground">Plate Solved</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{(stats.totalHours || 0).toFixed(2)}</div>
                <div className="text-muted-foreground">Total Hours</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-destructive">{stats.uniqueTargets}</div>
                <div className="text-muted-foreground">Unique Targets</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Popular Tags */}
      <Card className="bg-card">
        <CardHeader>
          <CardTitle className="flex items-center text-foreground">
            <Tags className="mr-2 text-primary" />
            Popular Tags
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2 text-xs">
            {tags.length > 0 ? (
              tags.slice(0, 12).map(({ tag, count }) => (
                <Badge
                  key={tag}
                  className="astro-tag cursor-pointer"
                  onClick={() => onTagClick(tag)}
                >
                  {tag} ({count})
                </Badge>
              ))
            ) : (
              <p className="text-muted-foreground text-sm">No tags available</p>
            )}
          </div>
        </CardContent>
      </Card>

    </aside>
  );
}
