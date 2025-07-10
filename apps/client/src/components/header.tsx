import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Telescope, Upload, Settings } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useState, useEffect } from "react";
import { useSocket } from "@/hooks/use-socket";

interface HeaderProps {
  onSync: () => void;
}

interface Notification {
  id: number;
  type: 'error' | 'warning' | 'info' | 'success';
  title: string;
  message: string;
  details?: any;
  timestamp: string;
  acknowledged: boolean;
}

export function Header({ onSync }: HeaderProps) {
  const [location] = useLocation();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const socket = useSocket();

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

  // Listen for real-time notification updates via Socket.io
  useEffect(() => {
    if (!socket) return;

    const handleNotificationUpdate = () => {
      // Refresh notifications when we receive an update
      fetch('/api/notifications')
        .then(response => response.json())
        .then(data => setNotifications(data))
        .catch(error => console.error('Failed to refresh notifications:', error));
    };

    // Listen for various events that might affect notifications
    socket.on('plate-solving-update', handleNotificationUpdate);
    socket.on('immich-sync-complete', handleNotificationUpdate);

    return () => {
      socket.off('plate-solving-update', handleNotificationUpdate);
      socket.off('immich-sync-complete', handleNotificationUpdate);
    };
  }, [socket]);

  const unacknowledgedCount = notifications.length;

  return (
    <header className="bg-card border-b border-border sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4">
            <Link href="/" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
              <img src="/logo.png" alt="Astromich Logo" className="h-8 w-8" />
              <h1 className="text-xl font-bold text-foreground">Astromich</h1>
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
            <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
              Collections
            </a>
            <Link 
              href="/plate-solving" 
              className={`transition-colors ${isActive('/plate-solving') ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            >
              Plate Solving
            </Link>
          </nav>
          
          <div className="flex items-center space-x-3">
            <Button onClick={onSync} className="astro-button-primary">
              <Upload className="mr-2 h-4 w-4" />
              Sync Immich
            </Button>
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
