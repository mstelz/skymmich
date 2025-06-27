import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Telescope, Upload, Settings } from "lucide-react";
import { Link, useLocation } from "wouter";

interface HeaderProps {
  onSync: () => void;
}

export function Header({ onSync }: HeaderProps) {
  const [location] = useLocation();

  const isActive = (path: string) => location === path;

  return (
    <header className="bg-card border-b border-border sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4">
            <Link href="/" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
              <Telescope className="text-primary text-2xl" />
              <h1 className="text-xl font-bold text-foreground">AstroViewer</h1>
            </Link>
            <Badge variant="secondary" className="bg-muted text-muted-foreground">
              Connected to Immich
            </Badge>
          </div>
          
          <nav className="hidden md:flex items-center space-x-6">
            <Link 
              href="/" 
              className={`transition-colors ${isActive('/') ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            >
              Gallery
            </Link>
            <Link 
              href="/equipment" 
              className={`transition-colors ${isActive('/equipment') ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            >
              Equipment
            </Link>
            <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
              Collections
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
            <Link href="/admin">
              <Button variant="ghost" size="icon">
                <Settings className="h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
