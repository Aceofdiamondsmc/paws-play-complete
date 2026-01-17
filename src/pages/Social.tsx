import { useState } from 'react';
import { Heart, MessageCircle, Share2, Plus, Image as ImageIcon, Globe, Users, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { usePosts } from '@/hooks/usePosts';
import { useAuth } from '@/hooks/useAuth';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

type FilterTab = 'all' | 'friends' | 'reviews';

export default function Social() {
  const { user } = useAuth();
  const { posts, loading, createPost, likePost } = usePosts();
  const [newPost, setNewPost] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');

  const handlePost = async () => {
    if (!newPost.trim()) return;
    setIsPosting(true);
    await createPost(newPost.trim());
    setNewPost('');
    setIsPosting(false);
  };

  const filters: { id: FilterTab; label: string; icon: React.ElementType }[] = [
    { id: 'all', label: 'All Posts', icon: Globe },
    { id: 'friends', label: 'Pack Friends', icon: Users },
    { id: 'reviews', label: 'Park Reviews', icon: MapPin },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-card border-b border-border">
        <div className="p-4 pb-2">
          <p className="text-sm text-muted-foreground">Share your pup's adventures</p>
        </div>
        
        {/* Filter Tabs */}
        <div className="px-4 pb-3 flex gap-2 overflow-x-auto">
          {filters.map((filter) => {
            const Icon = filter.icon;
            return (
              <button
                key={filter.id}
                onClick={() => setActiveFilter(filter.id)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors",
                  activeFilter === filter.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                )}
              >
                <Icon className="w-4 h-4" />
                {filter.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Create Post */}
        {user && (
          <Card className="p-4 bg-card">
            <Textarea
              placeholder="Share something with the pack... 🐾"
              value={newPost}
              onChange={(e) => setNewPost(e.target.value)}
              className="min-h-[80px] resize-none border-0 p-0 focus-visible:ring-0 bg-transparent"
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
            <Card key={post.id} className="p-4 bg-card">
              <div className="flex gap-3">
                <Avatar className="w-12 h-12 bg-primary">
                  <AvatarImage src={post.author?.avatar_url || undefined} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-lg font-bold">
                    {post.author?.display_name?.[0]?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-bold text-foreground">
                        {post.author?.display_name || 'Anonymous'}
                      </span>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>
                          {post.created_at && formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                        </span>
                        <span className="flex items-center gap-1">
                          <Globe className="w-3 h-3" />
                          Public
                        </span>
                      </div>
                    </div>
                    {/* Park Review Badge - show on some posts */}
                    {post.content?.toLowerCase().includes('park') && (
                      <Badge variant="outline" className="border-primary text-primary">
                        <MapPin className="w-3 h-3 mr-1" />
                        Park Review
                      </Badge>
                    )}
                  </div>
                  
                  <p className="mt-3 text-foreground whitespace-pre-wrap">{post.content}</p>
                  
                  {post.image_url && (
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <div className="bg-muted rounded-lg aspect-square flex items-center justify-center text-muted-foreground">
                        Post media 1
                      </div>
                      <img
                        src={post.image_url}
                        alt=""
                        className="rounded-lg aspect-square object-cover w-full"
                      />
                    </div>
                  )}
                  
                  <div className="flex items-center gap-6 mt-4">
                    <button
                      onClick={() => likePost(post.id)}
                      className={cn(
                        "flex items-center gap-1.5 text-sm font-medium transition-colors",
                        post.isLiked ? "text-destructive" : "text-muted-foreground hover:text-destructive"
                      )}
                    >
                      <Heart className={cn("w-5 h-5", post.isLiked && "fill-current")} />
                      {post.likesCount > 0 && post.likesCount}
                    </button>
                    <button className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                      <MessageCircle className="w-5 h-5" />
                      {post.commentsCount > 0 && post.commentsCount}
                    </button>
                    <button className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors ml-auto">
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
