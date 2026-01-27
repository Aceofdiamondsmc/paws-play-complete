import React from 'react';
import { Bell, Heart, MessageCircle, Users, Check } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNotifications, Notification } from '@/hooks/useNotifications';
import { formatDistanceToNow } from 'date-fns';

const getNotificationIcon = (type: string) => {
  switch (type.toLowerCase()) {
    case 'like':
      return <Heart className="w-4 h-4 text-destructive" />;
    case 'comment':
      return <MessageCircle className="w-4 h-4 text-primary" />;
    case 'friend':
    case 'follow':
      return <Users className="w-4 h-4 text-secondary-foreground" />;
    default:
      return <Bell className="w-4 h-4 text-primary" />;
  }
};

const getNotificationBgColor = (type: string) => {
  switch (type.toLowerCase()) {
    case 'like':
      return 'bg-destructive/10';
    case 'comment':
      return 'bg-primary/10';
    case 'friend':
    case 'follow':
      return 'bg-secondary';
    default:
      return 'bg-primary/10';
  }
};

function NotificationItem({ 
  notification, 
  onMarkAsRead 
}: { 
  notification: Notification; 
  onMarkAsRead: (id: string) => void;
}) {
  const timeAgo = notification.created_at
    ? formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })
    : '';

  return (
    <div
      className={`flex items-start gap-3 p-3 rounded-xl transition-colors ${
        notification.read ? 'bg-muted/50' : 'bg-primary/5 border border-primary/10'
      }`}
      onClick={() => !notification.read && onMarkAsRead(notification.id)}
    >
      <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${getNotificationBgColor(notification.type)}`}>
        {getNotificationIcon(notification.type)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            {notification.type}
          </span>
          {!notification.read && (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 bg-primary/20 text-primary">
              New
            </Badge>
          )}
        </div>
        <p className="text-sm font-medium mt-0.5 line-clamp-2">
          {notification.body}
        </p>
        <p className="text-xs text-muted-foreground mt-1">{timeAgo}</p>
      </div>
    </div>
  );
}

export function NotificationsList() {
  const { notifications, loading, unreadCount, markAsRead, markAllAsRead } = useNotifications();

  if (loading) {
    return (
      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold flex items-center gap-2">
            <Bell className="w-5 h-5 text-primary" />
            Notifications
          </h3>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-muted animate-pulse">
              <div className="w-9 h-9 rounded-full bg-muted-foreground/20" />
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-muted-foreground/20 rounded w-16" />
                <div className="h-4 bg-muted-foreground/20 rounded w-full" />
                <div className="h-3 bg-muted-foreground/20 rounded w-20" />
              </div>
            </div>
          ))}
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold flex items-center gap-2">
          <Bell className="w-5 h-5 text-primary" />
          Notifications
          {unreadCount > 0 && (
            <Badge variant="destructive" className="text-xs px-1.5 py-0 h-5">
              {unreadCount}
            </Badge>
          )}
        </h3>
        {unreadCount > 0 && (
          <Button 
            size="sm" 
            variant="ghost" 
            className="text-xs h-7 gap-1"
            onClick={markAllAsRead}
          >
            <Check className="w-3 h-3" />
            Clear All
          </Button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <Bell className="w-10 h-10 mx-auto mb-2 opacity-30" />
          <p className="text-sm">No notifications yet</p>
          <p className="text-xs mt-1">When someone likes or comments on your posts, you'll see it here!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((notification) => (
            <NotificationItem
              key={notification.id}
              notification={notification}
              onMarkAsRead={markAsRead}
            />
          ))}
        </div>
      )}
    </Card>
  );
}
