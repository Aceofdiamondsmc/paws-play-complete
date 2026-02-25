import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { useToast } from '@/hooks/use-toast';
import { Trash2, Pencil, Search, Loader2, Image as ImageIcon, Video } from 'lucide-react';
import { format } from 'date-fns';
import AdminEditPostModal from '@/components/social/AdminEditPostModal';

interface Post {
  id: string;
  author_id: string;
  content: string;
  image_url: string | null;
  video_url: string | null;
  pup_name: string | null;
  author_display_name: string | null;
  likes_count: number;
  comments_count: number;
  visibility: string;
  created_at: string | null;
}

interface Profile {
  id: string;
  display_name: string | null;
  username: string | null;
  
}

export default function AdminSocial() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [posts, setPosts] = useState<Post[]>([]);
  const [profiles, setProfiles] = useState<Map<string, Profile>>(new Map());
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<Post | null>(null);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      // Admin reads from base posts table (not public_posts view) to see ALL posts
      // including private/non-public ones. Write operations also target base tables.
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPosts(data || []);

      // Fetch author profiles
      const authorIds = [...new Set((data || []).map(p => p.author_id))];
      if (authorIds.length > 0) {
        const { data: profileData } = await supabase
          .from('public_profiles')
          .select('id, display_name')
          .in('id', authorIds);

        const profileMap = new Map<string, Profile>();
        (profileData || []).forEach(p => profileMap.set(p.id!, p as Profile));
        setProfiles(profileMap);
      }
    } catch (error: any) {
      console.error('Error fetching posts:', error);
      toast({
        title: 'Error',
        description: 'Failed to load posts',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const getAuthorName = (post: Post) => {
    if (post.author_display_name) return post.author_display_name;
    const profile = profiles.get(post.author_id);
    if (!profile) return post.author_id.slice(0, 8) + '...';
    return profile.display_name || profile.username || 'Anonymous';
  };

  const filteredPosts = posts.filter(post =>
    post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
    getAuthorName(post).toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleOpenDelete = (post: Post) => {
    setSelectedPost(post);
    setIsDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!selectedPost) return;
    const postId = selectedPost.id;

    setIsDeleting(true);
    setIsDeleteDialogOpen(false);
    setSelectedPost(null);

    try {
      const { data, error } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId)
        .select('id');

      if (error) throw error;

      if (!data || data.length === 0) {
        throw new Error('Post was not deleted — a database rule may have blocked it.');
      }

      setPosts(prev => prev.filter(p => p.id !== postId));
      toast({ title: 'Success', description: 'Post deleted successfully' });
    } catch (error: any) {
      console.error('Delete error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete post',
        variant: 'destructive',
      });
      fetchPosts();
    } finally {
      setIsDeleting(false);
    }
    queryClient.invalidateQueries({ queryKey: ['posts'] });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Social Posts Management</h1>
          <p className="text-muted-foreground">{posts.length} posts total</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search posts by content or author..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Posts Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Author</TableHead>
                <TableHead>Content</TableHead>
                <TableHead className="hidden md:table-cell">Image</TableHead>
                <TableHead className="hidden sm:table-cell">Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPosts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    {searchQuery ? 'No posts match your search' : 'No posts found'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredPosts.map((post) => (
                  <TableRow key={post.id}>
                    <TableCell>
                      <div className="font-medium">{getAuthorName(post)}</div>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-[200px] truncate text-sm">
                        {post.content}
                      </div>
                      <div className="text-xs text-muted-foreground sm:hidden mt-1">
                        {post.created_at ? format(new Date(post.created_at), 'MMM d, yyyy') : '—'}
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {post.video_url ? (
                        <div className="w-16 h-16 rounded-md overflow-hidden bg-muted flex items-center justify-center">
                          <Video className="h-6 w-6 text-primary" />
                        </div>
                      ) : post.image_url ? (
                        <div className="w-16 h-16 rounded-md overflow-hidden bg-muted">
                          <AspectRatio ratio={1}>
                            <img
                              src={post.image_url}
                              alt="Post image"
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                          </AspectRatio>
                        </div>
                      ) : (
                        <div className="w-16 h-16 rounded-md bg-muted flex items-center justify-center">
                          <ImageIcon className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <div className="text-sm text-muted-foreground">
                        {post.created_at ? format(new Date(post.created_at), 'MMM d, yyyy') : '—'}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {post.created_at ? format(new Date(post.created_at), 'h:mm a') : ''}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setEditingPost(post);
                            setEditModalOpen(true);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenDelete(post)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Post</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this post by {selectedPost ? getAuthorName(selectedPost) : ''}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete} 
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {/* Edit Post Modal */}
      <AdminEditPostModal
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        postId={editingPost?.id ?? null}
        initialContent={editingPost?.content ?? ''}
        initialPupName={editingPost?.pup_name ?? ''}
        initialImageUrl={editingPost?.image_url ?? ''}
        initialAuthorName={editingPost?.author_display_name || (editingPost ? getAuthorName(editingPost) : '')}
        initialVideoUrl={editingPost?.video_url ?? ''}
        initialLikesCount={editingPost?.likes_count ?? 0}
        initialCommentsCount={editingPost?.comments_count ?? 0}
        onPostUpdated={fetchPosts}
      />
    </div>
  );
}
