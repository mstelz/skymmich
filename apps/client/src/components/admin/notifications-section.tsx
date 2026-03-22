import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Bell,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Info,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { queryClient } from '@/lib/queryClient';

interface Notification {
  id: number;
  type: 'error' | 'warning' | 'info' | 'success';
  title: string;
  message: string;
  details?: any;
  timestamp: string;
  acknowledged: boolean;
}

interface NotificationsSectionProps {
  notifications: Notification[];
  showAllNotifications: boolean;
  setShowAllNotifications: (value: boolean) => void;
}

export function NotificationsSection({
  notifications,
  showAllNotifications,
  setShowAllNotifications,
}: NotificationsSectionProps) {
  const { toast } = useToast();

  const acknowledgeAllNotifications = async () => {
    try {
      const response = await fetch('/api/notifications/acknowledge-all', {
        method: 'POST',
      });
      if (response.ok) {
        queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
        setShowAllNotifications(false);
        toast({
          title: "Success",
          description: "All notifications acknowledged",
        });
      }
    } catch (error) {
      console.error('Failed to acknowledge all notifications:', error);
      toast({
        title: "Error",
        description: "Failed to acknowledge all notifications",
        variant: "destructive",
      });
    }
  };

  const acknowledgeNotification = async (id: number) => {
    try {
      const response = await fetch(`/api/notifications/${id}/acknowledge`, {
        method: 'POST',
      });
      if (response.ok) {
        queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
        toast({
          title: "Success",
          description: "Notification acknowledged",
        });
      }
    } catch (error) {
      console.error('Failed to acknowledge notification:', error);
      toast({
        title: "Error",
        description: "Failed to acknowledge notification",
        variant: "destructive",
      });
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      default:
        return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  if (notifications.length === 0) {
    return null;
  }

  return (
    <Card className="mb-6 border-orange-200 bg-orange-50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2 text-orange-800">
            <Bell className="h-5 w-5" />
            <span>System Notifications ({notifications.length})</span>
          </CardTitle>
          {notifications.length >= 2 && (
            <Button
              onClick={acknowledgeAllNotifications}
              size="sm"
              variant="outline"
              className="text-orange-800 border-orange-300 hover:bg-orange-100"
            >
              Acknowledge All
            </Button>
          )}
        </div>
        <CardDescription className="text-orange-700">
          Please review and acknowledge these notifications
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {(showAllNotifications ? notifications : notifications.slice(0, 5)).map((notification) => (
          <div key={notification.id} className="flex items-start space-x-3 p-3 bg-white rounded-lg border">
            {getNotificationIcon(notification.type)}
            <div className="flex-1">
              <h4 className="font-medium text-gray-900">{notification.title}</h4>
              <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
              <p className="text-xs text-gray-500 mt-2">
                {formatTimestamp(notification.timestamp)}
              </p>
            </div>
            <Button
              onClick={() => acknowledgeNotification(notification.id)}
              size="sm"
              variant="outline"
            >
              Acknowledge
            </Button>
          </div>
        ))}
        {notifications.length > 5 && (
          <Button
            onClick={() => setShowAllNotifications(!showAllNotifications)}
            variant="ghost"
            size="sm"
            className="w-full text-orange-700 hover:text-orange-900"
          >
            {showAllNotifications ? 'Show less' : `Show all (${notifications.length})`}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
