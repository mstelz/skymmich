import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Telescope, Upload, Settings, Github, Loader2 } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useState, useEffect } from "react";
import { useSocket } from "@/hooks/use-socket";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";

interface Notification {
  id: number;
  type: 'error' | 'warning' | 'info' | 'success';
  title: string;
  message: string;
  details?: any;
  timestamp: string;
  acknowledged: boolean;
}

export function Header() {
  const [location] = useLocation();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [syncing, setSyncing] = useState(false);
  const socket = useSocket();
  const { toast } = useToast();

  const isActive = (path: string) => location === path;

  // Load notifications on component mount
  useEffect(() => {
    const loadNotifications = async () => {
      try {
        const response = await fetch('/api/notifications');
        if (response.ok) {
          const data = await response.json();
          setNotifications(data);
        }
      } catch (error) {
        console.error('Failed to load notifications:', error);
      }
    };

    loadNotifications();
  }, []);

  const refreshNotifications = () => {
    fetch('/api/notifications')
      .then(response => response.json())
      .then(data => setNotifications(data))
      .catch(error => console.error('Failed to refresh notifications:', error));
  };

  // Listen for real-time notification updates via Socket.io
  useEffect(() => {
    if (!socket) return;

    socket.on('plate-solving-update', refreshNotifications);
    socket.on('immich-sync-complete', refreshNotifications);

    return () => {
      socket.off('plate-solving-update', refreshNotifications);
      socket.off('immich-sync-complete', refreshNotifications);
    };
  }, [socket]);

  // Listen for notification changes from other components (e.g. admin page)
  useEffect(() => {
    window.addEventListener('notifications-updated', refreshNotifications);
    return () => window.removeEventListener('notifications-updated', refreshNotifications);
  }, []);

  const handleSync = async () => {
    setSyncing(true);
    try {
      const response = await fetch('/api/immich/sync-immich', {
        method: 'POST',
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json().catch(() => ({}));
        toast({ title: 'Sync completed', description: data.message || 'Successfully synced images from Immich' });
        // Refresh gallery and stats so new images appear without a page reload
        queryClient.invalidateQueries({ queryKey: ["/api/images"] });
        queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      } else {
        const errorData = await response.json().catch(() => ({}));
        toast({
          title: 'Sync failed',
          description: errorData.message || `Server returned ${response.status}`,
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Sync failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setSyncing(false);
    }
  };

  const unacknowledgedCount = notifications.length;

  return (
    <header className="bg-card border-b border-border sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4">
            <Link href="/" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
              <img src="/logo.png" alt="Skymmich Logo" className="h-8 w-8" />
              <h1 className="text-xl font-bold text-foreground">Skymmich</h1>
            </Link>
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
            <Link
              href="/plate-solving"
              className={`transition-colors ${isActive('/plate-solving') ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            >
              Plate Solving
            </Link>
            <Link
              href="/sky-map"
              className={`transition-colors ${isActive('/sky-map') ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            >
              Sky Map
            </Link>
            <Link
              href="/locations"
              className={`transition-colors ${isActive('/locations') ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            >
              Locations
            </Link>
          </nav>
          
          <div className="flex items-center space-x-3">
            <Button onClick={handleSync} disabled={syncing} className="sky-button-primary">
              {syncing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
              {syncing ? 'Syncing...' : 'Sync Immich'}
            </Button>
            <a 
              href="https://github.com/mstelz/skymmich" 
              target="_blank" 
              rel="noopener noreferrer"
              title="View on GitHub"
            >
              <Button variant="ghost" size="icon">
                <Github className="h-5 w-5" />
              </Button>
            </a>
            <Link href="/admin">
              <Button 
                variant="ghost" 
                size="icon" 
                className="relative"
                title={unacknowledgedCount > 0 ? `${unacknowledgedCount} unacknowledged notification${unacknowledgedCount > 1 ? 's' : ''}` : 'Admin Settings'}
              >
                <span className="relative inline-block">
                  <Settings className="h-7 w-7" />
                  {unacknowledgedCount > 0 && (
                    <span 
                      className="absolute -top-1.5 -right-1.5 bg-red-600 text-white h-4 w-4 rounded-full flex items-center justify-center text-xs font-bold border-2 border-white"
                      style={{ minWidth: '1rem', minHeight: '1rem' }}
                    >
                      {unacknowledgedCount > 9 ? '9+' : unacknowledgedCount}
                    </span>
                  )}
                </span>
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
