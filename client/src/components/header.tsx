import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Telescope, Upload, UserCircle } from "lucide-react";

interface HeaderProps {
  onSync: () => void;
}

export function Header({ onSync }: HeaderProps) {
  return (
    <header className="bg-card border-b border-border sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4">
            <Telescope className="text-primary text-2xl" />
            <h1 className="text-xl font-bold text-foreground">AstroViewer</h1>
            <Badge variant="secondary" className="bg-muted text-muted-foreground">
              Connected to Immich
            </Badge>
          </div>
          
          <nav className="hidden md:flex items-center space-x-6">
            <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
              Gallery
            </a>
            <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
              Collections
            </a>
            <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
              Equipment
            </a>
            <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
              Plate Solving
            </a>
          </nav>
          
          <div className="flex items-center space-x-3">
            <Button onClick={onSync} className="astro-button-primary">
              <Upload className="mr-2 h-4 w-4" />
              Sync Immich
            </Button>
            <Button variant="ghost" size="icon">
              <UserCircle className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
