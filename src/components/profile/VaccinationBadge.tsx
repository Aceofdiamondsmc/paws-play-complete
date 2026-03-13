import { ShieldCheck } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';

interface VaccinationBadgeProps {
  certified: boolean | null | undefined;
  vetVerified?: boolean | null | undefined;
  size?: number;
}

export function VaccinationBadge({ certified, vetVerified, size = 16 }: VaccinationBadgeProps) {
  if (!certified && !vetVerified) return null;

  const isVetVerified = !!vetVerified;
  const label = isVetVerified ? 'Vet Verified' : 'Owner Certified';
  const colorClass = isVetVerified ? 'text-emerald-500' : 'text-amber-500';

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <ShieldCheck
            className={`inline-block ${colorClass} shrink-0`}
            size={size}
          />
        </TooltipTrigger>
        <TooltipContent>
          <p>{label}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
