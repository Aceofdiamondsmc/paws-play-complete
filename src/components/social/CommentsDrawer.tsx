import { useState } from 'react';
import { Send, Loader2, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { ScrollArea } from '@/components/ui/scroll-area';
import { usePostComments } from '@/hooks/usePosts';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';

interface CommentsDrawerProps {
  postId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function CommentsDrawer({ postId, open, onOpenChange }: CommentsDrawerProps) {
  const { user } = useAuth();
  const { comments, loading, addComment } = usePostComments(postId);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Not logged in",
        description: "Please log in to comment.",
        variant: "destructive",
      });
      return;
    }

    if (!newComment.trim()) return;

    setSubmitting(true);
    const { error } = await addComment(newComment.trim());
    setSubmitting(false);

    if (error) {
      toast({
        title: "Error",
        description: "Could not post comment. Please try again.",
        variant: "destructive",
      });
    } else {
      setNewComment('');
    }
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[85vh]">
        <DrawerHeader className="border-b border-border pb-4">
          <DrawerTitle className="flex items-center gap-2 text-xl font-bold text-foreground">
            <MessageCircle className="w-5 h-5 text-primary" />
            Comments
          </DrawerTitle>
        </DrawerHeader>

        <ScrollArea className="flex-1 p-4 max-h-[50vh]">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center py-8">
              <MessageCircle className="w-12 h-12 mx-auto text-muted-foreground/40 mb-3" />
              <p className="text-muted-foreground">No comments yet</p>
              <p className="text-sm text-muted-foreground/70">Be the first to comment!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {comments.map((comment) => (
                <div key={comment.id} className="flex gap-3">
                  <Avatar className="w-9 h-9 border border-primary/20">
                    <AvatarImage src={comment.author?.avatar_url || undefined} />
                    <AvatarFallback className="bg-primary/10 text-primary text-sm font-bold">
                      {comment.author?.display_name?.[0]?.toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="bg-muted/50 rounded-2xl px-4 py-2.5">
                      <span className="font-semibold text-foreground text-sm">
                        {comment.author?.display_name || 'Anonymous'}
                      </span>
                      <p className="text-foreground text-sm mt-0.5 whitespace-pre-wrap">
                        {comment.body}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground ml-2 mt-1 block">
                      {comment.created_at 
                        ? formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })
                        : 'Just now'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Comment Input */}
        <div className="p-4 border-t border-border bg-background">
          {user ? (
            <form onSubmit={handleSubmit} className="flex gap-2">
              <Input
                placeholder="Write a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                disabled={submitting}
                className="flex-1 rounded-full border-primary/20 focus:border-primary"
              />
              <Button
                type="submit"
                size="icon"
                disabled={submitting || !newComment.trim()}
                className="rounded-full bg-primary hover:bg-primary/90 shrink-0"
              >
                {submitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </form>
          ) : (
            <p className="text-center text-muted-foreground text-sm py-2">
              Log in to add a comment
            </p>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
