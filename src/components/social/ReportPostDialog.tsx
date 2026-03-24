import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface ReportPostDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  postId: string | null;
  reporterId: string;
}

const REASONS = [
  'Spam',
  'Harassment or Bullying',
  'Inappropriate Content',
  'Animal Cruelty',
  'Other',
];

export default function ReportPostDialog({ open, onOpenChange, postId, reporterId }: ReportPostDialogProps) {
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!postId || !selectedReason) return;
    setSubmitting(true);

    const { error } = await supabase
      .from('content_reports' as any)
      .insert({ reporter_id: reporterId, post_id: postId, reason: selectedReason } as any);

    if (error) {
      toast.error('Failed to submit report');
    } else {
      toast.success('Report submitted', { description: 'Thank you for helping keep our community safe.' });
    }

    setSubmitting(false);
    setSelectedReason(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Report Post</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground mb-3">
          Why are you reporting this post? Select a reason below.
        </p>
        <div className="space-y-2">
          {REASONS.map((reason) => (
            <button
              key={reason}
              onClick={() => setSelectedReason(reason)}
              className={cn(
                "w-full text-left px-4 py-3 rounded-lg border text-sm font-medium transition-colors",
                selectedReason === reason
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border hover:bg-muted"
              )}
            >
              {reason}
            </button>
          ))}
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            disabled={!selectedReason || submitting}
            onClick={handleSubmit}
            variant="destructive"
          >
            {submitting ? 'Submitting…' : 'Submit Report'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
