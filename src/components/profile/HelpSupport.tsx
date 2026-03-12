import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Search, CreditCard, Mail } from 'lucide-react';
import { useSubscription } from '@/hooks/useSubscription';

interface HelpSupportProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function HelpSupport({ open, onOpenChange }: HelpSupportProps) {
  const { manageSubscription, isSubscribed, isTrialing } = useSubscription();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[85vh] rounded-t-2xl">
        <SheetHeader className="pb-2">
          <SheetTitle>Help & Support</SheetTitle>
          <SheetDescription>
            Learn how the Pack keeps your pup safe.
          </SheetDescription>
        </SheetHeader>
        <ScrollArea className="h-[calc(85vh-180px)]">
          <Accordion type="single" collapsible className="w-full px-1">
            {/* Pack Alert */}
            <AccordionItem value="pack-alert">
              <AccordionTrigger className="text-left">
                <span className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-destructive shrink-0" />
                  How to Send a Pack Alert
                </span>
              </AccordionTrigger>
              <AccordionContent className="space-y-3 text-muted-foreground">
                <p>
                  If your dog ever goes missing, you can broadcast a <strong className="text-foreground">Pack Alert</strong> to every user in your area with one tap.
                </p>
                <ol className="list-decimal list-inside space-y-2">
                  <li>
                    <strong className="text-foreground">Hit the SOS Button</strong> — the red paw-shaped alert button on your home screen.
                  </li>
                  <li>
                    <strong className="text-foreground">Broadcast to the Pack</strong> — your dog's photo, description, and last-seen location are sent instantly to all nearby neighbors.
                  </li>
                  <li>
                    <strong className="text-foreground">Printable Flyers</strong> — the app automatically generates a professional "Missing Dog" flyer with a QR code, ready for you to print and post in minutes.
                  </li>
                  <li>
                    <strong className="text-foreground">Community Search</strong> — neighbors can contact you directly through the app if they spot your pup.
                  </li>
                </ol>
                <div className="bg-muted rounded-xl p-3 text-sm">
                  <strong className="text-foreground">💡 Tip:</strong> Keep your dog's profile photo updated so the alert is as effective as possible!
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Paws Alert */}
            <AccordionItem value="paws-alert">
              <AccordionTrigger className="text-left">
                <span className="flex items-center gap-2">
                  <Search className="w-4 h-4 text-primary shrink-0" />
                  What is a Paws Alert?
                </span>
              </AccordionTrigger>
              <AccordionContent className="space-y-3 text-muted-foreground">
                <p>
                  A <strong className="text-foreground">Paws Alert</strong> is a community search notification. When a nearby dog goes missing, you'll receive an alert with:
                </p>
                <ul className="list-disc list-inside space-y-1">
                  <li>The dog's photo and description</li>
                  <li>Last-seen location on a map</li>
                  <li>Owner's contact information (via secure in-app messaging)</li>
                </ul>
                <p>
                  If you spot the missing pup, tap the <strong className="text-foreground">"Contact Owner"</strong> button to share sightings securely — your private phone number is never shared.
                </p>
              </AccordionContent>
            </AccordionItem>

            {/* Subscription */}
            <AccordionItem value="subscription">
              <AccordionTrigger className="text-left">
                <span className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-accent shrink-0" />
                  Managing Your Subscription
                </span>
              </AccordionTrigger>
              <AccordionContent className="space-y-3 text-muted-foreground">
                <p>
                  {isSubscribed
                    ? isTrialing
                      ? "You're currently on a free trial. Manage your trial or upgrade anytime."
                      : "You have an active subscription. Manage billing, update your payment method, or cancel anytime."
                    : "Upgrade to unlock premium features like extended Pack Alert radius and priority support."}
                </p>
                <Button
                  variant="outline"
                  className="w-full rounded-full"
                  onClick={() => manageSubscription()}
                >
                  <CreditCard className="w-4 h-4 mr-2" />
                  Manage Subscription
                </Button>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </ScrollArea>

        {/* Contact Support */}
        <div className="px-1 pt-3 border-t">
          <Button
            variant="outline"
            className="w-full rounded-full"
            asChild
          >
            <a href="mailto:info@pawsplayrepeat.app">
              <Mail className="w-4 h-4 mr-2" />
              Contact Support
            </a>
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
