import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Send, MoreVertical, Trash2, Paperclip, X } from 'lucide-react';
import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useConversationMessages } from '@/hooks/useMessages';
import { useImageUpload } from '@/hooks/useImageUpload';
import { useAuth } from '@/hooks/useAuth';
import { ensureJpeg } from '@/lib/heic-convert';
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

// Detect emoji-only messages (1-3 emoji characters, no other text)
function isEmojiOnly(text: string): boolean {
  const emojiRegex = /^(?:\p{Emoji_Presentation}|\p{Emoji}\uFE0F){1,3}$/u;
  return emojiRegex.test(text.trim());
}

export function ChatView({ conversationId, otherUser, onBack }: ChatViewProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { uploadImage, uploading } = useImageUpload();

  const handleCustomBack = () => {
    if (location.pathname.includes('social') || location.pathname.includes('pack')) {
      navigate('/social');
    } else {
      navigate('/me');
    }
    onBack();
  };

  const { messages, loading, sendMessage, deleteConversation } = useConversationMessages(conversationId);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [pendingImage, setPendingImage] = useState<File | null>(null);
  const [pendingImagePreview, setPendingImagePreview] = useState<string | null>(null);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Clean up preview URL on unmount
  useEffect(() => {
    return () => {
      if (pendingImagePreview) URL.revokeObjectURL(pendingImagePreview);
    };
  }, [pendingImagePreview]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

    try {
      const converted = await ensureJpeg(file, () => {
        toast('Converting image…', { description: 'Preparing for best compatibility.' });
      });
      setPendingImage(converted);
      setPendingImagePreview(URL.createObjectURL(converted));
    } catch {
      toast.error('Could not process image');
    }
  };

  const clearPendingImage = () => {
    if (pendingImagePreview) URL.revokeObjectURL(pendingImagePreview);
    setPendingImage(null);
    setPendingImagePreview(null);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const hasText = newMessage.trim().length > 0;
    const hasImage = !!pendingImage;
    if ((!hasText && !hasImage) || isSending) return;

    setIsSending(true);
    try {
      let imageUrl: string | undefined;

      if (pendingImage) {
        const { url, error: uploadError } = await uploadImage(pendingImage, 'post-images');
        if (uploadError || !url) {
          toast.error('Image upload failed');
          setIsSending(false);
          return;
        }
        imageUrl = url;
        clearPendingImage();
      }

      const content = hasText ? newMessage.trim() : '📷';
      const { error } = await sendMessage(content, imageUrl);
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
        <Button variant="ghost" size="icon" onClick={handleCustomBack}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="relative">
          <Avatar className="w-10 h-10 ring-2 ring-primary/20">
            <AvatarImage src={otherUser?.avatar_url || undefined} />
            <AvatarFallback className="bg-primary/10 text-primary font-bold">
              {otherUser?.display_name?.[0] || '?'}
            </AvatarFallback>
          </Avatar>
          {/* Online dot */}
          <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-background" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-bold truncate">{otherUser?.display_name || 'Unknown User'}</h2>
          <p className="text-xs text-muted-foreground">Active now</p>
        </div>
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
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-3">
        {loading ? (
          <div className="flex justify-center py-10">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-16 space-y-3">
            <div className="text-5xl animate-bounce">🐾</div>
            <p className="text-lg font-semibold text-foreground">Start the conversation!</p>
            <p className="text-sm text-muted-foreground">Send a message or photo to say hello 👋</p>
          </div>
        ) : (
          messages.map(message => {
            const isOwn = message.sender_id === user?.id;
            const emojiOnly = isEmojiOnly(message.content) && !message.image_url;

            if (emojiOnly) {
              return (
                <div key={message.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                  <div className="px-2 py-1">
                    <p className="text-4xl leading-none">{message.content}</p>
                    <p className="text-[10px] mt-1 text-muted-foreground/70 text-center">
                      {format(new Date(message.created_at || ''), 'h:mm a')}
                    </p>
                  </div>
                </div>
              );
            }

            return (
              <div
                key={message.id}
                className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[75%] rounded-2xl overflow-hidden ${
                    isOwn
                      ? 'bg-gradient-to-br from-primary to-primary/85 text-primary-foreground rounded-br-md shadow-md shadow-primary/20'
                      : 'bg-card border border-border rounded-bl-md shadow-sm'
                  }`}
                >
                  {/* Image */}
                  {message.image_url && (
                    <button
                      onClick={() => setLightboxUrl(message.image_url!)}
                      className="block w-full"
                    >
                      <img
                        src={message.image_url}
                        alt="Shared image"
                        className="w-full max-h-[200px] object-cover"
                        loading="lazy"
                      />
                    </button>
                  )}
                  {/* Text */}
                  {message.content !== '📷' && (
                    <div className="px-4 py-2.5">
                      <p className="text-[15px] leading-relaxed font-medium">{message.content}</p>
                    </div>
                  )}
                  <div className={`px-4 pb-2 ${message.content === '📷' ? 'pt-1.5' : ''}`}>
                    <p className={`text-[10px] ${isOwn ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                      {format(new Date(message.created_at || ''), 'h:mm a')}
                    </p>
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Image preview */}
      {pendingImagePreview && (
        <div className="px-4 pb-2">
          <div className="relative inline-block rounded-xl overflow-hidden border border-border shadow-sm">
            <img src={pendingImagePreview} alt="Preview" className="h-20 w-20 object-cover" />
            <button
              onClick={clearPendingImage}
              className="absolute top-1 right-1 bg-background/80 backdrop-blur-sm rounded-full p-0.5"
            >
              <X className="w-3.5 h-3.5 text-foreground" />
            </button>
          </div>
        </div>
      )}

      {/* Input */}
      <form onSubmit={handleSend} className="p-4 border-t bg-background/95 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp,.heic,.heif"
            className="hidden"
            onChange={handleFileSelect}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="rounded-full text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors shrink-0"
            onClick={() => fileInputRef.current?.click()}
            disabled={isSending || uploading}
          >
            <Paperclip className="w-5 h-5" />
          </Button>
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onFocus={() => setTimeout(() => scrollToBottom(), 300)}
            placeholder="Type a message..."
            className="flex-1 rounded-full text-[15px] py-3 h-11 border-primary/20 focus:border-primary focus:ring-1 focus:ring-primary/30"
            disabled={isSending || uploading}
          />
          <Button
            type="submit"
            size="icon"
            className="rounded-full bg-gradient-to-br from-primary to-primary/85 hover:from-primary/90 hover:to-primary/80 shadow-md shadow-primary/20 active:scale-90 transition-all shrink-0"
            disabled={(!newMessage.trim() && !pendingImage) || isSending || uploading}
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </form>

      {/* Lightbox */}
      {lightboxUrl && (
        <div
          className="fixed inset-0 z-[80] bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightboxUrl(null)}
        >
          <button
            className="absolute top-6 right-6 text-white/80 hover:text-white"
            onClick={() => setLightboxUrl(null)}
          >
            <X className="w-8 h-8" />
          </button>
          <img
            src={lightboxUrl}
            alt="Full size"
            className="max-w-full max-h-full object-contain rounded-lg"
          />
        </div>
      )}
    </div>
  );
}
