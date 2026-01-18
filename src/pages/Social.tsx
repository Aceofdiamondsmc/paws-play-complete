import { useState } from 'react';
import { Heart, MessageCircle, Share2, Camera, Globe, Users, MapPin, Star, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { usePosts } from '@/hooks/usePosts';
import { useAuth } from '@/hooks/useAuth';
import { useParks } from '@/hooks/useParks';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

import bostonTerrierPost from '@/assets/boston-terrier-post.png';
import CreatePostForm from '@/components/social/CreatePostForm';
import PhotoUploadSheet from '@/components/social/PhotoUploadSheet';
import CommentsDrawer from '@/components/social/CommentsDrawer';

type FilterTab = 'all' | 'friends' | 'reviews';

// Sample posts for inspiration when no real posts exist
const samplePosts = [
  {
    id: 'sample-1',
    author: { display_name: 'Sarah & Max', avatar_url: null },
    caption: "Max had the best time at Riverside Dog Park today! Made three new furry friends and perfected his fetch game. The new agility course is pawsome! 🐕",
    parkName: 'Riverside Dog Park',
    rating: 5,
    isReview: true,
    likesCount: 24,
    commentsCount: 8,
    isLiked: false,
    timeAgo: '30m ago',
    image_path: bostonTerrierPost,
  },
  {
    id: 'sample-2',
    author: { display_name: 'Michael & Luna', avatar_url: null },
    caption: "Luna discovered her love for swimming today! Who knew my little pup would turn into a water dog? 💦🐾",
    likesCount: 42,
    commentsCount: 12,
    isLiked: true,
    timeAgo: '2h ago',
    image_path: 'https://images.unsplash.com/photo-1530281700549-e82e7bf110d6?w=400&h=400&fit=crop',
  },
  {
    id: 'sample-3',
    author: { display_name: 'Emily & Buddy', avatar_url: null },
    caption: "Oakwood Dog Park needs better shade areas. The equipment is great but it gets too hot in the afternoon. Still, Buddy had fun!",
    parkName: 'Oakwood Dog Park',
    rating: 3,
    isReview: true,
    likesCount: 15,
    commentsCount: 5,
    isLiked: false,
    timeAgo: '4h ago',
  },
  {
    id: 'sample-4',
    author: { display_name: 'Jake & Charlie', avatar_url: null },
    caption: "Charlie made so many friends today! Look at that smile! Golden Retrievers really are the friendliest pups. 🌟",
    likesCount: 58,
    commentsCount: 14,
    isLiked: false,
    timeAgo: '6h ago',
    image_path: 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=400&h=400&fit=crop',
  },
  {
    id: 'sample-5',
    author: { display_name: 'Rachel & Bella', avatar_url: null },
    caption: "Bella and her new bestie playing at the park! Nothing beats puppy playtime energy! 🐶❤️",
    parkName: 'Sunny Meadows Park',
    likesCount: 67,
    commentsCount: 19,
    isLiked: true,
    timeAgo: '8h ago',
    image_path: 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=400&h=400&fit=crop',
  },
  {
    id: 'sample-6',
    author: { display_name: 'Amanda & Zeus', avatar_url: null },
    caption: "First time at Maplewood Dog Park and we loved it! Great fenced area for small dogs. Zeus felt right at home! 🏆",
    parkName: 'Maplewood Dog Park',
    rating: 5,
    isReview: true,
    likesCount: 31,
    commentsCount: 7,
    isLiked: false,
    timeAgo: '10h ago',
    image_path: 'https://images.unsplash.com/photo-1477884213360-7e9d7dcc1e48?w=400&h=400&fit=crop',
  },
];

// Star rating component
function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={cn(
            "w-4 h-4",
            star <= rating 
              ? "fill-primary text-primary" 
              : "text-muted-foreground/40"
          )}
        />
      ))}
    </div>
  );
}

