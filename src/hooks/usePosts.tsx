import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import type { PostImage, Profile } from '@/types';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface PostWithDetails {
  id: string;
  user_id: string;
  image_path: string;
  caption: string | null;
  visibility: string;
  created_at: string | null;
  updated_at: string;
  author?: Profile;
  likesCount: number;
  commentsCount: number;
  isLiked: boolean;
}

interface Comment {
  id: string;
  post_image_id: string;
  author_id: string;
  body: string;
  created_at: string | null;
  author?: Profile;
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

      // Fetch from post_images table
      let query = supabase
        .from('post_images')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (!user) {
        query = query.eq('visibility', 'public');
      }

      const { data: postsData, error } = await query;

      if (error) throw error;

      // Get unique user IDs (author IDs)
      const authorIds = new Set<string>();
      postsData?.forEach((p: any) => {
        if (p.user_id) authorIds.add(p.user_id);
      });

      // Fetch author profiles
      let profileMap = new Map<string, Profile>();
      if (authorIds.size > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('*')
          .in('id', Array.from(authorIds));

        profiles?.forEach((p: Profile) => profileMap.set(p.id, p));
      }

      // Get likes and comments count for each post
      const enrichedPosts = await Promise.all(
        (postsData || []).map(async (p: any) => {
          // Get likes count from post_image_likes
          const { count: likesCount } = await supabase
            .from('post_image_likes')
            .select('*', { count: 'exact', head: true })
            .eq('post_image_id', p.id);

          // Get comments count from post_image_comments
          const { count: commentsCount } = await supabase
            .from('post_image_comments')
            .select('*', { count: 'exact', head: true })
            .eq('post_image_id', p.id);

          // Check if current user liked this post
          let isLiked = false;
          if (user) {
            const { data: likeData } = await supabase
              .from('post_image_likes')
              .select('id')
              .eq('post_image_id', p.id)
              .eq('user_id', user.id)
              .single();
            isLiked = !!likeData;
          }

          return {
            id: p.id,
            user_id: p.user_id,
            image_path: p.image_path,
            caption: p.caption,
            visibility: p.visibility,
            created_at: p.created_at,
            updated_at: p.updated_at,
            author: p.user_id ? profileMap.get(p.user_id) : undefined,
            likesCount: likesCount || 0,
            commentsCount: commentsCount || 0,
            isLiked
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
    const fetchNewPost = async (post: any) => {
      try {
        let author: Profile | undefined;
        if (post.user_id) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', post.user_id)
            .single();
          author = profile || undefined;
        }

        const newPost: PostWithDetails = {
          id: post.id,
          user_id: post.user_id,
          image_path: post.image_path,
          caption: post.caption,
          visibility: post.visibility,
          created_at: post.created_at,
          updated_at: post.updated_at,
          author,
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
        { event: '*', schema: 'public', table: 'post_images' },
        (payload) => {
          console.log('Post images change detected:', payload.eventType);
          if (payload.eventType === 'INSERT') {
            fetchNewPost(payload.new);
          } else if (payload.eventType === 'DELETE') {
            setPosts(prev => prev.filter(p => p.id !== (payload.old as any).id));
          } else if (payload.eventType === 'UPDATE') {
            setPosts(prev => prev.map(p => 
              p.id === (payload.new as any).id 
                ? { ...p, ...(payload.new as any) }
                : p
            ));
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'post_image_likes' },
        (payload) => {
          console.log('Likes change detected:', payload.eventType);
          const postImageId = payload.eventType === 'DELETE' 
            ? (payload.old as { post_image_id: string }).post_image_id 
            : (payload.new as { post_image_id: string; user_id: string }).post_image_id;
          
          if (payload.eventType === 'INSERT') {
            const newLike = payload.new as { post_image_id: string; user_id: string };
            setPosts(prev => prev.map(p => 
              p.id === postImageId 
                ? { 
                    ...p, 
                    likesCount: p.likesCount + 1,
                    isLiked: userIdRef.current === newLike.user_id ? true : p.isLiked
                  }
                : p
            ));
          } else if (payload.eventType === 'DELETE') {
            const oldLike = payload.old as { post_image_id: string; user_id: string };
            setPosts(prev => prev.map(p => 
              p.id === postImageId 
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
        { event: '*', schema: 'public', table: 'post_image_comments' },
        (payload) => {
          console.log('Comments change detected:', payload.eventType);
          const postImageId = payload.eventType === 'DELETE' 
            ? (payload.old as { post_image_id: string }).post_image_id 
            : (payload.new as { post_image_id: string }).post_image_id;
          
          if (payload.eventType === 'INSERT') {
            setPosts(prev => prev.map(p => 
              p.id === postImageId ? { ...p, commentsCount: p.commentsCount + 1 } : p
            ));
          } else if (payload.eventType === 'DELETE') {
            setPosts(prev => prev.map(p => 
              p.id === postImageId ? { ...p, commentsCount: Math.max(0, p.commentsCount - 1) } : p
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

  const createPost = async (caption: string, imageUrl?: string, visibility: 'public' | 'private' = 'public') => {
    if (!user) return { error: new Error('Not authenticated') };

    const { error } = await supabase.from('post_images').insert({
      user_id: user.id,
      image_path: imageUrl || '',
      caption,
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
        .from('post_image_likes')
        .delete()
        .eq('post_image_id', postId)
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
      const { error } = await supabase.from('post_image_likes').insert({
        post_image_id: postId,
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
    const { error } = await supabase.from('post_images').delete().eq('id', postId);

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
        .from('post_image_comments')
        .select('*')
        .eq('post_image_id', postId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Get author profiles
      const authorIds = new Set<string>();
      data?.forEach((c: any) => authorIds.add(c.author_id));

      let profileMap = new Map<string, Profile>();
      if (authorIds.size > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('*')
          .in('id', Array.from(authorIds));

        profiles?.forEach((p: Profile) => profileMap.set(p.id, p));
      }

      const enrichedComments = (data || []).map((c: any) => ({
        id: c.id,
        post_image_id: c.post_image_id,
        author_id: c.author_id,
        body: c.body,
        created_at: c.created_at,
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

    const { error } = await supabase.from('post_image_comments').insert({
      post_image_id: postId,
      author_id: user.id,
      body
    });

    if (!error) {
      await fetchComments();
    }

    return { error };
  };

  return {
    comments,
    loading,
    addComment,
    refresh: fetchComments
  };
}
