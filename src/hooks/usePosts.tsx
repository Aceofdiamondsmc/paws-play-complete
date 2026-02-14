import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import type { Post, Profile } from '@/types';
import type { RealtimeChannel } from '@supabase/supabase-js';

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

  // Keep user ID in a ref to avoid stale closures in callbacks
  useEffect(() => {
    userIdRef.current = user?.id || null;
  }, [user]);

  const fetchPosts = useCallback(async () => {
    try {
      setLoading(true);

      // Fetch all posts (RLS policies will control visibility)
      const { data: postsData, error } = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      // Get unique author IDs
      const authorIds = new Set<string>();
      postsData?.forEach((p: Post) => authorIds.add(p.author_id));

      // Fetch author profiles from profiles_safe view (publicly readable)
      const { data: profiles } = await supabase
        .from('profiles_safe')
        .select('*')
        .in('id', Array.from(authorIds));

      const profileMap = new Map<string, Profile>();
      profiles?.forEach((p: any) => profileMap.set(p.id, p as Profile));

      // Fetch dogs for all authors to get real dog names
      const { data: dogs } = await supabase
        .from('dogs')
        .select('id, owner_id, name')
        .in('owner_id', Array.from(authorIds));

      // Map dog_id -> dog name, and owner_id -> first dog name
      const dogByIdMap = new Map<string, string>();
      const dogByOwnerMap = new Map<string, string>();
      dogs?.forEach((d: any) => {
        dogByIdMap.set(d.id, d.name);
        if (!dogByOwnerMap.has(d.owner_id)) {
          dogByOwnerMap.set(d.owner_id, d.name);
        }
      });

      // Get likes and comments count for each post
      const enrichedPosts = await Promise.all(
        (postsData || []).map(async (p: Post) => {
          // Get likes count
          const { count: likesCount } = await supabase
            .from('post_likes')
            .select('*', { count: 'exact', head: true })
            .eq('post_id', p.id);

          // Get comments count
          const { count: commentsCount } = await supabase
            .from('post_comments')
            .select('*', { count: 'exact', head: true })
            .eq('post_id', p.id);

          // Check if current user liked this post
          let isLiked = false;
          if (user) {
            const { data: likeData } = await supabase
              .from('post_likes')
              .select('id')
              .eq('post_id', p.id)
              .eq('user_id', user.id)
              .single();
            isLiked = !!likeData;
          }

          return {
            ...p,
            author: profileMap.get(p.author_id),
            likesCount: likesCount || 0,
            commentsCount: commentsCount || 0,
            isLiked,
            dogName: p.pup_name || (p.dog_id ? dogByIdMap.get(p.dog_id) : dogByOwnerMap.get(p.author_id)) || null,
          };
        })
      );

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
    // Helper to fetch a new post with author info
    const fetchNewPost = async (post: Post) => {
      try {
        const { data: profile } = await supabase
          .from('profiles_safe')
          .select('*')
          .eq('id', post.author_id)
          .single();

        const newPost: PostWithDetails = {
          ...post,
          author: profile || undefined,
          likesCount: 0,
          commentsCount: 0,
          isLiked: false
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
            setPosts(prev => prev.map(p => 
              p.id === postId 
                ? { 
                    ...p, 
                    likesCount: p.likesCount + 1,
                    isLiked: userIdRef.current === newLike.user_id ? true : p.isLiked
                  }
                : p
            ));
          } else if (payload.eventType === 'DELETE') {
            const oldLike = payload.old as { post_id: string; user_id: string };
            setPosts(prev => prev.map(p => 
              p.id === postId 
                ? { 
                    ...p, 
                    likesCount: Math.max(0, p.likesCount - 1),
                    isLiked: userIdRef.current === oldLike.user_id ? false : p.isLiked
                  }
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

  const createPost = async (content: string, imageUrl?: string, visibility: 'public' | 'private' = 'public') => {
    if (!user) return { error: new Error('Not authenticated') };

    const { error } = await supabase.from('posts').insert({
      author_id: user.id,
      content,
      image_url: imageUrl,
      visibility
    });

    if (!error) {
      await fetchPosts();
    }

    return { error };
  };

  const likePost = async (postId: string) => {
    if (!user) return { error: new Error('Not authenticated') };

    const post = posts.find(p => p.id === postId);
    if (!post) return { error: new Error('Post not found') };

    if (post.isLiked) {
      // Unlike
      const { error } = await supabase
        .from('post_likes')
        .delete()
        .eq('post_id', postId)
        .eq('user_id', user.id);

      if (!error) {
        setPosts(prev =>
          prev.map(p =>
            p.id === postId
              ? { ...p, isLiked: false, likesCount: p.likesCount - 1 }
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
    const { error } = await supabase.from('posts').delete().eq('id', postId);

    if (!error) {
      setPosts(prev => prev.filter(p => p.id !== postId));
    }

    return { error };
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

      // Get author profiles from profiles_safe view (publicly readable)
      const authorIds = new Set<string>();
      data?.forEach((c: Comment) => authorIds.add(c.author_id));

      const { data: profiles } = await supabase
        .from('profiles_safe')
        .select('*')
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

  const addComment = async (body: string) => {
    if (!user || !postId) return { error: new Error('Not ready') };

    const { error } = await supabase.from('post_comments').insert({
      post_id: postId,
      author_id: user.id,
      body
    });

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
