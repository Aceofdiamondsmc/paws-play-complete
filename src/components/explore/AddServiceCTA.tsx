import { useNavigate } from 'react-router-dom';
import { Store, BadgeCheck, Star, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

const isNative = !!(window as any).Capacitor?.isNativePlatform?.();

export function AddServiceCTA() {
  const navigate = useNavigate();

  return (
    <Card className="overflow-hidden bg-gradient-to-br from-primary/10 via-primary/5 to-background border-primary/20">
      <div className="p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-full bg-primary/20">
            <Store className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h3 className="font-bold text-lg">Own a Pet Business?</h3>
            <p className="text-sm text-muted-foreground">Get listed in our directory</p>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <BadgeCheck className="w-4 h-4 text-success" />
            <span>Reach thousands of local pet owners</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Star className="w-4 h-4 text-warning" />
            <span>Featured placement options available</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <ArrowRight className="w-4 h-4 text-primary" />
            <span>Easy setup, instant visibility</span>
          </div>
        </div>

        <Button 
          onClick={() => navigate(isNative ? '/plans' : '/submit-service')}
          className="w-full group"
        >
          <Store className="w-4 h-4 mr-2" />
          {isNative ? 'See Plans' : 'Add Your Service'}
          <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
        </Button>

        <p className="text-xs text-center text-muted-foreground">
          {isNative ? 'View subscription options' : 'Starting at $9.99/month'}
        </p>
      </div>
    </Card>
  );
}
