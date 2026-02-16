import { useState, useEffect, useRef } from 'react';
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
import { useImageUpload } from '@/hooks/useImageUpload';
import { Upload, Loader2, X } from 'lucide-react';

interface AdminEditPostModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  postId: string | null;
  initialContent: string;
  initialPupName: string;
  initialImageUrl: string;
  initialLikesCount?: number;
  initialCommentsCount?: number;
  onPostUpdated: () => void;
}

export default function AdminEditPostModal({
  open,
  onOpenChange,
  postId,
  initialContent,
  initialPupName,
  initialImageUrl,
  initialLikesCount = 0,
  initialCommentsCount = 0,
  onPostUpdated,
}: AdminEditPostModalProps) {
  const [content, setContent] = useState(initialContent);
  const [pupName, setPupName] = useState(initialPupName);
  const [imageUrl, setImageUrl] = useState(initialImageUrl);
  const [likesCount, setLikesCount] = useState(initialLikesCount);
  const [commentsCount, setCommentsCount] = useState(initialCommentsCount);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { uploadImage, uploading } = useImageUpload();
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setContent(initialContent);
      setPupName(initialPupName);
      setImageUrl(initialImageUrl);
      setLikesCount(initialLikesCount);
      setCommentsCount(initialCommentsCount);
    }
  }, [open, initialContent, initialPupName, initialImageUrl, initialLikesCount, initialCommentsCount]);

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
          likes_count: likesCount,
          comments_count: commentsCount,
          updated_at: new Date().toISOString(),
        } as any)
        .eq('id', postId);

      if (error) throw error;

      toast.success('Post Updated Successfully!');
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
            <Label>Image</Label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const { url, error } = await uploadImage(file, 'post-images');
                if (error) {
                  toast.error(error.message || 'Upload failed');
                } else if (url) {
                  setImageUrl(url);
                }
                if (fileInputRef.current) fileInputRef.current.value = '';
              }}
            />
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                {uploading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
                {uploading ? 'Uploading...' : 'Upload Image'}
              </Button>
              {imageUrl && (
                <Button type="button" variant="ghost" size="icon" onClick={() => setImageUrl('')} className="h-8 w-8">
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            <Input
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="Or paste an image URL..."
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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="admin-likes-count">Likes Count</Label>
              <Input
                id="admin-likes-count"
                type="number"
                min={0}
                value={likesCount}
                onChange={(e) => setLikesCount(Math.max(0, parseInt(e.target.value) || 0))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="admin-comments-count">Comments Count</Label>
              <Input
                id="admin-comments-count"
                type="number"
                min={0}
                value={commentsCount}
                onChange={(e) => setCommentsCount(Math.max(0, parseInt(e.target.value) || 0))}
              />
            </div>
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
