import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, Images, Tags, Clock, CheckCircle } from "lucide-react";

interface SearchFiltersProps {
  filters: {
    objectType: string;
    tags: string[];
    plateSolved: boolean | undefined;
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
              className="pl-10 astro-input"
            />
          </div>
          
          <div className="flex flex-wrap gap-2">
            <Select
              value={filters.objectType || "all"}
              onValueChange={(value) => onFiltersChange({ ...filters, objectType: value === "all" ? "" : value })}
            >
              <SelectTrigger className="w-[140px] astro-input">
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
              value={filters.plateSolved?.toString() || "all"}
              onValueChange={(value) => 
                onFiltersChange({ 
                  ...filters, 
                  plateSolved: value === "all" ? undefined : value === "true" 
                })
              }
            >
              <SelectTrigger className="w-[140px] astro-input">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="true">Plate Solved</SelectItem>
                <SelectItem value="false">Not Solved</SelectItem>
              </SelectContent>
            </Select>
            
            <Button variant="secondary" className="astro-button-secondary">
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
              <Tags className="h-4 w-4" />
              Active Tags
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              Last sync: 2 min ago
            </div>
            <div className="flex items-center gap-1 text-green-400">
              <CheckCircle className="h-4 w-4" />
              Astrometry Online
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
