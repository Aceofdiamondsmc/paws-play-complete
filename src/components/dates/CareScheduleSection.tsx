import { useState } from 'react';
import { format } from 'date-fns';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Heart, Clock, Bell, BellOff, PawPrint, Pill, UtensilsCrossed, Scissors, GraduationCap, ShoppingBag, Trash2, Plus, CheckCircle, AlertTriangle, Timer, Info, Stethoscope, Cake, CalendarIcon } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { useCareNotificationContext } from '@/components/CareNotificationProvider';
import { useCareHistory, type BagSize } from '@/hooks/useCareHistory';
import { FoodSupplyTracker, EnableFoodTrackerButton } from '@/components/dates/FoodSupplyTracker';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

// Generate time slots from 6 AM to 9 PM in 30-minute intervals
const TIME_SLOTS = Array.from({ length: 31 }, (_, i) => {
  const hour = Math.floor(i / 2) + 6;
  const minute = (i % 2) * 30;
  const time24 = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
  const hour12 = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const label = `${hour12}:${minute.toString().padStart(2, '0')} ${ampm}`;
  return { value: time24, label };
});

function getCategoryIcon(category: string) {
  switch (category) {
    case 'medication':
      return <Pill className="w-4 h-4 text-primary" />;
    case 'feeding':
      return <UtensilsCrossed className="w-4 h-4 text-primary" />;
    case 'grooming':
      return <Scissors className="w-4 h-4 text-primary" />;
    case 'training':
      return <GraduationCap className="w-4 h-4 text-primary" />;
    case 'restock':
      return <ShoppingBag className="w-4 h-4 text-primary" />;
    case 'vet_visit':
      return <Stethoscope className="w-4 h-4 text-primary" />;
    case 'birthday':
      return <Cake className="w-4 h-4 text-primary" />;
    default:
      return <PawPrint className="w-4 h-4 text-primary" />;
  }
}

function formatTime(time24: string): string {
  const [hours, minutes] = time24.split(':').map(Number);
  const hour12 = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
  const ampm = hours >= 12 ? 'PM' : 'AM';
  return `${hour12}:${minutes.toString().padStart(2, '0')} ${ampm}`;
}

function isReminderSnoozed(snoozedUntil: string | null): boolean {
  if (!snoozedUntil) return false;
  return new Date(snoozedUntil) > new Date();
}

