import { useState, useRef } from 'react';
import { Send, Loader2, MessageCircle, Pencil, X, Check, ImagePlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { usePostComments } from '@/hooks/usePosts';
import { useAuth } from '@/hooks/useAuth';
import { useImageUpload } from '@/hooks/useImageUpload';
import { toast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';

interface CommentsDrawerProps {
  postId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function CommentsDrawer({ postId, open, onOpenChange }: CommentsDrawerProps) {
  const { user } = useAuth();
  const { comments, loading, addComment, updateComment } = usePostComments(postId);
  const { uploadImage, uploading } = useImageUpload();
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [saving, setSaving] = useState(false);
  const [pendingImageUrl, setPendingImageUrl] = useState<string | null>(null);
  const [fullViewImage, setFullViewImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast({ title: "Not logged in", description: "Please log in to comment.", variant: "destructive" });
      return;
    }
    if (!newComment.trim() && !pendingImageUrl) return;

    setSubmitting(true);
    const { error } = await addComment(newComment.trim(), pendingImageUrl);
    setSubmitting(false);

    if (error) {
      toast({ title: "Error", description: "Could not post comment. Please try again.", variant: "destructive" });
    } else {
      setNewComment('');
      setPendingImageUrl(null);
    }
  };

  const handleEditClick = (commentId: string, body: string, imageUrl?: string | null) => {
    setEditingCommentId(commentId);
    setEditText(body);
    setPendingImageUrl(imageUrl || null);
    setTimeout(() => document.getElementById('comment-input')?.focus(), 50);
  };

  const handleCancelEdit = () => {
    setEditingCommentId(null);
    setEditText('');
    setPendingImageUrl(null);
  };

  const handleSaveEdit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!editingCommentId || (!editText.trim() && !pendingImageUrl)) return;

    setSaving(true);
    const { error } = await updateComment(editingCommentId, editText.trim(), pendingImageUrl);
    setSaving(false);

    if (error) {
      toast({ title: "Error", description: "Could not update comment. Please try again.", variant: "destructive" });
    } else {
      setEditingCommentId(null);
      setEditText('');
      setPendingImageUrl(null);
    }
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

    const { url, error } = await uploadImage(file, 'post-images');
    if (error || !url) {
      toast({ title: "Upload failed", description: "Could not upload image. Please try again.", variant: "destructive" });
      return;
    }
    setPendingImageUrl(url);
  };

  const isEdited = (createdAt: string | null, updatedAt: string | null) => {
    if (!createdAt || !updatedAt) return false;
    return new Date(updatedAt) > new Date(createdAt);
  };

  const isBusy = submitting || saving || uploading;

  return (
    <>
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="h-[80vh] flex flex-col">
          <DrawerHeader className="border-b border-border pb-4 shrink-0">
            <DrawerTitle className="flex items-center gap-2 text-xl font-bold text-foreground">
              <MessageCircle className="w-5 h-5 text-primary" />
              Comments
            </DrawerTitle>
          </DrawerHeader>

          {/* Scrollable Comments Area */}
          <div className="flex-1 overflow-y-auto overscroll-contain p-4 min-h-0">
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : comments.length === 0 ? (
              <div className="text-center py-8">
                <MessageCircle className="w-12 h-12 mx-auto text-muted-foreground/40 mb-3" />
                <p className="text-muted-foreground">No comments yet</p>
                <p className="text-sm text-muted-foreground/70">Be the first to comment!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {comments.map((comment) => (
                  <div key={comment.id} className="flex gap-3">
                    <Avatar className="w-9 h-9 border border-primary/20 shrink-0">
                      <AvatarImage src={comment.author?.avatar_url || undefined} />
                      <AvatarFallback className="bg-primary/10 text-primary text-sm font-bold">
                        {comment.author?.display_name?.[0]?.toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="bg-muted/50 rounded-2xl px-4 py-2.5">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-semibold text-foreground text-sm">
                            {comment.author?.display_name || 'Anonymous'}
                          </span>
                          {user && user.id === comment.author_id && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
                              onClick={() => handleEditClick(comment.id, comment.body, (comment as any).image_url)}
                            >
                              <Pencil className="w-3 h-3 mr-1" />
                              Edit
                            </Button>
                          )}
                        </div>
                        <p className="text-foreground text-sm mt-0.5 whitespace-pre-wrap">
                          {comment.body}
                        </p>
                        {(comment as any).image_url && (
                          <img
                            src={(comment as any).image_url}
                            alt="Comment image"
                            className="mt-2 rounded-lg max-w-full max-h-48 object-cover cursor-pointer"
                            onClick={() => setFullViewImage((comment as any).image_url)}
                          />
                        )}
                      </div>
                      <div className="flex items-center gap-2 ml-2 mt-1">
                        <span className="text-xs text-muted-foreground">
                          {comment.created_at
                            ? formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })
                            : 'Just now'}
                        </span>
                        {isEdited(comment.created_at, (comment as any).updated_at) && (
                          <span className="text-xs text-muted-foreground/70 italic">(edited)</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sticky Comment Input */}
          <div className="p-4 border-t border-border bg-background shrink-0 pb-[env(safe-area-inset-bottom)]">
            {user ? (
              <div className="space-y-1">
                {editingCommentId && (
                  <div className="flex items-center gap-1 px-2 text-xs text-muted-foreground">
                    <Pencil className="w-3 h-3" />
                    <span>Editing</span>
                    <span>·</span>
                    <button type="button" className="text-primary hover:underline" onClick={handleCancelEdit}>
                      Cancel
                    </button>
                  </div>
                )}

                {/* Image preview */}
                {pendingImageUrl && (
                  <div className="relative inline-block ml-2">
                    <img src={pendingImageUrl} alt="Pending" className="w-12 h-12 rounded-lg object-cover border border-border" />
                    <button
                      type="button"
                      onClick={() => setPendingImageUrl(null)}
                      className="absolute -top-1.5 -right-1.5 bg-destructive text-destructive-foreground rounded-full w-5 h-5 flex items-center justify-center"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}

                <form onSubmit={editingCommentId ? handleSaveEdit : handleSubmit} className="flex gap-2 items-center">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,.heic,.heif"
                    className="hidden"
                    onChange={handleImageSelect}
                  />
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    disabled={isBusy}
                    className="shrink-0 h-9 w-9 text-muted-foreground hover:text-primary"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImagePlus className="w-4 h-4" />}
                  </Button>
                  <Input
                    id="comment-input"
                    placeholder={editingCommentId ? "Edit your comment..." : "Write a comment..."}
                    value={editingCommentId ? editText : newComment}
                    onChange={(e) => editingCommentId ? setEditText(e.target.value) : setNewComment(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Escape' && editingCommentId) handleCancelEdit(); }}
                    disabled={isBusy}
                    className="flex-1 rounded-full border-primary/20 focus:border-primary"
                  />
                  <Button
                    type="submit"
                    size="icon"
                    disabled={editingCommentId ? (isBusy || (!editText.trim() && !pendingImageUrl)) : (isBusy || (!newComment.trim() && !pendingImageUrl))}
                    className="rounded-full bg-primary hover:bg-primary/90 shrink-0"
                  >
                    {isBusy ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : editingCommentId ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </Button>
                </form>
              </div>
            ) : (
              <p className="text-center text-muted-foreground text-sm py-2">
                Log in to add a comment
              </p>
            )}
          </div>
        </DrawerContent>
      </Drawer>

      {/* Full-size image viewer */}
      {fullViewImage && (
        <div
          className="fixed inset-0 z-[200] bg-black/80 flex items-center justify-center p-4"
          onClick={() => setFullViewImage(null)}
        >
          <button
            className="absolute top-4 right-4 text-white/80 hover:text-white"
            onClick={() => setFullViewImage(null)}
          >
            <X className="w-8 h-8" />
          </button>
          <img src={fullViewImage} alt="Full view" className="max-w-full max-h-full rounded-lg object-contain" />
        </div>
      )}
    </>
  );
}
