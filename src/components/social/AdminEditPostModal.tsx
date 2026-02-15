import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AdminEditPostModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  postId: string | null;
  initialContent: string;
  initialPupName: string;
  initialImageUrl: string;
  onPostUpdated: () => void;
}

export default function AdminEditPostModal({
  open,
  onOpenChange,
  postId,
  initialContent,
  initialPupName,
  initialImageUrl,
  onPostUpdated,
}: AdminEditPostModalProps) {
  const [content, setContent] = useState(initialContent);
  const [pupName, setPupName] = useState(initialPupName);
  const [imageUrl, setImageUrl] = useState(initialImageUrl);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setContent(initialContent);
      setPupName(initialPupName);
      setImageUrl(initialImageUrl);
    }
  }, [open, initialContent, initialPupName, initialImageUrl]);

  const handleSave = async () => {
    if (!postId || !content.trim()) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('posts')
        .update({
          content: content.trim(),
          pup_name: pupName.trim() || null,
          image_url: imageUrl.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', postId);

      if (error) throw error;

      toast.success('Post updated!');
      onPostUpdated();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error updating post:', error);
      toast.error(error.message || 'Failed to update post');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span>Admin Edit Post</span>
          </DialogTitle>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="admin-content">Content</Label>
            <Textarea
              id="admin-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Post content..."
              className="min-h-[100px] resize-none"
              maxLength={1000}
            />
            <p className="text-xs text-muted-foreground text-right">
              {content.length}/1000
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="admin-pup-name">Pup Name</Label>
            <Input
              id="admin-pup-name"
              value={pupName}
              onChange={(e) => setPupName(e.target.value)}
              placeholder="e.g. Bella, Max, Ace..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="admin-image-url">Image URL</Label>
            <Input
              id="admin-image-url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://..."
            />
            {imageUrl && (
              <img
                src={imageUrl}
                alt="Preview"
                className="mt-2 rounded-lg max-h-40 object-cover w-full border border-border"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            )}
          </div>
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSubmitting || !content.trim()}
          >
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
