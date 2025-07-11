import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, Images, Tags, Clock, CheckCircle, Star } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface SearchFiltersProps {
  filters: {
    objectType: string;
    tags: string[];
    plateSolved: boolean | undefined;
    constellation: string;
    search: string;
  };
  onFiltersChange: (filters: any) => void;
  stats?: {
    totalImages: number;
    plateSolved: number;
    totalHours: number;
    uniqueTargets: number;
  };
}

export function SearchFilters({ filters, onFiltersChange, stats }: SearchFiltersProps) {
  // Fetch available constellations
  const { data: constellations = [] } = useQuery({
    queryKey: ["/api/constellations"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/constellations");
      return response.json();
    },
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
              <SelectContent>
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
              <SelectContent>
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
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="true">Plate Solved</SelectItem>
                <SelectItem value="false">Not Solved</SelectItem>
              </SelectContent>
            </Select>
            
            <Button variant="secondary" className="sky-button-secondary">
              <Filter className="mr-2 h-4 w-4" />
              Advanced
            </Button>
          </div>
        </div>
        
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
      </div>
    </div>
  );
}
