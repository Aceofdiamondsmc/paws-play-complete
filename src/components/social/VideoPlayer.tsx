import { useState, useEffect } from 'react';
import { PlayCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VideoPlayerProps {
  src: string;
  className?: string;
}

export default function VideoPlayer({ src, className }: VideoPlayerProps) {
  const [poster, setPoster] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const video = document.createElement('video');
    video.crossOrigin = 'anonymous';
    video.muted = true;
    video.preload = 'metadata';
    video.src = src;

    const handleSeeked = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0);
          setPoster(canvas.toDataURL('image/jpeg', 0.8));
        }
      } catch {
        // CORS or other error – fallback gradient will show
      }
      video.remove();
    };

    const handleLoaded = () => {
      video.currentTime = 0.5;
    };

    video.addEventListener('loadeddata', handleLoaded);
    video.addEventListener('seeked', handleSeeked);
    video.addEventListener('error', () => video.remove());
    video.load();

    return () => {
      video.removeEventListener('loadeddata', handleLoaded);
      video.removeEventListener('seeked', handleSeeked);
      video.remove();
    };
  }, [src]);

  if (playing) {
    return (
      <video
        src={src}
        controls
        autoPlay
        playsInline
        className={cn('w-full max-h-[500px] object-contain bg-black', className)}
      />
    );
  }

  return (
    <button
      onClick={() => setPlaying(true)}
      className="relative w-full cursor-pointer group"
      aria-label="Play video"
    >
      {poster ? (
        <img
          src={poster}
          alt="Video thumbnail"
          className="w-full max-h-[500px] object-contain bg-black"
        />
      ) : (
        <div className="w-full aspect-video bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center" />
      )}
      <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/30 transition-colors">
        <PlayCircle className="w-16 h-16 text-white drop-shadow-lg opacity-90 group-hover:opacity-100 group-hover:scale-110 transition-all" />
      </div>
    </button>
  );
}
