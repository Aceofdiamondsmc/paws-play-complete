import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Send, MoreVertical, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useConversationMessages } from '@/hooks/useMessages';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface ChatViewProps {
  conversationId: string;
  otherUser?: {
    display_name?: string | null;
    avatar_url?: string | null;
  };
  onBack: () => void;
}

export function ChatView({ conversationId, otherUser, onBack }: ChatViewProps) {
  const { user } = useAuth();
  const { messages, loading, sendMessage, deleteConversation } = useConversationMessages(conversationId);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || isSending) return;

    setIsSending(true);
    try {
      const { error } = await sendMessage(newMessage.trim());
      if (error) {
        console.error('Failed to send message:', error);
        toast.error(`Message failed: ${error.message}`);
        return;
      }
      setNewMessage('');
    } catch (err: any) {
      console.error('Send exception:', err);
      toast.error(`Send error: ${err?.message || 'Unknown error'}`);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-x-0 top-0 z-[60] bg-background flex flex-col safe-top" style={{ height: '100dvh' }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pb-4 pt-[60px] border-b bg-background/95 backdrop-blur-sm">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <Avatar className="w-10 h-10">
          <AvatarImage src={otherUser?.avatar_url || undefined} />
          <AvatarFallback className="bg-primary/10 text-primary">
            {otherUser?.display_name?.[0] || '?'}
          </AvatarFallback>
        </Avatar>
        <h2 className="font-semibold flex-1">{otherUser?.display_name || 'Unknown User'}</h2>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreVertical className="w-5 h-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="z-[70]" sideOffset={5}>
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onSelect={async (e) => {
                e.preventDefault();
                try {
                  const { error } = await deleteConversation();
                  if (error) {
                    console.error('Failed to delete conversation:', error);
                    toast.error(`Delete failed: ${error.message}`);
                    return;
                  }
                  onBack();
                } catch (err: any) {
                  console.error('Delete exception:', err);
                  toast.error(`Delete error: ${err?.message || 'Unknown error'}`);
                }
              }}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Conversation
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading ? (
          <div className="flex justify-center py-10">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center text-muted-foreground py-10">
            <p>No messages yet</p>
            <p className="text-sm mt-1">Say hello! 👋</p>
          </div>
        ) : (
          messages.map(message => {
            const isOwn = message.sender_id === user?.id;
            return (
              <div
                key={message.id}
                className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                    isOwn
                      ? 'bg-primary text-primary-foreground rounded-br-sm'
                      : 'bg-muted rounded-bl-sm'
                  }`}
                >
                  <p className="text-sm">{message.content}</p>
                  <p className={`text-xs mt-1 ${isOwn ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                    {format(new Date(message.created_at || ''), 'h:mm a')}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="p-4 border-t bg-background">
        <div className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onFocus={() => setTimeout(() => scrollToBottom(), 300)}
            placeholder="Type a message..."
            className="flex-1 rounded-full"
            disabled={isSending}
          />
          <Button 
            type="submit" 
            size="icon" 
            className="rounded-full"
            disabled={!newMessage.trim() || isSending}
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </form>
    </div>
  );
}
