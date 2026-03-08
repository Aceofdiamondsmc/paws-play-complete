import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarDays, Clock, MapPin, Check, X, Plus, Dog, Send, Inbox, ShieldBan, MessageSquare, Trash2, CheckCircle, Utensils, Lock, Package } from 'lucide-react';
import { CareScheduleSection } from '@/components/dates/CareScheduleSection';
import { BlockUserDialog } from '@/components/dates/BlockUserDialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { usePlaydates } from '@/hooks/usePlaydates';
import { useBlockedUsers } from '@/hooks/useBlockedUsers';
import { useMessages } from '@/hooks/useMessages';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';
import { toast } from 'sonner';
import datesBackground from '@/assets/dates-background.jpg';

export default function Dates() {
  const navigate = useNavigate();
  const { user, dogs } = useAuth();
  const { blockUser } = useBlockedUsers();
  const { startConversation } = useMessages();
  const { 
    pendingPlaydates, 
    incomingPendingPlaydates,
    outgoingPendingPlaydates,
    acceptedPlaydates, 
    playdates, 
    loading, 
    updatePlaydateStatus,
    acceptPlaydate,
    cancelPlaydate,
    deletePlaydate,
    clearHistory,
    refresh
  } = usePlaydates();

  const [blockTarget, setBlockTarget] = useState<{ id: string; name?: string } | null>(null);

  const handleBlockConfirm = async (reason?: string) => {
    if (!blockTarget) return;
    const { error } = await blockUser(blockTarget.id, reason);
    if (error) {
      toast.error('Failed to block user');
    } else {
      toast.success('User blocked. Their requests have been declined.');
      refresh();
    }
    setBlockTarget(null);
  };

  const handleAccept = async (playdateId: string) => {
    const { error } = await acceptPlaydate(playdateId);
    if (error) {
      toast.error(error.message || 'Failed to accept playdate');
    } else {
      toast.success('Playdate accepted! Check your Booked tab.');
    }
  };

  const handleDecline = async (playdateId: string) => {
    const { error } = await updatePlaydateStatus(playdateId, 'declined');
    if (error) {
      toast.error(error.message || 'Failed to decline playdate');
    } else {
      toast.info('Playdate declined');
    }
  };

  const handleCancel = async (playdateId: string) => {
    const { error } = await cancelPlaydate(playdateId);
    if (error) {
      toast.error(error.message || 'Failed to cancel playdate');
    } else {
      toast.success('Playdate cancelled');
    }
  };

  const handleMessage = async (otherUserId: string) => {
    const { conversation, error } = await startConversation(otherUserId);
    if (error) {
      toast.error('Failed to start conversation');
      return;
    }
    if (conversation) {
      navigate(`/me?chat=${conversation.id}`);
    }
  };

  const handleDeletePlaydate = async (playdateId: string) => {
    const { error } = await deletePlaydate(playdateId);
    if (error) {
      toast.error('Failed to remove playdate');
    } else {
      toast.success('Playdate removed');
    }
  };

  if (!user) {
    return (
      <div 
        className="min-h-screen flex flex-col items-center justify-start pt-24 p-4 bg-cover bg-center bg-no-repeat relative overflow-hidden"
        style={{ backgroundImage: `url(${datesBackground})` }}
      >
        {/* Feature Preview Card — floating glassmorphic teaser */}
        <div 
          className="absolute top-6 left-4 w-48 rounded-2xl border border-white/25 bg-white/15 backdrop-blur-xl shadow-2xl p-3 space-y-2.5 pointer-events-none select-none z-10"
          style={{ animation: 'float 3s ease-in-out infinite' }}
        >
          {/* Mini Food Supply row */}
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-400 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold text-white/90 leading-none mb-1">Food Supply</p>
              <div className="h-1.5 rounded-full bg-white/20 overflow-hidden">
                <div className="h-full w-[85%] rounded-full bg-green-400" />
              </div>
            </div>
            <span className="text-[9px] font-semibold text-green-400">Stocked</span>
          </div>

          {/* Mini Reminder row */}
          <div className="flex items-center gap-2">
            <Dog className="w-3.5 h-3.5 text-amber-300 shrink-0" />
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-white/90 leading-none">Walk</p>
              <p className="text-[9px] text-white/50">7:00 AM · Daily</p>
            </div>
          </div>

          {/* Category chip */}
          <div className="flex gap-1.5">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/10 border border-white/15">
              <Package className="w-3 h-3 text-white/60" />
              <span className="text-[9px] text-white/60 font-medium">Food Restock</span>
            </span>
          </div>

          {/* Unlock overlay */}
          <div className="absolute inset-x-0 bottom-0 h-10 rounded-b-2xl bg-gradient-to-t from-black/40 to-transparent flex items-end justify-center pb-1.5 gap-1">
            <Lock className="w-3 h-3 text-white/60" />
            <span className="text-[9px] text-white/60 font-medium">Sign in to unlock</span>
          </div>
        </div>

        {/* Playdate Preview Card — right side */}
        <div 
          className="absolute top-6 right-4 w-44 rounded-2xl border border-white/25 bg-white/15 backdrop-blur-xl shadow-2xl p-3 space-y-2.5 pointer-events-none select-none z-10"
          style={{ animation: 'float-right 3s ease-in-out infinite' }}
        >
          {/* Mini dog avatars */}
          <div className="flex items-center gap-2">
            <div className="flex -space-x-2">
              <div className="w-7 h-7 rounded-full bg-primary/80 ring-2 ring-white/30 flex items-center justify-center text-[10px]">🐕</div>
              <div className="w-7 h-7 rounded-full bg-accent/80 ring-2 ring-white/30 flex items-center justify-center text-[10px]">🐾</div>
            </div>
            <p className="text-[10px] font-bold text-white/90 leading-tight">Bella & Max</p>
          </div>

          {/* Date & time row */}
          <div className="flex items-center gap-3 text-[9px] text-white/70">
            <div className="flex items-center gap-1">
              <CalendarDays className="w-3 h-3 text-white/60" />
              <span>Mar 15</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-white/60" />
              <span>2:00 PM</span>
            </div>
          </div>

          {/* Location row */}
          <div className="flex items-center gap-1.5">
            <MapPin className="w-3 h-3 text-white/60 shrink-0" />
            <span className="text-[9px] text-white/70 truncate">Central Bark Park</span>
          </div>

          {/* Accepted chip */}
          <div className="flex">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-400/20 border border-green-400/30">
              <Check className="w-3 h-3 text-green-400" />
              <span className="text-[9px] text-green-400 font-semibold">Playdate Accepted</span>
            </span>
          </div>

          {/* Unlock overlay */}
          <div className="absolute inset-x-0 bottom-0 h-10 rounded-b-2xl bg-gradient-to-t from-black/40 to-transparent flex items-end justify-center pb-1.5 gap-1">
            <Lock className="w-3 h-3 text-white/60" />
            <span className="text-[9px] text-white/60 font-medium">Sign in to unlock</span>
          </div>
        </div>

        {/* Main CTA */}
        <div className="text-center z-10">
          <div className="w-20 h-20 mx-auto mb-6 border-2 border-primary rounded-lg flex items-center justify-center bg-transparent">
            <CalendarDays className="w-12 h-12 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-3 drop-shadow-lg">Sign In Required</h1>
          <p className="text-white/90 text-lg drop-shadow-md mb-6">
            Please sign in to view your playdate requests
            <br />
            & reminders
          </p>
          <Button className="rounded-full px-8 text-base" size="lg" onClick={() => navigate('/me')}>
            Sign In / Sign Up
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border p-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <CalendarDays className="w-6 h-6 text-primary" />
          Playdates
        </h1>
        <Button size="sm" className="rounded-full">
          <Plus className="w-4 h-4 mr-1" />
          New
        </Button>
      </div>

      <Tabs defaultValue="all" className="p-4">
        <TabsList className="grid w-full grid-cols-3 rounded-full h-12">
          <TabsTrigger value="pending" className="rounded-full">
            Pending
            {pendingPlaydates.length > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 bg-primary text-primary-foreground text-xs rounded-full">
                {pendingPlaydates.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="booked" className="rounded-full">Booked</TabsTrigger>
          <TabsTrigger value="all" className="rounded-full">All</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-4 space-y-4">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
            </div>
          ) : pendingPlaydates.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Dog className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No pending playdate requests</p>
            </div>
          ) : (
            <>
              {/* Incoming Requests - Show Accept/Decline */}
              {incomingPendingPlaydates.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                    <Inbox className="w-4 h-4" />
                    Incoming Requests
                  </h3>
                  {incomingPendingPlaydates.map(playdate => (
                    <PlaydateCard
                      key={playdate.id}
                      playdate={playdate}
                      onAccept={() => handleAccept(playdate.id)}
                      onDecline={() => handleDecline(playdate.id)}
                      onBlock={() => setBlockTarget({
                        id: playdate.requester_id,
                        name: playdate.requesterProfile?.display_name || undefined,
                      })}
                      showActions
                      isIncoming
                    />
                  ))}
                </div>
              )}

              {/* Outgoing Requests - No actions, just status */}
              {outgoingPendingPlaydates.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                    <Send className="w-4 h-4" />
                    Sent Requests
                  </h3>
                  {outgoingPendingPlaydates.map(playdate => (
                    <PlaydateCard
                      key={playdate.id}
                      playdate={playdate}
                      isOutgoing
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="booked" className="mt-4 space-y-3">
          {acceptedPlaydates.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <CalendarDays className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No upcoming playdates</p>
            </div>
          ) : (
          acceptedPlaydates.map(playdate => {
              const otherUserId = playdate.requester_id === user?.id
                ? playdate.receiverDog?.owner_id
                : playdate.requester_id;
              return (
                <PlaydateCard
                  key={playdate.id}
                  playdate={playdate}
                  onMessage={otherUserId ? () => handleMessage(otherUserId) : undefined}
                  onCancel={() => handleCancel(playdate.id)}
                />
              );
            })
          )}
        </TabsContent>

        <TabsContent value="all" className="mt-4 space-y-3">
          {playdates.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Dog className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No playdates yet</p>
              <Button className="mt-4 rounded-full">Schedule Your First Playdate</Button>
            </div>
          ) : (
            <>
              {playdates.some(p => ['completed', 'declined', 'cancelled'].includes(p.status)) && (
                <div className="flex justify-end">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="sm" className="rounded-full text-destructive hover:text-destructive hover:bg-destructive/10">
                        <Trash2 className="w-4 h-4 mr-1" />
                        Clear History
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Clear playdate history?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This permanently removes all completed, declined, and cancelled playdates. Active playdates are not affected.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="rounded-full">Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          className="rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          onClick={async () => {
                            const { error } = await clearHistory();
                            if (error) {
                              toast.error('Failed to clear history');
                            } else {
                              toast.success('Playdate history cleared');
                            }
                          }}
                        >
                          Clear History
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              )}
              {playdates.map(playdate => (
                <PlaydateCard
                  key={playdate.id}
                  playdate={playdate}
                  onDelete={['completed', 'declined', 'cancelled'].includes(playdate.status) ? () => handleDeletePlaydate(playdate.id) : undefined}
                />
              ))}
            </>
          )}
        </TabsContent>
      </Tabs>

      {/* Care Schedule Section */}
      <div className="px-4 pb-4">
        <CareScheduleSection />
      </div>

      <BlockUserDialog
        open={!!blockTarget}
        onOpenChange={(open) => !open && setBlockTarget(null)}
        userName={blockTarget?.name}
        onConfirm={handleBlockConfirm}
      />
    </div>
  );
}

function PlaydateCard({ 
  playdate, 
  onAccept, 
  onDecline, 
  onBlock,
  onMessage,
  onCancel,
  onDelete,
  showActions = false,
  isIncoming = false,
  isOutgoing = false
}: { 
  playdate: any; 
  onAccept?: () => void; 
  onDecline?: () => void;
  onBlock?: () => void;
  onMessage?: () => void;
  onCancel?: () => void;
  onDelete?: () => void;
  showActions?: boolean;
  isIncoming?: boolean;
  isOutgoing?: boolean;
}) {
  return (
    <Card className="p-4 bg-card">
      <div className="flex items-start gap-4">
        <div className="flex -space-x-3">
          <Avatar className="w-12 h-12 ring-2 ring-card">
            <AvatarImage src={playdate.senderDog?.avatar_url || undefined} />
            <AvatarFallback className="bg-primary text-primary-foreground">
              {playdate.senderDog?.name?.[0] || '🐕'}
            </AvatarFallback>
          </Avatar>
          <Avatar className="w-12 h-12 ring-2 ring-card">
            <AvatarImage src={playdate.receiverDog?.avatar_url || undefined} />
            <AvatarFallback className="bg-accent text-accent-foreground">
              {playdate.receiverDog?.name?.[0] || '🐕'}
            </AvatarFallback>
          </Avatar>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold">
            {playdate.senderDog?.name} & {playdate.receiverDog?.name}
          </h3>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
            <MapPin className="w-4 h-4" />
            <span className="truncate">{playdate.location_name || 'Location TBD'}</span>
          </div>
          {playdate.requested_date && (
            <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
              <div className="flex items-center gap-1">
                <CalendarDays className="w-4 h-4" />
                {format(new Date(playdate.requested_date), 'MMM d')}
              </div>
              {playdate.requested_time && (
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {playdate.requested_time}
                </div>
              )}
            </div>
          )}
          {playdate.request_message && (
            <p className="text-sm mt-2 text-muted-foreground italic">
              "{playdate.request_message}"
            </p>
          )}
        </div>
        <div className={`px-2 py-1 rounded-full text-xs font-medium ${
          playdate.status === 'accepted' ? 'bg-green-500/20 text-green-500' :
          playdate.status === 'pending' ? 'bg-yellow-500/20 text-yellow-500' :
          playdate.status === 'declined' ? 'bg-red-500/20 text-red-500' :
          'bg-muted text-muted-foreground'
        }`}>
          Playdate {playdate.status.charAt(0).toUpperCase() + playdate.status.slice(1)}
        </div>
      </div>

      {showActions && (
        <div className="flex gap-2 mt-4 pt-4 border-t border-border">
          <Button onClick={onAccept} className="flex-1 rounded-full" size="sm">
            <Check className="w-4 h-4 mr-1" />
            Accept
          </Button>
          <Button onClick={onDecline} variant="outline" className="flex-1 rounded-full" size="sm">
            <X className="w-4 h-4 mr-1" />
            Decline
          </Button>
          {onBlock && (
            <Button onClick={onBlock} variant="ghost" size="sm" className="rounded-full text-destructive hover:text-destructive hover:bg-destructive/10" title="Block this user">
              <ShieldBan className="w-4 h-4 mr-1" />
              Block
            </Button>
          )}
        </div>
      )}

      {(onMessage || onCancel) && !showActions && (
        <div className="flex gap-2 mt-3 pt-3 border-t border-border">
          {onMessage && (
            <Button onClick={onMessage} variant="outline" size="sm" className="flex-1 rounded-full">
              <MessageSquare className="w-4 h-4 mr-1" />
              Message
            </Button>
          )}
          {onCancel && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="sm" className="rounded-full text-destructive hover:text-destructive hover:bg-destructive/10">
                  <Trash2 className="w-4 h-4 mr-1" />
                  Cancel
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Cancel this playdate?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will cancel the booked playdate. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="rounded-full">Keep it</AlertDialogCancel>
                  <AlertDialogAction onClick={onCancel} className="rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    Yes, cancel
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      )}
    </Card>
  );
}
