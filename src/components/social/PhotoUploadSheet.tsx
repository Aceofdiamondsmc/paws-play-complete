import { useState, useRef } from 'react';
import { Camera, FolderOpen, X, Loader2, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
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
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { ensureJpeg } from '@/lib/heic-convert';

const CAMERA_HINT_KEY = 'ppr_camera_hint_seen';
const GALLERY_HINT_KEY = 'ppr_gallery_hint_seen';

interface PhotoUploadSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPostCreated: () => void;
}

export default function PhotoUploadSheet({ open, onOpenChange, onPostCreated }: PhotoUploadSheetProps) {
  const { user } = useAuth();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [isVideo, setIsVideo] = useState(false);
  const [caption, setCaption] = useState('');
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [cameraDialogOpen, setCameraDialogOpen] = useState(false);
  const [galleryDialogOpen, setGalleryDialogOpen] = useState(false);
  
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const handleCameraClick = () => {
    if (!localStorage.getItem(CAMERA_HINT_KEY)) {
      setCameraDialogOpen(true);
    } else {
      cameraInputRef.current?.click();
    }
  };

  const handleCameraContinue = () => {
    localStorage.setItem(CAMERA_HINT_KEY, '1');
    setCameraDialogOpen(false);
    setTimeout(() => cameraInputRef.current?.click(), 100);
  };

  const handleGalleryClick = () => {
    if (!localStorage.getItem(GALLERY_HINT_KEY)) {
      setGalleryDialogOpen(true);
    } else {
      galleryInputRef.current?.click();
    }
  };

  const handleGalleryContinue = () => {
    localStorage.setItem(GALLERY_HINT_KEY, '1');
    setGalleryDialogOpen(false);
    setTimeout(() => galleryInputRef.current?.click(), 100);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileIsVideo = file.type.startsWith('video/');
    const ext = file.name.split('.').pop()?.toLowerCase();

    // Validate type
    if (!fileIsVideo && !file.type.startsWith('image/') && ext !== 'heic' && ext !== 'heif') {
      toast({ title: "Invalid file type", description: "Please select an image or video file.", variant: "destructive" });
      return;
    }

    // Validate size
    const maxSize = fileIsVideo ? 50 * 1024 * 1024 : 10 * 1024 * 1024;
    if (file.size > maxSize) {
      toast({ title: "File too large", description: fileIsVideo ? "Videos must be under 50MB." : "Images must be under 10MB.", variant: "destructive" });
      return;
    }

    try {
      setProcessing(true);
      setIsVideo(fileIsVideo);

      if (fileIsVideo) {
        setMediaFile(file);
        setPreviewUrl(URL.createObjectURL(file));
      } else {
        const converted = await ensureJpeg(file, () => {
          toast({ title: "Processing image... 📸", description: "Converting for best compatibility. One moment!" });
        });
        setMediaFile(converted);
        const reader = new FileReader();
        reader.onloadend = () => setPreviewUrl(reader.result as string);
        reader.readAsDataURL(converted);
      }
    } catch (err) {
      toast({ title: "File error", description: "Could not process this file. Please try a different one.", variant: "destructive" });
    } finally {
      setProcessing(false);
    }
  };

  const removeMedia = () => {
    if (previewUrl && isVideo) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setMediaFile(null);
    setIsVideo(false);
    if (cameraInputRef.current) cameraInputRef.current.value = '';
    if (galleryInputRef.current) galleryInputRef.current.value = '';
  };

  const resetForm = () => {
    removeMedia();
    setCaption('');
    setUploadProgress(0);
  };

  const handleSubmit = async () => {
    if (!user) {
      toast({ title: "Not logged in", description: "Please log in to create a post.", variant: "destructive" });
      return;
    }
    if (!mediaFile && !caption.trim()) {
      toast({ title: "Nothing to post", description: "Please add media or a caption.", variant: "destructive" });
      return;
    }

    try {
      setUploading(true);
      setUploadProgress(10);

      let imageUrl: string | null = null;
      let videoUrl: string | null = null;

      if (mediaFile) {
        setUploadProgress(15);
        const fileToUpload = isVideo ? mediaFile : await ensureJpeg(mediaFile);
        setUploadProgress(25);

        const fileExt = fileToUpload.name.split('.').pop()?.toLowerCase() || (isVideo ? 'mp4' : 'jpg');
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
        const filePath = `${user.id}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('post-images')
          .upload(filePath, fileToUpload, { cacheControl: '3600', upsert: false });

        setUploadProgress(60);
        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage.from('post-images').getPublicUrl(filePath);
        
        if (isVideo) {
          videoUrl = publicUrl;
        } else {
          imageUrl = publicUrl;
        }
        setUploadProgress(80);
      }

      const { error: postError } = await supabase.from('posts').insert({
        author_id: user.id,
        content: caption.trim() || (isVideo ? '🎬' : '📸'),
        image_url: imageUrl,
        video_url: videoUrl,
        visibility: 'public',
      } as any);

      setUploadProgress(100);
      if (postError) throw postError;

      toast({ title: "Posted! 🐾", description: "Your post is now live." });
      resetForm();
      onOpenChange(false);
      onPostCreated();
    } catch (error) {
      console.error('Upload error:', error);
      toast({ title: "Upload failed", description: "Could not create post. Please try again.", variant: "destructive" });
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <>
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[90vh]">
        <DrawerHeader className="border-b border-border pb-4">
          <DrawerTitle className="text-xl font-bold text-foreground">Create Post</DrawerTitle>
          <DrawerDescription className="text-muted-foreground">Share a photo or video with the pack</DrawerDescription>
        </DrawerHeader>

        <div className="p-4 space-y-4 overflow-y-auto">
          {previewUrl ? (
            <div className="relative">
              {isVideo ? (
                <video src={previewUrl} controls playsInline preload="metadata" className="rounded-xl w-full max-h-64 object-cover border-2 border-primary/20" />
              ) : (
                <img src={previewUrl} alt="Preview" className="rounded-xl w-full max-h-64 object-cover border-2 border-primary/20" />
              )}
              <button onClick={removeMedia} disabled={uploading} className="absolute top-2 right-2 w-8 h-8 bg-destructive/90 hover:bg-destructive rounded-full flex items-center justify-center transition-colors">
                <X className="w-4 h-4 text-destructive-foreground" />
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <input ref={cameraInputRef} type="file" accept="image/*,video/*,.heic,.heif" capture="environment" onChange={handleFileSelect} className="hidden" />
              <Button variant="outline" className="h-32 flex-col gap-3 border-2 border-dashed border-primary/30 hover:border-primary hover:bg-primary/5 rounded-xl" onClick={handleCameraClick}>
                <Camera className="w-8 h-8 text-primary" />
                <span className="text-sm font-medium text-foreground">Camera</span>
              </Button>

              <input ref={galleryInputRef} type="file" accept="image/*,video/*,.heic,.heif" onChange={handleFileSelect} className="hidden" />
              <Button variant="outline" className="h-32 flex-col gap-3 border-2 border-dashed border-primary/30 hover:border-primary hover:bg-primary/5 rounded-xl" onClick={handleGalleryClick}>
                <FolderOpen className="w-8 h-8 text-primary" />
                <span className="text-sm font-medium text-foreground">Photo Library / File</span>
              </Button>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Caption (optional)</label>
            <Textarea placeholder="What's your pup up to? 🐾" value={caption} onChange={(e) => setCaption(e.target.value)} disabled={uploading} className="min-h-[80px] resize-none border-primary/20 focus:border-primary rounded-xl" />
          </div>

          {uploading && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Uploading...</span>
              </div>
              <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-primary transition-all duration-300 ease-out rounded-full" style={{ width: `${uploadProgress}%` }} />
              </div>
            </div>
          )}
        </div>

        <DrawerFooter className="border-t border-border pt-4">
          <Button
            onClick={handleSubmit}
            disabled={uploading || processing || (!mediaFile && !caption.trim())}
            className={cn("w-full rounded-full font-bold py-6", "bg-[hsl(165,40%,45%)] hover:bg-[hsl(165,40%,40%)]")}
          >
            {uploading || processing ? (
              <><Loader2 className="w-5 h-5 mr-2 animate-spin" />{processing ? 'Processing...' : 'Posting...'}</>
            ) : (
              <><Send className="w-5 h-5 mr-2" />Share with Pack</>
            )}
          </Button>
          <DrawerClose asChild>
            <Button variant="ghost" disabled={uploading || processing} className="rounded-full">Cancel</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>

    <AlertDialog open={cameraDialogOpen} onOpenChange={setCameraDialogOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>📸 Camera Access</AlertDialogTitle>
          <AlertDialogDescription>
            Paws Play needs access to your camera to take photos and videos. Your browser may ask for permission after you continue.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleCameraContinue}>Continue</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>

    <AlertDialog open={galleryDialogOpen} onOpenChange={setGalleryDialogOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>🖼️ Photo Library / File</AlertDialogTitle>
          <AlertDialogDescription>
            Photos and files you select will be uploaded and shared with the pack.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleGalleryContinue}>Continue</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
}
