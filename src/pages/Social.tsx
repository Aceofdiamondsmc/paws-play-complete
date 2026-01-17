import { useState } from 'react';
import { Heart, MessageCircle, Share2, Plus, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { usePosts } from '@/hooks/usePosts';
import { useAuth } from '@/hooks/useAuth';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

export default function Social() {
  const { user } = useAuth();
  const { posts, loading, createPost, likePost } = usePosts();
  const [newPost, setNewPost] = useState('');
  const [isPosting, setIsPosting] = useState(false);

  const handlePost = async () => {
    if (!newPost.trim()) return;
    setIsPosting(true);
    await createPost(newPost.trim());
    setNewPost('');
    setIsPosting(false);
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-card/95 backdrop-blur border-b border-border p-4">
        <h1 className="text-2xl font-bold">Activity Feed</h1>
      </div>

      <div className="p-4 space-y-4">
        {/* Create Post */}
        {user && (
          <Card className="p-4">
            <Textarea
              placeholder="Share something with the pack... 🐾"
              value={newPost}
              onChange={(e) => setNewPost(e.target.value)}
              className="min-h-[80px] resize-none border-0 p-0 focus-visible:ring-0"
            />
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
              <Button variant="ghost" size="sm">
                <ImageIcon className="w-5 h-5 text-muted-foreground" />
              </Button>
              <Button
                onClick={handlePost}
                disabled={!newPost.trim() || isPosting}
                className="rounded-full"
              >
                <Plus className="w-4 h-4 mr-1" />
                Post
              </Button>
            </div>
          </Card>
        )}

        {/* Posts Feed */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p>No posts yet. Be the first to share!</p>
          </div>
        ) : (
          posts.map(post => (
            <Card key={post.id} className="p-4 feed-item">
              <div className="flex gap-3">
                <Avatar className="w-10 h-10">
                  <AvatarImage src={post.author?.avatar_url || undefined} />
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {post.author?.display_name?.[0] || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">
                      {post.author?.display_name || 'Anonymous'}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {post.created_at && formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                    </span>
                  </div>
                  <p className="mt-1 text-foreground whitespace-pre-wrap">{post.content}</p>
                  {post.image_url && (
                    <img
                      src={post.image_url}
                      alt=""
                      className="mt-3 rounded-xl max-h-80 object-cover w-full"
                    />
                  )}
                  <div className="flex items-center gap-6 mt-3">
                    <button
                      onClick={() => likePost(post.id)}
                      className={cn(
                        "flex items-center gap-1.5 text-sm transition-colors",
                        post.isLiked ? "text-destructive" : "text-muted-foreground hover:text-destructive"
                      )}
                    >
                      <Heart className={cn("w-5 h-5", post.isLiked && "fill-current")} />
                      {post.likesCount > 0 && post.likesCount}
                    </button>
                    <button className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
                      <MessageCircle className="w-5 h-5" />
                      {post.commentsCount > 0 && post.commentsCount}
                    </button>
                    <button className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
                      <Share2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
