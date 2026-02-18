import { useState, useRef } from 'react';
import { Plus, Image as ImageIcon, MapPin, Star, X, Camera, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useParks } from '@/hooks/useParks';
import { useImageUpload } from '@/hooks/useImageUpload';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import { ensureJpeg } from '@/lib/heic-convert';

interface CreatePostFormProps {
  onPost: (content: string, imageUrl?: string, isReview?: boolean, parkId?: string, rating?: number) => Promise<void>;
  isPosting: boolean;
}

// Interactive star rating input
function StarRatingInput({ 
  value, 
  onChange 
}: { 
  value: number; 
  onChange: (rating: number) => void;
}) {
  const [hoverValue, setHoverValue] = useState(0);
  
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          className="p-1 transition-transform hover:scale-110"
          onMouseEnter={() => setHoverValue(star)}
          onMouseLeave={() => setHoverValue(0)}
          onClick={() => onChange(star)}
        >
          <Star
            className={cn(
              "w-7 h-7 transition-colors",
              (hoverValue || value) >= star
                ? "fill-primary text-primary"
                : "text-muted-foreground/40 hover:text-primary/50"
            )}
          />
        </button>
      ))}
    </div>
  );
}

export default function CreatePostForm({ onPost, isPosting }: CreatePostFormProps) {
  const { allParks } = useParks();
  const { uploadImage, uploading } = useImageUpload();
  const [content, setContent] = useState('');
  const [isReview, setIsReview] = useState(false);
  const [selectedParkId, setSelectedParkId] = useState<string>('');
  const [rating, setRating] = useState(0);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawFile = e.target.files?.[0];
    if (rawFile) {
      try {
        setProcessing(true);
        const file = await ensureJpeg(rawFile, () => {
          toast({
            title: "Processing image... 📸",
            description: "Converting for best compatibility. One moment!",
          });
        });
        setImageFile(file);
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreviewImage(reader.result as string);
        };
        reader.readAsDataURL(file);
      } catch (err) {
        toast({
          title: "Image error",
          description: "Could not process this image. Please try a different one.",
          variant: "destructive",
        });
      } finally {
        setProcessing(false);
      }
    }
  };

  const removeImage = () => {
    setPreviewImage(null);
    setImageFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async () => {
    if (!content.trim()) return;
    if (isReview && (!selectedParkId || rating === 0)) return;
    
    let uploadedImageUrl: string | undefined;
    
    // Upload image to Supabase Storage if one was selected
    if (imageFile) {
      const { url, error } = await uploadImage(imageFile);
      if (error) {
        toast({
          title: "Upload failed",
          description: "Could not upload image. Please try again.",
          variant: "destructive",
        });
        return;
      }
      uploadedImageUrl = url || undefined;
    }
    
    await onPost(
      content.trim(),
      uploadedImageUrl,
      isReview,
      isReview ? selectedParkId : undefined,
      isReview ? rating : undefined
    );
    
    // Reset form
    setContent('');
    setIsReview(false);
    setSelectedParkId('');
    setRating(0);
    setPreviewImage(null);
    setImageFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const canPost = content.trim() && (!isReview || (selectedParkId && rating > 0));
  const isSubmitting = isPosting || uploading || processing;

  return (
    <Card className="p-4 bg-card border-2 border-primary/20 rounded-2xl shadow-sm">
      {/* Post Type Toggle */}
      <div className="flex items-center justify-between mb-3 pb-3 border-b border-border">
        <div className="flex items-center gap-2">
          <MapPin className={cn(
            "w-5 h-5 transition-colors",
            isReview ? "text-primary" : "text-muted-foreground"
          )} />
          <Label 
            htmlFor="review-toggle" 
            className={cn(
              "font-semibold cursor-pointer transition-colors",
              isReview ? "text-primary" : "text-muted-foreground"
            )}
          >
            Park Review
          </Label>
        </div>
        <Switch
          id="review-toggle"
          checked={isReview}
          onCheckedChange={setIsReview}
          className="data-[state=checked]:bg-primary"
        />
      </div>

      {/* Park Review Fields */}
      {isReview && (
        <div className="space-y-4 mb-4 p-3 bg-primary/5 rounded-xl border border-primary/20">
          {/* Park Selector */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-foreground flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-primary" />
              Select Park
            </Label>
            <Select value={selectedParkId} onValueChange={setSelectedParkId}>
              <SelectTrigger className="w-full bg-card border-primary/30 rounded-xl h-12">
                <SelectValue placeholder="Choose a dog park..." />
              </SelectTrigger>
              <SelectContent className="max-h-64">
                {allParks.length > 0 ? (
                  allParks.map((park) => (
                    <SelectItem key={park.id} value={park.id}>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-primary" />
                        {park.name}
                      </div>
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="no-parks" disabled>
                    No parks available
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Star Rating */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-foreground flex items-center gap-1.5">
              <Star className="w-4 h-4 text-primary" />
              Your Rating
            </Label>
            <StarRatingInput value={rating} onChange={setRating} />
          </div>
        </div>
      )}

      {/* Post Content */}
      <Textarea
        placeholder={isReview 
          ? "Share your experience at this park... What did your pup think? 🐾" 
          : "Share something with the pack... 🐾"
        }
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="min-h-[80px] resize-none border-0 p-0 focus-visible:ring-0 bg-transparent text-foreground"
      />

      {/* Image Preview */}
      {previewImage && (
        <div className="relative mt-3">
          <img
            src={previewImage}
            alt="Preview"
            className="rounded-xl w-full max-h-48 object-cover border border-border"
          />
          <button
            onClick={removeImage}
            className="absolute top-2 right-2 w-8 h-8 bg-destructive/90 hover:bg-destructive rounded-full flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4 text-destructive-foreground" />
          </button>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
        <div className="flex gap-1">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.heic,.heif"
            onChange={handleImageSelect}
            className="hidden"
          />
          <Button 
            type="button"
            variant="ghost" 
            size="sm" 
            className="text-muted-foreground hover:text-primary hover:bg-primary/10"
            onClick={() => fileInputRef.current?.click()}
          >
            <ImageIcon className="w-5 h-5" />
          </Button>
          <Button 
            type="button"
            variant="ghost" 
            size="sm" 
            className="text-muted-foreground hover:text-primary hover:bg-primary/10"
            onClick={() => fileInputRef.current?.click()}
          >
            <Camera className="w-5 h-5" />
          </Button>
        </div>
        <Button
          onClick={handleSubmit}
          disabled={!canPost || isSubmitting}
          className="rounded-full bg-primary hover:bg-primary/90 px-6"
        >
          {isSubmitting ? (
            <Loader2 className="w-4 h-4 mr-1 animate-spin" />
          ) : (
            <Plus className="w-4 h-4 mr-1" />
          )}
          {uploading ? 'Uploading...' : isReview ? 'Post Review' : 'Post'}
        </Button>
      </div>
    </Card>
  );
}
