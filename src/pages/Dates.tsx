import { useState } from 'react';
import { CalendarDays, Clock, MapPin, Check, X, Plus, Dog } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { usePlaydates } from '@/hooks/usePlaydates';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';
import datesBackground from '@/assets/dates-background.jpg';

export default function Dates() {
  const { user } = useAuth();
  const { pendingPlaydates, acceptedPlaydates, playdates, loading, updatePlaydateStatus } = usePlaydates();

  if (!user) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center p-4 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${datesBackground})` }}
      >
        <div className="absolute inset-0 bg-background/60 backdrop-blur-sm" />
        <Card className="p-8 text-center max-w-sm relative z-10 bg-card/95 backdrop-blur">
          <CalendarDays className="w-16 h-16 mx-auto mb-4 text-primary" />
          <h2 className="text-xl font-bold mb-2">Schedule Playdates</h2>
          <p className="text-muted-foreground mb-4">Sign in to manage your dog's social calendar</p>
          <Button className="w-full rounded-full" asChild>
            <a href="/me">Sign In</a>
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen bg-cover bg-center bg-no-repeat bg-fixed relative"
      style={{ backgroundImage: `url(${datesBackground})` }}
    >
      <div className="absolute inset-0 bg-background/70 backdrop-blur-[2px]" />
      {/* Header */}
      <div className="relative z-10 bg-card/90 backdrop-blur border-b border-border p-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <CalendarDays className="w-6 h-6 text-primary" />
          Playdates
        </h1>
        <Button size="sm" className="rounded-full">
          <Plus className="w-4 h-4 mr-1" />
          New
        </Button>
      </div>

      <Tabs defaultValue="pending" className="relative z-10 p-4">
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

        <TabsContent value="pending" className="mt-4 space-y-3">
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
            pendingPlaydates.map(playdate => (
              <PlaydateCard
                key={playdate.id}
                playdate={playdate}
                onAccept={() => updatePlaydateStatus(playdate.id, 'accepted')}
                onDecline={() => updatePlaydateStatus(playdate.id, 'declined')}
                showActions
              />
            ))
          )}
        </TabsContent>

        <TabsContent value="booked" className="mt-4 space-y-3">
          {acceptedPlaydates.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <CalendarDays className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No upcoming playdates</p>
            </div>
          ) : (
            acceptedPlaydates.map(playdate => (
              <PlaydateCard key={playdate.id} playdate={playdate} />
            ))
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
            playdates.map(playdate => (
              <PlaydateCard key={playdate.id} playdate={playdate} />
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function PlaydateCard({ 
  playdate, 
  onAccept, 
  onDecline, 
  showActions = false 
}: { 
  playdate: any; 
  onAccept?: () => void; 
  onDecline?: () => void;
  showActions?: boolean;
}) {
  return (
    <Card className="p-4 card-playful">
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
          playdate.status === 'accepted' ? 'bg-success/20 text-success' :
          playdate.status === 'pending' ? 'bg-warning/20 text-warning' :
          playdate.status === 'declined' ? 'bg-destructive/20 text-destructive' :
          'bg-muted text-muted-foreground'
        }`}>
          {playdate.status}
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
        </div>
      )}
    </Card>
  );
}
