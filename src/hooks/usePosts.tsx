import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import type { Post, Profile } from '@/types';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { getPupImage } from '@/lib/pup-images';

interface PostWithDetails extends Post {
  author?: Partial<Profile>;
  likesCount: number;
  commentsCount: number;
  isLiked: boolean;
  dogName?: string | null;
}

interface Comment {
  id: string;
  post_id: string;
  author_id: string;
  body: string;
  image_url: string | null;
  created_at: string | null;
  updated_at: string | null;
  author?: Partial<Profile>;
}

export function usePosts() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<PostWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [newPostIds, setNewPostIds] = useState<Set<string>>(new Set());
  const channelRef = useRef<RealtimeChannel | null>(null);
  const userIdRef = useRef<string | null>(null);
  const likingInFlight = useRef<Set<string>>(new Set());

  // Keep user ID in a ref to avoid stale closures in callbacks
  useEffect(() => {
    userIdRef.current = user?.id || null;
  }, [user]);

  const fetchPosts = useCallback(async () => {
    try {
      setLoading(true);

      // Single query against the public_posts view (pre-joins author profile data)
      const { data: postsData, error } = await supabase
        .from('public_posts' as any)
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      // Fetch dog names for posts that have a dog_id
      const dogIds = (postsData || []).map((p: any) => p.dog_id).filter(Boolean);
      const dogByIdMap = new Map<string, string>();
      if (dogIds.length > 0) {
        const { data: dogs } = await supabase
          .from('dogs')
          .select('id, name')
          .in('id', dogIds);
        dogs?.forEach((d: any) => dogByIdMap.set(d.id, d.name));
      }

      // Check which posts current user has liked
      let likedPostIds = new Set<string>();
      if (user) {
        const postIds = (postsData || []).map((p: any) => p.id);
        const { data: userLikes } = await supabase
          .from('post_likes')
          .select('post_id')
          .eq('user_id', user.id)
          .in('post_id', postIds);
        userLikes?.forEach((l: any) => likedPostIds.add(l.post_id));
      }

      const enrichedPosts = (postsData || []).map((p: any) => {
        const dogName = p.pup_name || (p.dog_id ? dogByIdMap.get(p.dog_id) : null) || null;
        return {
          ...p,
          author: {
            display_name: p.author_display_name,
            avatar_url: p.author_avatar_url,
          },
          likesCount: p.likes_count || 0,
          commentsCount: p.comments_count || 0,
          isLiked: likedPostIds.has(p.id),
          dogName,
          image_url: getPupImage(dogName, p.image_url),
        };
      });

      setPosts(enrichedPosts);
    } catch (e) {
      console.error('Error fetching posts:', e);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Initial fetch
  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  // Set up real-time subscriptions separately
  useEffect(() => {
    // Helper to fetch a new post with pre-joined author info from the view
    const fetchNewPost = async (post: Post) => {
      try {
        const { data: postRow } = await supabase
          .from('public_posts' as any)
          .select('*')
          .eq('id', post.id)
          .single();

        if (!postRow) return;

        const newPost: PostWithDetails = {
          ...(postRow as any),
          author: {
            display_name: (postRow as any).author_display_name,
            avatar_url: (postRow as any).author_avatar_url,
          },
          likesCount: (postRow as any).likes_count || 0,
          commentsCount: (postRow as any).comments_count || 0,
          isLiked: false,
          dogName: (postRow as any).pup_name || null,
        };

        // Mark as new for animation
        setNewPostIds(prev => new Set(prev).add(post.id));
        setPosts(prev => [newPost, ...prev]);
        
        // Remove from new posts after animation completes
        setTimeout(() => {
          setNewPostIds(prev => {
            const next = new Set(prev);
            next.delete(post.id);
            return next;
          });
        }, 600);
      } catch (e) {
        console.error('Error fetching new post:', e);
      }
    };

    // Create a channel for real-time updates
    const channel = supabase
      .channel('social-feed-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'posts' },
        (payload) => {
          console.log('Posts change detected:', payload.eventType);
          if (payload.eventType === 'INSERT') {
            fetchNewPost(payload.new as Post);
          } else if (payload.eventType === 'DELETE') {
            setPosts(prev => prev.filter(p => p.id !== (payload.old as Post).id));
          } else if (payload.eventType === 'UPDATE') {
            setPosts(prev => prev.map(p => 
              p.id === (payload.new as Post).id 
                ? { ...p, ...(payload.new as Post) }
                : p
            ));
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'post_likes' },
        (payload) => {
          console.log('Likes change detected:', payload.eventType);
          const postId = payload.eventType === 'DELETE' 
            ? (payload.old as { post_id: string }).post_id 
            : (payload.new as { post_id: string; user_id: string }).post_id;
          
          if (payload.eventType === 'INSERT') {
            const newLike = payload.new as { post_id: string; user_id: string };
            // Skip count update for current user — already handled optimistically
            if (newLike.user_id === userIdRef.current) return;
            setPosts(prev => prev.map(p => 
              p.id === postId 
                ? { ...p, likesCount: p.likesCount + 1 }
                : p
            ));
          } else if (payload.eventType === 'DELETE') {
            const oldLike = payload.old as { post_id: string; user_id: string };
            if (oldLike.user_id === userIdRef.current) return;
            setPosts(prev => prev.map(p => 
              p.id === postId 
                ? { ...p, likesCount: Math.max(0, p.likesCount - 1) }
                : p
            ));
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'post_comments' },
        (payload) => {
          console.log('Comments change detected:', payload.eventType);
          const postId = payload.eventType === 'DELETE' 
            ? (payload.old as { post_id: string }).post_id 
            : (payload.new as { post_id: string }).post_id;
          
          if (payload.eventType === 'INSERT') {
            setPosts(prev => prev.map(p => 
              p.id === postId ? { ...p, commentsCount: p.commentsCount + 1 } : p
            ));
          } else if (payload.eventType === 'DELETE') {
            setPosts(prev => prev.map(p => 
              p.id === postId ? { ...p, commentsCount: Math.max(0, p.commentsCount - 1) } : p
            ));
          }
        }
      )
      .subscribe((status) => {
        console.log('Real-time subscription status:', status);
      });

    channelRef.current = channel;

    // Cleanup subscription on unmount
    return () => {
      console.log('Cleaning up real-time subscription');
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, []); // Empty deps - subscription stays stable

  const createPost = async (content: string, imageUrl?: string, visibility: 'public' | 'private' = 'public', videoUrl?: string, authorDisplayName?: string, authorAvatarUrl?: string, dogId?: string) => {
    if (!user) return { error: new Error('Not authenticated') };

    // Snapshot the user's current profile data so future profile changes don't affect this post
    if (!authorAvatarUrl || !authorDisplayName) {
      const { data: prof } = await supabase
        .from('profiles')
        .select('avatar_url, display_name')
        .eq('id', user.id)
        .single();
      if (!authorAvatarUrl) authorAvatarUrl = prof?.avatar_url || undefined;
      if (!authorDisplayName) authorDisplayName = prof?.display_name || undefined;
    }

    // Snapshot dog name so it persists even if the dog record changes later
    let pupName: string | null = null;
    if (dogId) {
      const { data: dog } = await supabase
        .from('dogs')
        .select('name')
        .eq('id', dogId)
        .single();
      pupName = dog?.name || null;
    }

    const { error } = await supabase.from('posts').insert({
      author_id: user.id,
      content,
      image_url: imageUrl,
      video_url: videoUrl,
      visibility,
      author_display_name: authorDisplayName || null,
      author_avatar_url: authorAvatarUrl || null,
      dog_id: dogId || null,
      pup_name: pupName,
    } as any);

    if (!error) {
      await fetchPosts();
    }

    return { error };
  };

  const likePost = async (postId: string) => {
    if (!user) return { error: new Error('Not authenticated') };
    if (likingInFlight.current.has(postId)) return { error: null }; // prevent double-tap

    const post = posts.find(p => p.id === postId);
    if (!post) return { error: new Error('Post not found') };

    likingInFlight.current.add(postId);

    if (post.isLiked) {
      // Unlike
      const { error } = await supabase
        .from('post_likes')
        .delete()
        .eq('post_id', postId)
        .eq('user_id', user.id);

      likingInFlight.current.delete(postId);
      if (!error) {
        setPosts(prev =>
          prev.map(p =>
            p.id === postId
              ? { ...p, isLiked: false, likesCount: Math.max(0, p.likesCount - 1) }
              : p
          )
        );
      }

      return { error };
    } else {
      // Like
      const { error } = await supabase.from('post_likes').insert({
        post_id: postId,
        user_id: user.id
      });

      likingInFlight.current.delete(postId);
      if (!error) {
        setPosts(prev =>
          prev.map(p =>
            p.id === postId
              ? { ...p, isLiked: true, likesCount: p.likesCount + 1 }
              : p
          )
        );
      }

      return { error };
    }
  };

  const deletePost = async (postId: string) => {
    const { data, error } = await supabase
      .from('posts')
      .delete()
      .eq('id', postId)
      .select('id');

    if (error) return { error };

    // If trigger or policy silently blocked the delete, data will be empty
    if (!data || data.length === 0) {
      return { error: new Error('Post was not deleted. It may have already been removed or a database rule prevented deletion.') };
    }

    setPosts(prev => prev.filter(p => p.id !== postId));
    return { error: null };
  };

  // Clear a post from the new posts set (for manual control)
  const clearNewPost = useCallback((postId: string) => {
    setNewPostIds(prev => {
      const next = new Set(prev);
      next.delete(postId);
      return next;
    });
  }, []);

  return {
    posts,
    loading,
    newPostIds,
    clearNewPost,
    createPost,
    likePost,
    deletePost,
    refresh: fetchPosts
  };
}

export function usePostComments(postId: string | null) {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchComments = useCallback(async () => {
    if (!postId) return;

    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('post_comments')
        .select('*')
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Get author profiles from public_profiles view
      const authorIds = new Set<string>();
      data?.forEach((c: Comment) => authorIds.add(c.author_id));

      const { data: profiles } = await supabase
        .from('public_profiles')
        .select('id, display_name, avatar_url')
        .in('id', Array.from(authorIds));

      const profileMap = new Map<string, Profile>();
      profiles?.forEach((p: Profile) => profileMap.set(p.id, p));

      const enrichedComments = (data || []).map((c: Comment) => ({
        ...c,
        author: profileMap.get(c.author_id)
      }));

      setComments(enrichedComments);
    } catch (e) {
      console.error('Error fetching comments:', e);
    } finally {
      setLoading(false);
    }
  }, [postId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const addComment = async (body: string, imageUrl?: string | null) => {
    if (!user || !postId) return { error: new Error('Not ready') };

    const { error } = await supabase.from('post_comments').insert({
      post_id: postId,
      author_id: user.id,
      body,
      image_url: imageUrl || null,
    } as any);

    if (!error) {
      await fetchComments();
    }

    return { error };
  };

  const updateComment = async (commentId: string, body: string) => {
    if (!user || !postId) return { error: new Error('Not ready') };

    const { error } = await supabase
      .from('post_comments')
      .update({ body, updated_at: new Date().toISOString() })
      .eq('id', commentId)
      .eq('author_id', user.id);

    if (!error) {
      await fetchComments();
    }

    return { error };
  };

  return {
    comments,
    loading,
    addComment,
    updateComment,
    refresh: fetchComments
  };
}
