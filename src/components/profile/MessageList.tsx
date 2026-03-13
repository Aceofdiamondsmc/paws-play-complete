import React, { useState } from 'react';
import { MessageCircle, ChevronRight } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useMessages } from '@/hooks/useMessages';
import { formatDistanceToNow } from 'date-fns';

interface MessageListProps {
  onSelectConversation: (conversationId: string) => void;
}

export function MessageList({ onSelectConversation }: MessageListProps) {
  const { conversations, loading, totalUnread } = useMessages();
  const [showAll, setShowAll] = useState(false);

  if (loading) {
    return (
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <MessageCircle className="w-5 h-5 text-primary" />
          <h3 className="font-bold">Messages</h3>
        </div>
        <div className="flex justify-center py-4">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-primary" />
          <h3 className="font-bold">Messages</h3>
        </div>
        {totalUnread > 0 && (
          <Badge variant="destructive" className="rounded-full">
            {totalUnread}
          </Badge>
        )}
      </div>

      {conversations.length === 0 ? (
        <div className="text-center py-6 text-muted-foreground">
          <MessageCircle className="w-10 h-10 mx-auto mb-2 opacity-30" />
          <p className="text-sm">No conversations yet</p>
          <p className="text-xs mt-1">Start chatting from the Social or Pack tabs</p>
        </div>
      ) : (
        <div className="space-y-2">
          {(showAll ? conversations : conversations.slice(0, 5)).map(convo => (
            <button
              key={convo.id}
              onClick={() => onSelectConversation(convo.id)}
              className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-muted transition-colors text-left"
            >
              <div className="relative">
                <Avatar className="w-12 h-12">
                  <AvatarImage src={convo.otherUser?.avatar_url || undefined} />
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {convo.otherUser?.display_name?.[0] || '?'}
                  </AvatarFallback>
                </Avatar>
                {convo.unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground text-xs rounded-full flex items-center justify-center">
                    {convo.unreadCount}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold truncate">
                    {convo.otherUser?.display_name || 'Unknown User'}
                  </h4>
                  {convo.lastMessage && (
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(convo.lastMessage.created_at || ''), { addSuffix: false })}
                    </span>
                  )}
                </div>
                <p className={`text-sm truncate ${convo.unreadCount > 0 ? 'font-medium text-foreground' : 'text-muted-foreground'}`}>
                  {convo.lastMessage?.content || 'No messages yet'}
                </p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            </button>
          ))}
          
          {conversations.length > 5 && (
            <button
              onClick={() => setShowAll(!showAll)}
              className="w-full text-center text-sm text-primary font-medium py-2 hover:underline"
            >
              {showAll ? 'Show less' : `View all ${conversations.length} conversations`}
            </button>
          )}
        </div>
      )}
    </Card>
  );
}
