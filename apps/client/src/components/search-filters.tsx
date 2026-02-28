import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, Images, Tags, Clock, CheckCircle, X, ChevronDown, ChevronUp } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { Equipment } from "@shared/schema";

interface SearchFiltersProps {
  filters: {
    objectType: string;
    tags: string[];
    plateSolved: boolean | undefined;
    constellation: string;
    search: string;
    equipmentId?: number;
    equipmentName?: string;
  };
  onFiltersChange: (filters: any) => void;
  stats?: {
    totalImages: number;
    plateSolved: number;
    totalHours: number;
    uniqueTargets: number;
  };
  totalCount?: number;
  filteredCount?: number;
}

export function SearchFilters({ filters, onFiltersChange, stats, totalCount, filteredCount }: SearchFiltersProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Fetch available constellations
  const { data: constellations = [] } = useQuery({
    queryKey: ["/api/constellations"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/constellations");
      return response.json();
    },
  });

  // Fetch equipment for advanced filter
  const { data: equipment = [] } = useQuery<Equipment[]>({
    queryKey: ["/api/equipment"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/equipment");
      return response.json();
    },
    enabled: showAdvanced,
  });

  return (
    <div className="bg-card border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              type="text"
              placeholder="Search astrophotography images..."
              value={filters.search}
              onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
              className="pl-10 sky-input"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <Select
              value={filters.objectType || "all"}
              onValueChange={(value) => onFiltersChange({ ...filters, objectType: value === "all" ? "" : value })}
            >
              <SelectTrigger className="w-[140px] sky-input">
                <SelectValue placeholder="All Objects" />
              </SelectTrigger>
              <SelectContent className="bg-gray-900 border-gray-700 text-white">
                <SelectItem value="all">All Objects</SelectItem>
                <SelectItem value="Deep Sky">Deep Sky</SelectItem>
                <SelectItem value="Planetary">Planetary</SelectItem>
                <SelectItem value="Solar">Solar</SelectItem>
                <SelectItem value="Lunar">Lunar</SelectItem>
                <SelectItem value="Galaxy">Galaxy</SelectItem>
                <SelectItem value="Nebula">Nebula</SelectItem>
                <SelectItem value="Milky Way">Milky Way</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.constellation || "all"}
              onValueChange={(value) => onFiltersChange({ ...filters, constellation: value === "all" ? "" : value })}
            >
              <SelectTrigger className="w-[140px] sky-input">
                <SelectValue placeholder="All Constellations" />
              </SelectTrigger>
              <SelectContent className="bg-gray-900 border-gray-700 text-white">
                <SelectItem value="all">All Constellations</SelectItem>
                {constellations.map((constellation: string) => (
                  <SelectItem key={constellation} value={constellation}>
                    {constellation}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filters.plateSolved?.toString() || "all"}
              onValueChange={(value) =>
                onFiltersChange({
                  ...filters,
                  plateSolved: value === "all" ? undefined : value === "true"
                })
              }
            >
              <SelectTrigger className="w-[140px] sky-input">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent className="bg-gray-900 border-gray-700 text-white">
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="true">Plate Solved</SelectItem>
                <SelectItem value="false">Not Solved</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="secondary"
              className="sky-button-secondary"
              onClick={() => setShowAdvanced(!showAdvanced)}
            >
              <Filter className="mr-2 h-4 w-4" />
              Advanced
              {showAdvanced ? <ChevronUp className="ml-1 h-3 w-3" /> : <ChevronDown className="ml-1 h-3 w-3" />}
            </Button>
          </div>
        </div>

        {/* Advanced Search Panel */}
        {showAdvanced && (
          <div className="mt-4 p-4 bg-muted/30 rounded-lg border border-border">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Equipment</Label>
                <Select
                  value={filters.equipmentId?.toString() || "all"}
                  onValueChange={(value) => {
                    if (value === "all") {
                      onFiltersChange({ ...filters, equipmentId: undefined, equipmentName: undefined });
                    } else {
                      const eq = equipment.find(e => e.id === parseInt(value));
                      onFiltersChange({ ...filters, equipmentId: parseInt(value), equipmentName: eq?.name || "" });
                    }
                  }}
                >
                  <SelectTrigger className="sky-input h-9 text-sm">
                    <SelectValue placeholder="All Equipment" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-900 border-gray-700 text-white max-h-[300px]">
                    <SelectItem value="all">All Equipment</SelectItem>
                    {equipment.map(eq => (
                      <SelectItem key={eq.id} value={eq.id.toString()}>
                        {eq.name} ({eq.type})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Date From</Label>
                <Input
                  type="date"
                  className="sky-input h-9 text-sm"
                  onChange={(e) => onFiltersChange({ ...filters, dateFrom: e.target.value || undefined })}
                  value={(filters as any).dateFrom || ""}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Date To</Label>
                <Input
                  type="date"
                  className="sky-input h-9 text-sm"
                  onChange={(e) => onFiltersChange({ ...filters, dateTo: e.target.value || undefined })}
                  value={(filters as any).dateTo || ""}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Min Integration (hours)</Label>
                <Input
                  type="number"
                  step="0.1"
                  min="0"
                  placeholder="0"
                  className="sky-input h-9 text-sm"
                  onChange={(e) => onFiltersChange({ ...filters, minIntegration: e.target.value ? parseFloat(e.target.value) : undefined })}
                  value={(filters as any).minIntegration ?? ""}
                />
              </div>
            </div>
          </div>
        )}

        {/* Stats Bar */}
        {stats && (
          <div className="mt-4 flex flex-wrap gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Images className="h-4 w-4" />
              {stats.totalImages} Images
            </div>
            <div className="flex items-center gap-1">
              <CheckCircle className="h-4 w-4" />
              {stats.plateSolved} Plate Solved
            </div>
            <div className="flex items-center gap-1">
              <Tags className="h-4 w-4" />
              {stats.uniqueTargets} Unique Targets
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {(stats.totalHours || 0).toFixed(2)}h Total Integration
            </div>
          </div>
        )}

        {/* Active Filters Bar */}
        {(() => {
          const activeFilters: { label: string; onRemove: () => void }[] = [];
          if (filters.search) {
            activeFilters.push({
              label: `Search: "${filters.search}"`,
              onRemove: () => onFiltersChange({ ...filters, search: "" }),
            });
          }
          if (filters.objectType) {
            activeFilters.push({
              label: `Type: ${filters.objectType}`,
              onRemove: () => onFiltersChange({ ...filters, objectType: "" }),
            });
          }
          if (filters.constellation) {
            activeFilters.push({
              label: `Constellation: ${filters.constellation}`,
              onRemove: () => onFiltersChange({ ...filters, constellation: "" }),
            });
          }
          if (filters.plateSolved !== undefined) {
            activeFilters.push({
              label: `Plate Solved: ${filters.plateSolved ? "Yes" : "No"}`,
              onRemove: () => onFiltersChange({ ...filters, plateSolved: undefined }),
            });
          }
          for (const tag of filters.tags) {
            activeFilters.push({
              label: `Tag: ${tag}`,
              onRemove: () => onFiltersChange({ ...filters, tags: filters.tags.filter(t => t !== tag) }),
            });
          }
          if (filters.equipmentId && filters.equipmentName) {
            activeFilters.push({
              label: `Equipment: ${filters.equipmentName}`,
              onRemove: () => onFiltersChange({ ...filters, equipmentId: undefined, equipmentName: undefined }),
            });
          }
          if ((filters as any).dateFrom) {
            activeFilters.push({
              label: `From: ${(filters as any).dateFrom}`,
              onRemove: () => onFiltersChange({ ...filters, dateFrom: undefined }),
            });
          }
          if ((filters as any).dateTo) {
            activeFilters.push({
              label: `To: ${(filters as any).dateTo}`,
              onRemove: () => onFiltersChange({ ...filters, dateTo: undefined }),
            });
          }
          if ((filters as any).minIntegration !== undefined) {
            activeFilters.push({
              label: `Min Integration: ${(filters as any).minIntegration}h`,
              onRemove: () => onFiltersChange({ ...filters, minIntegration: undefined }),
            });
          }

          if (activeFilters.length === 0) return null;

          return (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {filteredCount !== undefined && totalCount !== undefined && filteredCount !== totalCount && (
                <span className="text-xs text-muted-foreground mr-1">
                  Showing {filteredCount} of {totalCount}
                </span>
              )}
              {activeFilters.map((f, i) => (
                <Badge
                  key={i}
                  variant="secondary"
                  className="text-xs flex items-center gap-1 cursor-pointer hover:bg-destructive/20"
                  onClick={f.onRemove}
                >
                  {f.label}
                  <X className="h-3 w-3" />
                </Badge>
              ))}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onFiltersChange({
                  objectType: "",
                  tags: [],
                  plateSolved: undefined,
                  constellation: "",
                  search: "",
                  equipmentId: undefined,
                  equipmentName: undefined,
                  dateFrom: undefined,
                  dateTo: undefined,
                  minIntegration: undefined,
                })}
                className="text-xs text-muted-foreground hover:text-foreground h-6 px-2"
              >
                Clear All
              </Button>
            </div>
          );
        })()}
      </div>
    </div>
  );
}
