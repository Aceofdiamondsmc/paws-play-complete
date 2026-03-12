import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, MessageCircle, Share2, Camera, Globe, Users, MapPin, Star, PawPrint, MoreHorizontal, Pencil, Trash2, ShieldCheck, ImageOff, MessageSquare, Check, Gift } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { usePosts } from '@/hooks/usePosts';
import { useLostDogAlerts } from '@/hooks/useLostDogAlerts';
import { useAuth } from '@/hooks/useAuth';
import { useAdmin } from '@/hooks/useAdmin';
import { useParks } from '@/hooks/useParks';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import { playPackAlertSound } from '@/lib/alert-sounds';
import { cn } from '@/lib/utils';

import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Skeleton } from '@/components/ui/skeleton';
import CreatePostForm from '@/components/social/CreatePostForm';
import PhotoUploadSheet from '@/components/social/PhotoUploadSheet';
import CommentsDrawer from '@/components/social/CommentsDrawer';
import EditPostModal from '@/components/social/EditPostModal';
import AdminEditPostModal from '@/components/social/AdminEditPostModal';
import VideoPlayer from '@/components/social/VideoPlayer';
import { useMessages } from '@/hooks/useMessages';

type FilterTab = 'all' | 'friends' | 'reviews';

// Pack Alert banners with one-time sound effect
function PackAlertBanners({ alerts, userId, onResolve }: { alerts: any[]; userId?: string; onResolve: (id: string) => void }) {
  const playedRef = useRef(false);
  const [resolvingId, setResolvingId] = useState<string | null>(null);

  useEffect(() => {
    if (alerts.length > 0 && !playedRef.current) {
      playPackAlertSound();
      playedRef.current = true;
    }
  }, [alerts]);

  const handleResolve = async (alertId: string) => {
    setResolvingId(alertId);
    await onResolve(alertId);
    setResolvingId(null);
  };

  const handleShareAlert = async (alert: any) => {
    const dogName = alert.dog?.name || 'A dog';
    const rewardText = alert.reward ? 'Reward offered for safe return. ' : '';
    const shareUrl = `${window.location.origin}/social`;
    const shareData = {
      title: '🚨 PAWS ALERT',
      text: `🚨 PAWS ALERT: ${dogName} is missing! ${rewardText}Help the pack find them.`,
      url: shareUrl,
    };

    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
      } catch (e) {
        if ((e as Error).name !== 'AbortError') {
          toast.error('Failed to share');
        }
      }
    } else {
      try {
        await navigator.clipboard.writeText(`${shareData.text} View details here: ${shareUrl}`);
        toast.success('Alert link copied!');
      } catch {
        toast.error('Failed to copy link');
      }
    }
  };

  return (
    <div className="space-y-2">
      {alerts.map((alert: any) => (
        <div key={alert.id} className="p-3 rounded-xl border-2 border-destructive/30 bg-destructive/5 animate-pulse">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-destructive flex items-center justify-center text-destructive-foreground font-bold text-lg shrink-0">
              🚨
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-destructive text-sm">🚨 PAWS ALERT: {alert.dog?.name || 'Unknown'} is missing!</p>
              <p className="text-xs text-muted-foreground truncate">
                Last seen: {alert.last_seen_location || 'Unknown'}
                {alert.contact_phone && ` · Call: ${alert.contact_phone}`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-2 ml-[52px]">
            {alert.reward && (
              <Badge variant="outline" className="border-primary text-primary bg-primary/5 font-semibold text-xs">
                <Gift className="w-3 h-3 mr-1" />
                Reward Offered
              </Badge>
            )}
            <div className="flex-1" />
            <Button
              size="sm"
              variant="ghost"
              className="shrink-0 text-xs h-7 px-2"
              onClick={(e) => { e.stopPropagation(); handleShareAlert(alert); }}
            >
              <Share2 className="h-3.5 w-3.5 mr-1" />
              Share
            </Button>
            {userId && alert.user_id === userId && (
              <Button
                size="sm"
                variant="ghost"
                disabled={resolvingId === alert.id}
                className="shrink-0 bg-green-500/15 hover:bg-green-500/25 text-green-700 dark:text-green-400 font-semibold text-xs h-7 px-2"
                onClick={(e) => { e.stopPropagation(); handleResolve(alert.id); }}
              >
                <Check className="h-3.5 w-3.5 mr-1" />
                {resolvingId === alert.id ? 'Saving…' : 'Found'}
              </Button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}


// Image with loading/error fallback
function PostImage({ src, alt }: { src: string; alt: string }) {
  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(false);

  return (
    <>
      {!loaded && !errored && <Skeleton className="absolute inset-0 rounded-none" />}
      {errored ? (
        <div className="flex items-center justify-center w-full h-full bg-muted">
          <ImageOff className="w-10 h-10 text-muted-foreground" />
        </div>
      ) : (
        <img
          src={src}
          alt={alt}
          className={cn("object-cover w-full h-full transition-opacity", !loaded && "opacity-0")}
          onLoad={() => setLoaded(true)}
          onError={() => setErrored(true)}
        />
      )}
    </>
  );
}

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
  const navigate = useNavigate();
  const { user } = useAuth();
  const { posts, loading, createPost, likePost, deletePost, refresh, newPostIds } = usePosts();
  const { activeAlerts, resolveAlert } = useLostDogAlerts();
  const { allParks } = useParks();
  const { isAdmin } = useAdmin();
  const [isPosting, setIsPosting] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');
  const [isUploadSheetOpen, setIsUploadSheetOpen] = useState(false);
  const [commentsPostId, setCommentsPostId] = useState<string | null>(null);
  
  // Edit modal state
  const [editingPost, setEditingPost] = useState<{ id: string; content: string } | null>(null);
  
  // Delete confirmation state
  const [deletingPostId, setDeletingPostId] = useState<string | null>(null);
  
  const { startConversation } = useMessages();

  const handleMessageAuthor = async (authorId: string) => {
    if (!user) {
      navigate('/me');
      return;
    }
    const { conversation, error } = await startConversation(authorId);
    if (error) {
      toast.error('Failed to start conversation');
      return;
    }
    if (conversation) {
      navigate(`/me?chat=${conversation.id}`);
    }
  };

  // Admin edit state
  const [adminEditingPost, setAdminEditingPost] = useState<{
    id: string; content: string; pup_name: string; image_url: string; video_url: string; likes_count: number; comments_count: number; author_display_name?: string; author_name?: string; author_avatar_url?: string;
  } | null>(null);

  const handleDeletePost = async () => {
    if (!deletingPostId) return;
    
    const { error } = await deletePost(deletingPostId);
    if (error) {
      toast.error('Failed to delete post');
    } else {
      toast.success('Post deleted');
    }
    setDeletingPostId(null);
  };
  const handlePost = async (
    content: string, 
    imageUrl?: string, 
    isReview?: boolean, 
    parkId?: string, 
    rating?: number,
    videoUrl?: string,
    authorDisplayName?: string,
    authorAvatarUrl?: string
  ) => {
    setIsPosting(true);
    await createPost(content, imageUrl, 'public', videoUrl, authorDisplayName, authorAvatarUrl);
    setIsPosting(false);
  };

  const handleShare = async (postId: string, postContent: string, authorName: string) => {
    const shareUrl = `https://xasbgkggwnkvrceziaix.supabase.co/functions/v1/og-post?postId=${postId}`;
    
    const truncatedContent = postContent.length > 100 
      ? postContent.substring(0, 100) + '...' 
      : postContent;
    
    const shareData = {
      title: `${authorName} on Paws Play Repeat`,
      text: truncatedContent,
      url: shareUrl,
    };

    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          console.error('Error sharing:', error);
          toast.error('Failed to share post');
        }
      }
    } else {
      try {
        const shareText = `${truncatedContent}\n\nCheck it out on Paws Play Repeat: ${shareUrl}`;
        await navigator.clipboard.writeText(shareText);
        toast.success('Link copied!', {
          description: 'Post link copied to your clipboard',
        });
      } catch (error) {
        console.error('Failed to copy:', error);
        toast.error('Failed to copy link');
      }
    }
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

  // Filter posts based on active filter
  const filteredPosts = activeFilter === 'reviews' 
    ? posts.filter((p) => p.content?.toLowerCase().includes('park'))
    : posts;

  return (
    <div className="min-h-screen bg-gradient-to-b from-[hsl(45,60%,92%)] via-[hsl(45,50%,95%)] to-background pb-24 relative">
      {/* Floating Action Button - Bottom Right */}
      <div className="fixed bottom-24 right-4 z-[100] flex flex-col items-center gap-2">
        {/* Sign in tooltip for non-logged in users */}
        {!user && (
          <button
            onClick={() => navigate('/me')}
            className="bg-card text-foreground text-xs font-semibold px-3 py-1.5 rounded-full shadow-lg border border-border animate-fade-in whitespace-nowrap"
          >
            Sign in to post
          </button>
        )}
        <Button
          size="icon"
          aria-label={user ? "Create a post" : "Sign in to create a post"}
          className={cn(
            "rounded-full w-14 h-14 shadow-xl border-0",
            user ? "bg-primary hover:bg-primary/90" : "bg-muted hover:bg-muted/90"
          )}
          onClick={() => {
            if (user) {
              setIsUploadSheetOpen(true);
              return;
            }
            navigate('/me');
          }}
        >
          <Camera
            className={cn(
              "w-7 h-7",
              user ? "text-primary-foreground" : "text-muted-foreground"
            )}
            strokeWidth={2}
          />
        </Button>
      </div>
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
        {/* Pack Alerts Banner */}
        {activeAlerts.length > 0 && (
          <PackAlertBanners alerts={activeAlerts} userId={user?.id} onResolve={resolveAlert} />
        )}

        {/* Create Post Form - only show if user is logged in */}
        {user && (
          <CreatePostForm onPost={handlePost} isPosting={isPosting} isAdmin={isAdmin} />
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
                {/* Avatar - Clickable */}
                <button
                  onClick={() => navigate(post.dog_id ? `/pack?dog=${post.dog_id}` : `/pack?user=${post.author_id}`)}
                  className="shrink-0 focus:outline-none focus:ring-2 focus:ring-primary/50 rounded-full transition-transform hover:scale-105"
                  aria-label={`View ${post.author?.display_name || 'user'}'s profile`}
                >
                  <Avatar className="w-14 h-14 bg-primary border-2 border-primary/30">
                    <AvatarImage src={post.author?.avatar_url || undefined} />
                    <AvatarFallback className="bg-primary text-primary-foreground text-xl font-bold">
                      {post.author?.display_name?.[0]?.toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                </button>
                
                <div className="flex-1 min-w-0">
                  {/* Header row */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <button
                        onClick={() => navigate(post.dog_id ? `/pack?dog=${post.dog_id}` : `/pack?user=${post.author_id}`)}
                        className="font-bold text-foreground text-base hover:underline focus:outline-none focus:underline text-left flex items-center gap-1.5"
                      >
                        {post.author_display_name || post.author?.display_name || post.author?.username || 'Anonymous'}
                        {post.author_display_name && <ShieldCheck className="w-4 h-4 text-primary" />}
                      </button>
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
                    
                    <div className="flex items-center gap-2">
                      {/* Park Review Badge */}
                      {(post.isReview || post.content?.toLowerCase().includes('park')) && (
                        <Badge 
                          variant="outline" 
                          className="border-primary text-primary bg-primary/5 font-semibold shrink-0"
                        >
                          <MapPin className="w-3 h-3 mr-1" />
                          Park Review
                        </Badge>
                      )}
                      
                      {/* Admin Edit Button */}
                      {isAdmin && (
                        <button
                        onClick={() => setAdminEditingPost({
                            id: post.id,
                            content: post.content || '',
                            pup_name: post.pup_name || post.dogName || '',
                            image_url: post.image_url || '',
                            video_url: (post as any).video_url || '',
                            likes_count: post.likesCount,
                            comments_count: post.commentsCount,
                            author_display_name: (post as any).author_display_name || '',
                            author_name: post.author?.display_name || '',
                            author_avatar_url: post.author?.avatar_url || '',
                          })}
                          className="p-1.5 rounded-full hover:bg-primary/10 transition-colors text-primary/60 hover:text-primary"
                          aria-label="Admin edit post"
                          title="Admin Edit"
                        >
                          <ShieldCheck className="w-4 h-4" />
                        </button>
                      )}

                      {/* Owner Actions Menu */}
                      {user && post.author_id === user.id && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button
                              className="p-1.5 rounded-full hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                              aria-label="Post options"
                            >
                              <MoreHorizontal className="w-5 h-5" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-40">
                            <DropdownMenuItem
                              onClick={() => setEditingPost({ id: post.id, content: post.content })}
                              className="cursor-pointer"
                            >
                              <Pencil className="w-4 h-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => setDeletingPostId(post.id)}
                              className="cursor-pointer text-destructive focus:text-destructive"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </div>
                  
                  {/* Content */}
                  <p className="mt-3 text-foreground whitespace-pre-wrap leading-relaxed">
                    {post.content}
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
                  
                  {/* Media (Image or Video) */}
                  {post.video_url && (
                    <div className="mt-3 overflow-hidden rounded-xl border border-border">
                      <VideoPlayer src={post.video_url} />
                    </div>
                  )}
                  {post.image_url && !post.video_url && (
                    <div className="mt-3 overflow-hidden rounded-xl border border-border">
                      <AspectRatio ratio={1}>
                        <PostImage
                          src={post.image_url}
                          alt="Post content"
                        />
                      </AspectRatio>
                    </div>
                  )}
                  
                  {/* Action buttons */}
                  <div className="flex items-center gap-6 mt-4 pt-2">
                    <button
                      onClick={() => likePost(post.id)}
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
                      onClick={() => setCommentsPostId(post.id)}
                      className="flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <MessageCircle className="w-5 h-5" />
                      <span>{post.commentsCount || 0}</span>
                    </button>
                    
                    <button 
                      onClick={() => handleShare(
                        post.id, 
                        post.content || '', 
                        post.author?.display_name || post.author?.username || 'Someone'
                      )}
                      className="flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
                      aria-label="Share post"
                    >
                      <Share2 className="w-5 h-5" />
                    </button>

                    {user && post.author_id !== user.id && (
                      <button
                        onClick={() => handleMessageAuthor(post.author_id)}
                        className="flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-primary transition-colors"
                        aria-label="Message author"
                      >
                        <MessageSquare className="w-5 h-5" />
                      </button>
                    )}

                    <button
                      onClick={() => navigate(post.dog_id ? `/pack?dog=${post.dog_id}` : `/pack?user=${post.author_id}`)}
                      className={cn(
                        "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold",
                        "bg-gradient-to-r from-primary via-primary to-accent text-white",
                        "shadow-sm hover:shadow-md hover:scale-105 active:scale-95",
                        "transition-all duration-200 meet-button-shimmer",
                        "ml-auto"
                      )}
                      aria-label={post.dogName ? `Meet ${post.dogName}` : 'Meet a Friend'}
                    >
                      <PawPrint className="w-3.5 h-3.5" />
                      <span>{post.dogName ? `Meet ${post.dogName}` : 'Meet a Friend'}</span>
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
              <PawPrint className="w-10 h-10 text-primary" />
            </div>
            <h3 className="text-lg font-bold text-foreground mb-2">The Pack is gathering...</h3>
            <p className="text-muted-foreground">Be the first to post! Share your pup's latest adventure.</p>
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

      {/* Edit Post Modal */}
      <EditPostModal
        open={!!editingPost}
        onOpenChange={(open) => !open && setEditingPost(null)}
        postId={editingPost?.id || null}
        initialContent={editingPost?.content || ''}
        onPostUpdated={refresh}
      />

      {/* Admin Edit Post Modal */}
      <AdminEditPostModal
        open={!!adminEditingPost}
        onOpenChange={(open) => !open && setAdminEditingPost(null)}
        postId={adminEditingPost?.id || null}
        initialContent={adminEditingPost?.content || ''}
        initialPupName={adminEditingPost?.pup_name || ''}
        initialImageUrl={adminEditingPost?.image_url || ''}
        initialVideoUrl={adminEditingPost?.video_url || ''}
        initialAuthorName={adminEditingPost?.author_display_name || adminEditingPost?.author_name || ''}
        initialLikesCount={adminEditingPost?.likes_count || 0}
        initialCommentsCount={adminEditingPost?.comments_count || 0}
        initialAuthorAvatarUrl={adminEditingPost?.author_avatar_url || ''}
        onPostUpdated={refresh}
      />

      <AlertDialog open={!!deletingPostId} onOpenChange={(open) => !open && setDeletingPostId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Post</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this post? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeletePost}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