export default function Social() {
  const { user } = useAuth();
  const { posts, loading, createPost, likePost, refresh, newPostIds } = usePosts();
  const { allParks } = useParks();
  const [isPosting, setIsPosting] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');
  const [isUploadSheetOpen, setIsUploadSheetOpen] = useState(false);
  const [commentsPostId, setCommentsPostId] = useState<string | null>(null);

  const handlePost = async (
    content: string, 
    imageUrl?: string, 
    isReview?: boolean, 
    parkId?: string, 
    rating?: number
  ) => {
    setIsPosting(true);
    await createPost(content, imageUrl);
    setIsPosting(false);
  };

  // Get park name by ID
  const getParkName = (parkId: string) => {
    const park = allParks.find(p => p.id === parkId);
    return park?.name || 'Unknown Park';
  };

  const filters: { id: FilterTab; label: string; icon: React.ElementType }[] = [
    { id: 'all', label: 'All Posts', icon: Globe },
    { id: 'friends', label: 'Pack Friends', icon: Users },
    { id: 'reviews', label: 'Park Reviews', icon: MapPin },
  ];

  // Use sample posts if no real posts, otherwise show real posts
  const displayPosts = posts.length > 0 ? posts : samplePosts;

  // Filter sample posts based on active filter
  const filteredPosts = activeFilter === 'reviews' 
    ? displayPosts.filter((p: any) => p.isReview || p.caption?.toLowerCase().includes('park'))
    : displayPosts;

  return (
    <div className="min-h-screen bg-gradient-to-b from-[hsl(45,60%,92%)] via-[hsl(45,50%,95%)] to-background pb-24 relative">
      {/* Floating Action Button - Bottom Right - More prominent */}
      {user && (
        <Button 
          size="icon" 
          className="fixed bottom-24 right-4 z-[100] rounded-full w-16 h-16 bg-primary hover:bg-primary/90 shadow-2xl border-4 border-primary-foreground"
          onClick={() => setIsUploadSheetOpen(true)}
        >
          <Plus className="w-8 h-8 text-primary-foreground" strokeWidth={3} />
        </Button>
      )}

      {/* Header with warm cream/orange gradient */}
      <div className="sticky top-0 z-10 bg-gradient-to-b from-[hsl(45,60%,92%)] to-[hsl(45,50%,95%)] border-b border-primary/20">
        <div className="px-4 pt-4 pb-2">
          <h1 className="text-2xl font-extrabold text-primary italic">Pack Community</h1>
          <p className="text-sm text-primary/70">Share your pup's adventures</p>
        </div>
        
        {/* Filter Tabs */}
        <div className="px-4 pb-3 flex gap-2 overflow-x-auto scrollbar-hide">
          {filters.map((filter) => {
            const Icon = filter.icon;
            return (
              <button
                key={filter.id}
                onClick={() => setActiveFilter(filter.id)}
                className={cn(
                  "flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition-all",
                  activeFilter === filter.id
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "bg-card text-muted-foreground hover:bg-card/80 border border-border"
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
        {/* Create Post Form - only show if user is logged in */}
        {user && (
          <CreatePostForm onPost={handlePost} isPosting={isPosting} />
        )}

        {/* Posts Feed */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        ) : (
          filteredPosts.map((post: any) => (
            <Card 
              key={post.id} 
              className={cn(
                "p-4 bg-card border-2 border-primary/20 rounded-2xl shadow-sm hover:shadow-md transition-all",
                newPostIds.has(post.id) && "animate-fade-in ring-2 ring-primary/30"
              )}
            >
              <div className="flex gap-3">
                {/* Avatar */}
                <Avatar className="w-14 h-14 bg-primary border-2 border-primary/30">
                  <AvatarImage src={post.author?.avatar_url || undefined} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-xl font-bold">
                    {post.author?.display_name?.[0]?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 min-w-0">
                  {/* Header row */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="font-bold text-foreground text-base">
                        {post.author?.display_name || 'Anonymous'}
                      </span>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>
                          {post.timeAgo || (post.created_at && formatDistanceToNow(new Date(post.created_at), { addSuffix: true }))}
                        </span>
                        <span className="flex items-center gap-1">
                          <Globe className="w-3 h-3" />
                          Public
                        </span>
                      </div>
                    </div>
                    
                    {/* Park Review Badge */}
                    {(post.isReview || post.caption?.toLowerCase().includes('park')) && (
                      <Badge 
                        variant="outline" 
                        className="border-primary text-primary bg-primary/5 font-semibold shrink-0"
                      >
                        <MapPin className="w-3 h-3 mr-1" />
                        Park Review
                      </Badge>
                    )}
                  </div>
                  
                  {/* Content - now uses caption */}
                  <p className="mt-3 text-foreground whitespace-pre-wrap leading-relaxed">
                    {post.caption || post.content}
                  </p>
                  
                  {/* Park location & rating */}
                  {post.parkName && (
                    <div className="mt-2 space-y-1">
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <MapPin className="w-4 h-4 text-primary" />
                        <span className="font-medium">{post.parkName}</span>
                      </div>
                      {post.rating && <StarRating rating={post.rating} />}
                    </div>
                  )}
                  
                  {/* Image - now uses image_path */}
                  {post.image_path && (
                    <div className="mt-3">
                      <img
                        src={post.image_path}
                        alt=""
                        className="rounded-xl w-full max-h-80 object-cover border border-border"
                      />
                    </div>
                  )}
                  
                  {/* Action buttons */}
                  <div className="flex items-center gap-6 mt-4 pt-2">
                    <button
                      onClick={() => post.id.startsWith('sample') ? null : likePost(post.id)}
                      className={cn(
                        "flex items-center gap-1.5 text-sm font-semibold transition-colors",
                        post.isLiked 
                          ? "text-destructive" 
                          : "text-muted-foreground hover:text-destructive"
                      )}
                    >
                      <Heart className={cn("w-5 h-5", post.isLiked && "fill-current")} />
                      <span>{post.likesCount || 0}</span>
                    </button>
                    
                    <button 
                      onClick={() => !post.id.startsWith('sample') && setCommentsPostId(post.id)}
                      className="flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <MessageCircle className="w-5 h-5" />
                      <span>{post.commentsCount || 0}</span>
                    </button>
                    
                    <button className="flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors ml-auto">
                      <Share2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            </Card>
          ))
        )}
        
        {/* Empty state - only if no posts and no samples */}
        {!loading && filteredPosts.length === 0 && (
          <div className="text-center py-12">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
              <MessageCircle className="w-10 h-10 text-primary" />
            </div>
            <h3 className="text-lg font-bold text-foreground mb-2">No posts yet</h3>
            <p className="text-muted-foreground">Be the first to share with the pack!</p>
          </div>
        )}
      </div>

      {/* Photo Upload Sheet */}
      <PhotoUploadSheet
        open={isUploadSheetOpen}
        onOpenChange={setIsUploadSheetOpen}
        onPostCreated={refresh}
      />

      {/* Comments Drawer */}
      <CommentsDrawer
        postId={commentsPostId}
        open={!!commentsPostId}
        onOpenChange={(open) => !open && setCommentsPostId(null)}
      />
    </div>
  );
}
