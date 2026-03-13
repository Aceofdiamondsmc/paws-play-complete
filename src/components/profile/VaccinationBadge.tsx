import { ShieldCheck } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';

interface VaccinationBadgeProps {
  certified: boolean | null | undefined;
  size?: number;
}

export function VaccinationBadge({ certified, size = 16 }: VaccinationBadgeProps) {
  if (!certified) return null;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <ShieldCheck
            className="inline-block text-emerald-500 shrink-0"
            size={size}
          />
        </TooltipTrigger>
        <TooltipContent>
          <p>Owner Certified</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
