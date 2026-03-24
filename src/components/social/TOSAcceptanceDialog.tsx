import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface TOSAcceptanceDialogProps {
  open: boolean;
  userId: string;
  onAccepted: () => void;
}

export default function TOSAcceptanceDialog({ open, userId, onAccepted }: TOSAcceptanceDialogProps) {
  const [agreed, setAgreed] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleAccept = async () => {
    setSaving(true);
    const { error } = await supabase
      .from('profiles')
      .update({ tos_accepted_at: new Date().toISOString() } as any)
      .eq('id', userId);

    if (error) {
      toast.error('Failed to save. Please try again.');
      setSaving(false);
      return;
    }
    onAccepted();
  };

  return (
    <AlertDialog open={open}>
      <AlertDialogContent className="max-h-[85vh] overflow-y-auto">
        <AlertDialogHeader>
          <AlertDialogTitle>Community Guidelines & Terms</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3 text-sm text-muted-foreground">
              <p>Welcome to the Paws Play Repeat community! Before you begin, please review and accept our community standards.</p>

              <div className="rounded-lg border p-3 space-y-2 text-left">
                <h4 className="font-semibold text-foreground">Zero-Tolerance Policy</h4>
                <p>We maintain a <strong>zero-tolerance policy</strong> for objectionable content and abusive behavior. This includes but is not limited to:</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Harassment, bullying, or threats toward any user</li>
                  <li>Hate speech or discrimination of any kind</li>
                  <li>Sexually explicit or graphic violent content</li>
                  <li>Content that promotes animal cruelty or neglect</li>
                  <li>Spam, scams, or misleading information</li>
                  <li>Impersonation of other users</li>
                </ul>
              </div>

              <div className="rounded-lg border p-3 space-y-2 text-left">
                <h4 className="font-semibold text-foreground">Content Moderation</h4>
                <p>All user-generated content is subject to review. You can <strong>report</strong> or <strong>block</strong> any user or content that violates these guidelines. Violations may result in content removal and account termination without notice.</p>
              </div>

              <div className="rounded-lg border p-3 space-y-2 text-left">
                <h4 className="font-semibold text-foreground">Your Responsibilities</h4>
                <p>You are solely responsible for the content you post. By continuing, you agree to our <strong>Terms of Service</strong> and <strong>Privacy Policy</strong>, and confirm you will abide by these community guidelines.</p>
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="flex items-start gap-3 py-2">
          <Checkbox
            id="tos-agree"
            checked={agreed}
            onCheckedChange={(v) => setAgreed(v === true)}
          />
          <label htmlFor="tos-agree" className="text-sm font-medium leading-tight cursor-pointer">
            I have read and agree to the Community Guidelines, Terms of Service, and Privacy Policy.
          </label>
        </div>

        <AlertDialogFooter>
          <AlertDialogAction
            disabled={!agreed || saving}
            onClick={handleAccept}
          >
            {saving ? 'Saving…' : 'Accept & Continue'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
