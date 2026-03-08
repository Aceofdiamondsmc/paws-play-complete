import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { ShoppingBag, X, Package, AlertTriangle, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SupplyStatusInfo, BagSize } from '@/hooks/useCareHistory';

interface FoodSupplyTrackerProps {
  supplyStatus: SupplyStatusInfo;
  bagSize: BagSize;
  onBagSizeChange: (size: BagSize) => void;
  onDismiss: () => void;
}

export function FoodSupplyTracker({ supplyStatus, bagSize, onBagSizeChange, onDismiss }: FoodSupplyTrackerProps) {
  const { status, daysSince, lastEntry } = supplyStatus;

  if (status === 'unknown') {
    return (
      <Card className={cn('p-4 mb-4 border-2 transition-all duration-500 border-destructive/40 bg-gradient-to-r from-destructive/10 to-destructive/5 animate-pulse-urgent')}>
        {/* Top row: icon + text + dismiss */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-11 h-11 rounded-full flex items-center justify-center shrink-0 bg-destructive/15">
              <ShoppingBag className="w-5 h-5 text-destructive animate-pulse" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-sm">Food Supply Empty</span>
                <Badge variant="outline" className="text-[10px] px-2 py-0 font-medium bg-destructive/15 text-destructive border-destructive/30">
                  {bagSize === 'small' ? '~15 day supply' : '~30 day supply'}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">Log a restock to start tracking your supply</p>
            </div>
          </div>
          <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground shrink-0 -mt-1 -mr-1" onClick={onDismiss}>
            <X className="w-3.5 h-3.5" />
          </Button>
        </div>

        {/* Empty progress bar */}
        <div className="mt-3 mb-2">
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div className="h-full rounded-full transition-all duration-700 ease-out bg-destructive" style={{ width: '0%' }} />
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-[10px] text-muted-foreground">Full</span>
            <span className="text-[10px] text-muted-foreground">Empty</span>
          </div>
        </div>

        {/* Bag size toggle */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">Bag Size:</span>
          <ToggleGroup
            type="single"
            value={bagSize}
            onValueChange={(val) => val && onBagSizeChange(val as BagSize)}
            className="gap-1"
          >
            <ToggleGroupItem value="standard" className="rounded-full h-6 px-3 text-[11px] data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">
              Standard
            </ToggleGroupItem>
            <ToggleGroupItem value="small" className="rounded-full h-6 px-3 text-[11px] data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">
              Small Bag
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      </Card>
    );
  }

  const maxDays = bagSize === 'small' ? 15 : 30;
  const progressPercent = daysSince !== null ? Math.max(0, Math.min(100, ((maxDays - daysSince) / maxDays) * 100)) : 100;

  const statusConfig = {
    stocked: {
      label: 'Stocked',
      subtitle: `Restocked ${daysSince} day${daysSince !== 1 ? 's' : ''} ago`,
      icon: CheckCircle,
      cardClass: 'border-success/30 bg-gradient-to-r from-success/10 to-success/5',
      iconBgClass: 'bg-success/15',
      iconClass: 'text-success',
      barClass: 'bg-success',
      badgeClass: 'bg-success/15 text-success border-success/30',
    },
    low: {
      label: 'Running Low',
      subtitle: `Restocked ${daysSince} day${daysSince !== 1 ? 's' : ''} ago`,
      icon: AlertTriangle,
      cardClass: 'border-warning/30 bg-gradient-to-r from-warning/10 to-warning/5',
      iconBgClass: 'bg-warning/15',
      iconClass: 'text-warning',
      barClass: 'bg-warning',
      badgeClass: 'bg-warning/15 text-warning border-warning/30',
    },
    out: {
      label: lastEntry?.task_details === 'Out of stock' ? 'Out of Stock!' : 'Time to Restock!',
      subtitle: lastEntry?.task_details === 'Out of stock'
        ? 'You marked as out of stock'
        : `Last restocked ${daysSince} day${daysSince !== 1 ? 's' : ''} ago`,
      icon: ShoppingBag,
      cardClass: 'border-destructive/40 bg-gradient-to-r from-destructive/10 to-destructive/5 animate-pulse-urgent',
      iconBgClass: 'bg-destructive/15',
      iconClass: 'text-destructive animate-pulse',
      barClass: 'bg-destructive',
      badgeClass: 'bg-destructive/15 text-destructive border-destructive/30',
    },
  } as const;

  const config = statusConfig[status as keyof typeof statusConfig];
  if (!config) return null;

  const StatusIcon = config.icon;
  const brandInfo = lastEntry?.task_details && lastEntry.task_details !== 'Out of stock' && lastEntry.task_details !== 'Restocked'
    ? lastEntry.task_details
    : null;

  return (
    <Card className={cn('p-4 mb-4 border-2 transition-all duration-500', config.cardClass)}>
      {/* Top row: icon + text + dismiss */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className={cn('w-11 h-11 rounded-full flex items-center justify-center shrink-0', config.iconBgClass)}>
            <StatusIcon className={cn('w-5 h-5', config.iconClass)} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-sm">{config.label}</span>
              <Badge variant="outline" className={cn('text-[10px] px-2 py-0 font-medium', config.badgeClass)}>
                {bagSize === 'small' ? '~15 day supply' : '~30 day supply'}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">{config.subtitle}</p>
            {brandInfo && (
              <p className="text-xs text-muted-foreground/70 mt-0.5 truncate">
                Last: {brandInfo}
              </p>
            )}
          </div>
        </div>
        <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground shrink-0 -mt-1 -mr-1" onClick={onDismiss}>
          <X className="w-3.5 h-3.5" />
        </Button>
      </div>

      {/* Progress bar */}
      <div className="mt-3 mb-2">
        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <div
            className={cn('h-full rounded-full transition-all duration-700 ease-out', config.barClass)}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-[10px] text-muted-foreground">Full</span>
          <span className="text-[10px] text-muted-foreground">Empty</span>
        </div>
      </div>

      {/* Bag size toggle */}
      <div className="flex items-center gap-2">
        <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">Bag Size:</span>
        <ToggleGroup
          type="single"
          value={bagSize}
          onValueChange={(val) => val && onBagSizeChange(val as BagSize)}
          className="gap-1"
        >
          <ToggleGroupItem value="standard" className="rounded-full h-6 px-3 text-[11px] data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">
            Standard
          </ToggleGroupItem>
          <ToggleGroupItem value="small" className="rounded-full h-6 px-3 text-[11px] data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">
            Small Bag
          </ToggleGroupItem>
        </ToggleGroup>
      </div>
    </Card>
  );
}

export function EnableFoodTrackerButton({ onClick }: { onClick: () => void }) {
  return (
    <Button
      variant="outline"
      size="sm"
      className="rounded-full border-dashed text-muted-foreground hover:text-foreground"
      onClick={onClick}
    >
      <ShoppingBag className="w-4 h-4 mr-1" />
      Enable Food Supply Tracker
    </Button>
  );
}