export function CareScheduleSection() {
  const { 
    reminders, 
    loading: remindersLoading, 
    addReminder, 
    deleteReminder, 
    snoozeReminder,
    permissionStatus, 
    requestPermission, 
    triggeredReminder, 
    clearTriggeredReminder,
    missedMedications,
    hasMissedDose,
    clearMissedMedication 
  } = useCareNotificationContext();
  const [trackerEnabled, setTrackerEnabled] = useState(() => {
    const stored = localStorage.getItem('foodSupplyTrackerEnabled');
    return stored !== null ? stored === 'true' : true;
  });
  const [bagSize, setBagSize] = useState<BagSize>(() => {
    return (localStorage.getItem('foodSupplyBagSize') as BagSize) || 'standard';
  });

  const { history, loading: historyLoading, supplyStatus, logActivity, deleteEntry } = useCareHistory(bagSize);

  const [category, setCategory] = useState('walk');
  const [selectedTime, setSelectedTime] = useState('08:00');
  const [recurrence, setRecurrence] = useState('daily');
  const [taskDetails, setTaskDetails] = useState('');
  const [saving, setSaving] = useState(false);
  const [reminderDate, setReminderDate] = useState<Date>();

  const isDateCategory = category === 'vet_visit' || category === 'birthday';

  const handleToggleTracker = (enabled: boolean) => {
    setTrackerEnabled(enabled);
    localStorage.setItem('foodSupplyTrackerEnabled', String(enabled));
  };

  const handleBagSizeChange = (size: BagSize) => {
    setBagSize(size);
    localStorage.setItem('foodSupplyBagSize', size);
  };

  const handleSaveReminder = async () => {
    if (isDateCategory && !reminderDate) {
      toast.error('Please select a date');
      return;
    }
    setSaving(true);
    const { error } = await addReminder({
      reminder_time: `${selectedTime}:00`,
      is_recurring: isDateCategory ? false : recurrence !== 'none',
      recurrence_pattern: isDateCategory ? 'once' : recurrence,
      category,
      task_details: taskDetails || undefined,
      reminder_date: reminderDate ? format(reminderDate, 'yyyy-MM-dd') : undefined,
    });

    if (error) {
      toast.error('Failed to save reminder');
    } else {
      toast.success('Reminder saved!');
      setTaskDetails('');
      setReminderDate(undefined);
    }
    setSaving(false);
  };

  const handleDeleteReminder = async (id: string) => {
    const { error } = await deleteReminder(id);
    if (error) {
      toast.error('Failed to delete reminder');
    } else {
      toast.success('Reminder deleted');
    }
  };

  const handleSnoozeReminder = async (id: string) => {
    const { error } = await snoozeReminder(id);
    if (error) {
      toast.error('Failed to snooze reminder');
    } else {
      toast.success('Snoozed for 15 minutes');
      // Also clear the triggered reminder if it matches
      if (triggeredReminder?.id === id) {
        clearTriggeredReminder();
      }
    }
  };

  const handleLogActivity = async () => {
    if (!triggeredReminder) return;

    const { error } = await logActivity({
      category: triggeredReminder.category,
      task_details: triggeredReminder.task_details || undefined,
      notes: triggeredReminder.task_details || undefined,
      reminder_id: triggeredReminder.id,
    });

    if (error) {
      toast.error('Failed to log activity');
    } else {
      toast.success('Activity logged!');
      clearTriggeredReminder();
    }
  };

  const handleLogMissedMedication = async (reminderId: string, taskDetails: string | null) => {
    const { error } = await logActivity({
      category: 'medication',
      task_details: taskDetails || undefined,
      notes: taskDetails || undefined,
      reminder_id: reminderId,
    });

    if (error) {
      toast.error('Failed to log activity');
    } else {
      toast.success('Medication logged!');
      clearMissedMedication(reminderId);
    }
  };

  const handleSnoozeMissed = async (reminderId: string) => {
    const { error } = await snoozeReminder(reminderId);
    if (error) {
      toast.error('Failed to snooze');
    } else {
      toast.success('Snoozed for 15 minutes');
      clearMissedMedication(reminderId);
    }
  };

  const handleQuickLog = async (cat: string, details?: string) => {
    const { error } = await logActivity({
      category: cat,
      task_details: details,
      notes: details || (cat === 'walk' ? 'Walked' : undefined),
    });

    if (error) {
      toast.error('Failed to log activity');
    } else {
      toast.success('Activity logged!');
      // Auto-enable food tracker when logging restock actions
      if (cat === 'restock') {
        handleToggleTracker(true);
      }
    }
  };

  return (
    <Card className="p-5 bg-card mt-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5 bg-primary/10 rounded-xl p-4 -mx-1">
        <Heart className="w-6 h-6 text-primary" />
        <Clock className="w-6 h-6 text-primary" />
        <h2 className="text-2xl font-bold text-primary">Care Schedule</h2>
      </div>

      {/* Food Supply Tracker */}
      {trackerEnabled ? (
        <FoodSupplyTracker
          supplyStatus={supplyStatus}
          bagSize={bagSize}
          onBagSizeChange={handleBagSizeChange}
          onDismiss={() => handleToggleTracker(false)}
          onLogRestock={() => handleQuickLog('restock', 'Restocked')}
        />
      ) : (
        <div className="mb-4">
          <EnableFoodTrackerButton onClick={() => handleToggleTracker(true)} />
        </div>
      )}

      {/* Notification Permission Status */}
      {permissionStatus === 'granted' ? (
        <div className="mb-4 p-3 rounded-lg bg-primary/10 flex items-center gap-2">
          <Bell className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-primary">
            🔔 Notifications Active
          </span>
        </div>
      ) : permissionStatus === 'denied' ? (
        <div className="mb-4 p-3 rounded-lg bg-destructive/10 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-destructive">
            <BellOff className="w-4 h-4" />
            <span>Notifications Blocked</span>
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="w-4 h-4 text-destructive cursor-help" />
              </TooltipTrigger>
              <TooltipContent>
                <p>Enable in browser settings: Settings → Site Settings → Notifications</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      ) : (
        <div className="mb-4 p-3 rounded-lg bg-muted flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <BellOff className="w-4 h-4" />
            <span>Enable notifications for reminders</span>
          </div>
          <Button 
            size="sm" 
            variant="outline" 
            className="rounded-full" 
            onClick={async () => {
              const granted = await requestPermission();
              if (granted) {
                toast.success('Notifications enabled! You will be reminded for walks, meals, and medications.');
              } else {
                toast.error('Notifications were not enabled. You can enable them in browser settings.');
              }
            }}
          >
            <Bell className="w-4 h-4 mr-1" />
            Enable
          </Button>
        </div>
      )}

      {/* Missed Dose Alerts */}
      {missedMedications.map((missed) => (
        <div 
          key={missed.reminder_id} 
          className="mb-4 p-3 rounded-lg bg-destructive/10 border-2 border-destructive animate-pulse-urgent"
        >
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-5 h-5 text-destructive" />
            <span className="font-bold text-destructive">⚠️ Urgent: Missed Medication</span>
          </div>
          <p className="text-sm text-foreground mb-3">
            {missed.task_details || 'Medication'} was due 30 minutes ago!
          </p>
          <div className="flex gap-2">
            <Button 
              size="sm" 
              className="rounded-full animate-pulse-urgent" 
              onClick={() => handleLogMissedMedication(missed.reminder_id, missed.task_details)}
            >
              <CheckCircle className="w-4 h-4 mr-1" />
              Log Activity
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              className="rounded-full" 
              onClick={() => handleSnoozeMissed(missed.reminder_id)}
            >
              <Timer className="w-4 h-4 mr-1" />
              Snooze 15m
            </Button>
          </div>
        </div>
      ))}

      {/* Triggered Reminder Alert */}
      {triggeredReminder && (
        <div className="mb-4 p-3 rounded-lg bg-primary/10 border border-primary">
          <div className="flex items-center gap-2 mb-2">
            {getCategoryIcon(triggeredReminder.category)}
            <span className="font-medium">
              {triggeredReminder.category === 'walk' && 'Time for a walk!'}
              {triggeredReminder.category === 'medication' && `Time for ${triggeredReminder.task_details || 'medication'}`}
              {triggeredReminder.category === 'feeding' && `Time to feed: ${triggeredReminder.task_details || 'your pup'}`}
              {triggeredReminder.category === 'grooming' && 'Time for grooming!'}
              {triggeredReminder.category === 'training' && 'Time for training!'}
              {triggeredReminder.category === 'restock' && `Time to restock dog food!`}
              {triggeredReminder.category === 'vet_visit' && `🏥 Clinic/Urgent: ${triggeredReminder.task_details || 'Appointment today'}`}
              {triggeredReminder.category === 'birthday' && `🎂 ${triggeredReminder.task_details || "It's your pup's birthday!"}`}
            </span>
          </div>
          <div className="flex gap-2">
            <Button size="sm" className="rounded-full" onClick={handleLogActivity}>
              <CheckCircle className="w-4 h-4 mr-1" />
              Log Activity
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              className="rounded-full" 
              onClick={() => handleSnoozeReminder(triggeredReminder.id)}
            >
              <Timer className="w-4 h-4 mr-1" />
              Snooze 15m
            </Button>
          </div>
        </div>
      )}

      {/* Add Reminder Form */}
      <div className="space-y-4 mb-6">
        {/* Category Select */}
        <div className="space-y-2">
          <Label>Category</Label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="rounded-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="walk">
                <div className="flex items-center gap-2">
                  <PawPrint className="w-4 h-4" />
                  Walk
                </div>
              </SelectItem>
              <SelectItem value="medication">
                <div className="flex items-center gap-2">
                  <Pill className="w-4 h-4" />
                  Medication
                </div>
              </SelectItem>
              <SelectItem value="feeding">
                <div className="flex items-center gap-2">
                  <UtensilsCrossed className="w-4 h-4" />
                  Feeding
                </div>
              </SelectItem>
              <SelectItem value="grooming">
                <div className="flex items-center gap-2">
                  <Scissors className="w-4 h-4" />
                  Grooming
                </div>
              </SelectItem>
              <SelectItem value="training">
                <div className="flex items-center gap-2">
                  <GraduationCap className="w-4 h-4" />
                  Training
                </div>
              </SelectItem>
              <SelectItem value="restock">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4" />
                  Food Restock
                </div>
              </SelectItem>
              <SelectItem value="vet_visit">
                <div className="flex items-center gap-2">
                  <Stethoscope className="w-4 h-4" />
                  Clinic / Urgent
                </div>
              </SelectItem>
              <SelectItem value="birthday">
                <div className="flex items-center gap-2">
                  <Cake className="w-4 h-4" />
                  Birthday
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Time Select */}
        <div className="space-y-2">
          <Label>Time</Label>
          <Select value={selectedTime} onValueChange={setSelectedTime}>
            <SelectTrigger className="rounded-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TIME_SLOTS.map((slot) => (
                <SelectItem key={slot.value} value={slot.value}>
                  {slot.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Date Picker for date-specific categories */}
        {isDateCategory && (
          <div className="space-y-2">
            <Label>Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal rounded-full",
                    !reminderDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {reminderDate ? format(reminderDate, 'PPP') : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={reminderDate}
                  onSelect={setReminderDate}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
          </div>
        )}

        {/* Recurrence Toggle - hidden for date-specific categories */}
        {!isDateCategory && (
        <div className="space-y-2">
          <Label>Repeat</Label>
          <ToggleGroup type="single" value={recurrence} onValueChange={(val) => val && setRecurrence(val)} className="justify-start">
            <ToggleGroupItem value="daily" className="rounded-full">Daily</ToggleGroupItem>
            <ToggleGroupItem value="weekly" className="rounded-full">Weekly</ToggleGroupItem>
          </ToggleGroup>
        </div>
        )}

        {/* Conditional Task Details Input */}
        {(category === 'medication' || category === 'feeding' || category === 'grooming' || category === 'training' || category === 'restock' || category === 'vet_visit' || category === 'birthday') && (
          <div className="space-y-2">
            <Label>
              {category === 'medication' ? 'Medication Name & Dosage' : 
               category === 'feeding' ? 'Food Amount' :
               category === 'grooming' ? 'Grooming Details' : 
               category === 'training' ? 'Training Details' :
               category === 'vet_visit' ? 'Visit Details' :
               category === 'birthday' ? "Pup's Name" : 'Brand & Size'}
            </Label>
            <Input
              placeholder={
                category === 'medication' ? 'e.g., Apoquel 16mg' : 
                category === 'feeding' ? 'e.g., 1 cup kibble' :
                category === 'grooming' ? 'e.g., Nail trim, bath' : 
                category === 'training' ? 'e.g., Recall practice' :
                category === 'vet_visit' ? 'e.g., Annual vaccines, Dr. Smith' :
                category === 'birthday' ? "e.g., Max's Birthday" : 'e.g., 30lb bag Purina Pro Plan'
              }
              value={taskDetails}
              onChange={(e) => setTaskDetails(e.target.value)}
              className="rounded-full"
            />
          </div>
        )}

        {/* Save Button */}
        <Button onClick={handleSaveReminder} disabled={saving} className="w-full rounded-full">
          <Plus className="w-4 h-4 mr-1" />
          Save Reminder
        </Button>
      </div>

      {/* Active Reminders */}
      {reminders.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-muted-foreground mb-3">Active Reminders</h3>
          <div className="space-y-2">
            {reminders.map((reminder) => {
              const snoozed = isReminderSnoozed(reminder.snoozed_until);
              return (
                <div key={reminder.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-3">
                    {getCategoryIcon(reminder.category)}
                    <div>
                      <div className="font-medium flex items-center gap-2">
                        {reminder.reminder_date && (
                          <span className="text-xs font-semibold text-primary">
                            {format(new Date(reminder.reminder_date + 'T00:00:00'), 'MMM d')}
                          </span>
                        )}
                        {formatTime(reminder.reminder_time)}
                        <span className="text-xs text-muted-foreground capitalize">
                          {reminder.reminder_date ? 'Once' : reminder.recurrence_pattern}
                        </span>
                        {snoozed && (
                          <Badge variant="outline" className="text-xs bg-warning/20 text-warning border-warning/30">
                            <Timer className="w-3 h-3 mr-1" />
                            Snoozed
                          </Badge>
                        )}
                      </div>
                      {reminder.task_details && (
                        <div className="text-sm text-muted-foreground">{reminder.task_details}</div>
                      )}
                    </div>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => handleDeleteReminder(reminder.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Quick Log Buttons */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-muted-foreground mb-3">Quick Log</h3>
        <div className="flex gap-2 overflow-x-auto whitespace-nowrap scrollbar-hide pb-1 px-1">
          <Button variant="outline" size="sm" className="rounded-full" onClick={() => handleQuickLog('walk')}>
            <PawPrint className="w-4 h-4 mr-1" />
            Walk
          </Button>
          <Button variant="outline" size="sm" className="rounded-full" onClick={() => handleQuickLog('medication')}>
            <Pill className="w-4 h-4 mr-1" />
            Medication
          </Button>
          <Button variant="outline" size="sm" className="rounded-full" onClick={() => handleQuickLog('feeding')}>
            <UtensilsCrossed className="w-4 h-4 mr-1" />
            Feeding
          </Button>
          <Button variant="outline" size="sm" className="rounded-full" onClick={() => handleQuickLog('grooming')}>
            <Scissors className="w-4 h-4 mr-1" />
            Grooming
          </Button>
          <Button variant="outline" size="sm" className="rounded-full" onClick={() => handleQuickLog('training')}>
            <GraduationCap className="w-4 h-4 mr-1" />
            Training
          </Button>
          <Button variant="outline" size="sm" className="rounded-full" onClick={() => handleQuickLog('restock', 'Restocked')}>
            <ShoppingBag className="w-4 h-4 mr-1" />
            Food Restock
          </Button>
          <Button variant="outline" size="sm" className="rounded-full" onClick={() => handleQuickLog('restock', 'Out of stock')}>
            <AlertTriangle className="w-4 h-4 mr-1" />
            Out of Stock
          </Button>
          {!trackerEnabled && (
            <EnableFoodTrackerButton onClick={() => handleToggleTracker(true)} />
          )}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="mt-2">
        <h3 className="text-sm font-semibold text-muted-foreground mb-3">Recent Activity</h3>
        {historyLoading ? (
          <div className="flex justify-center py-4">
            <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
          </div>
        ) : history.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No activity logged yet</p>
        ) : (
          <div className="max-h-[300px] overflow-y-auto pr-2">
            <div className="space-y-2">
              {history.map((entry) => (
                <div key={entry.id} className="flex items-center gap-3 p-2 rounded-lg">
                  {getCategoryIcon(entry.category)}
                  <div className="flex-1">
                    <span className="text-sm">
                      {entry.category === 'walk' && 'Walked'}
                      {entry.category === 'medication' && (entry.task_details || entry.notes || 'Medication')}
                      {entry.category === 'feeding' && (entry.task_details || entry.notes || 'Fed')}
                      {entry.category === 'grooming' && (entry.task_details || entry.notes || 'Groomed')}
                      {entry.category === 'training' && (entry.task_details || entry.notes || 'Trained')}
                      {entry.category === 'restock' && (entry.task_details || entry.notes || 'Food Restocked')}
                      {entry.category === 'vet_visit' && (entry.task_details || entry.notes || 'Vet Visit')}
                      {entry.category === 'birthday' && (entry.task_details || entry.notes || 'Birthday')}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(entry.completed_at), { addSuffix: true })}
                  </span>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 text-muted-foreground hover:text-destructive"
                    onClick={async () => {
                      const { error } = await deleteEntry(entry.id);
                      if (error) {
                        toast.error('Failed to delete log');
                      } else {
                        toast.success('Log deleted');
                      }
                    }}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
