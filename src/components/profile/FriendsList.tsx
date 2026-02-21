import React from 'react';
import { UserPlus, UserCheck, UserX, Clock, X } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useFriendships } from '@/hooks/useFriendships';
import { toast } from 'sonner';

export function FriendsList() {
  const { friends, pendingRequests, sentRequests, loading, acceptRequest, declineRequest, removeFriend } = useFriendships();

  const handleAccept = async (friendshipId: string) => {
    const { error } = await acceptRequest(friendshipId);
    if (error) toast.error('Failed to accept request');
    else toast.success('Friend request accepted!');
  };

  const handleDecline = async (friendshipId: string) => {
    const { error } = await declineRequest(friendshipId);
    if (error) toast.error('Failed to decline request');
    else toast.success('Request declined');
  };

  const handleRemove = async (friendshipId: string) => {
    const { error } = await removeFriend(friendshipId);
    if (error) toast.error('Failed to remove friend');
    else toast.success('Friend removed');
  };

  if (loading) {
    return (
      <div className="py-4 text-center text-sm text-muted-foreground">Loading...</div>
    );
  }

  const isEmpty = friends.length === 0 && pendingRequests.length === 0 && sentRequests.length === 0;

  if (isEmpty) {
    return (
      <div className="py-6 text-center text-sm text-muted-foreground">
        <UserPlus className="w-8 h-8 mx-auto mb-2 opacity-40" />
        <p>No friends yet. Visit the Pack tab to add friends!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Incoming Requests */}
      {pendingRequests.length > 0 && (
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
            Incoming Requests ({pendingRequests.length})
          </h4>
          <div className="space-y-2">
            {pendingRequests.map((req) => (
              <div key={req.id} className="flex items-center gap-3 p-3 bg-primary/5 border border-primary/20 rounded-xl">
                <Avatar className="w-10 h-10">
                  <AvatarImage src={req.friend.avatar_url || undefined} />
                  <AvatarFallback className="bg-primary/10 text-primary text-sm">
                    {req.friend.display_name?.[0] || '?'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{req.friend.display_name || 'Unknown'}</p>
                  {req.friend.city && req.friend.state && (
                    <p className="text-xs text-muted-foreground">{req.friend.city}, {req.friend.state}</p>
                  )}
                </div>
                <div className="flex gap-1.5">
                  <Button size="sm" className="h-8 rounded-full px-3" onClick={() => handleAccept(req.id)}>
                    <UserCheck className="w-3.5 h-3.5 mr-1" />
                    Accept
                  </Button>
                  <Button size="sm" variant="ghost" className="h-8 w-8 rounded-full p-0" onClick={() => handleDecline(req.id)}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Current Friends */}
      {friends.length > 0 && (
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
            Friends ({friends.length})
          </h4>
          <div className="space-y-2">
            {friends.map((f) => (
              <div key={f.id} className="flex items-center gap-3 p-3 bg-muted rounded-xl">
                <Avatar className="w-10 h-10">
                  <AvatarImage src={f.friend.avatar_url || undefined} />
                  <AvatarFallback className="bg-primary/10 text-primary text-sm">
                    {f.friend.display_name?.[0] || '?'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{f.friend.display_name || 'Unknown'}</p>
                  {f.friend.city && f.friend.state && (
                    <p className="text-xs text-muted-foreground">{f.friend.city}, {f.friend.state}</p>
                  )}
                </div>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  className="h-8 rounded-full text-xs text-muted-foreground hover:text-destructive"
                  onClick={() => handleRemove(f.id)}
                >
                  <UserX className="w-3.5 h-3.5 mr-1" />
                  Remove
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sent Requests */}
      {sentRequests.length > 0 && (
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
            Sent Requests ({sentRequests.length})
          </h4>
          <div className="space-y-2">
            {sentRequests.map((req) => (
              <div key={req.id} className="flex items-center gap-3 p-3 bg-muted rounded-xl">
                <Avatar className="w-10 h-10">
                  <AvatarImage src={req.friend.avatar_url || undefined} />
                  <AvatarFallback className="bg-muted-foreground/10 text-muted-foreground text-sm">
                    {req.friend.display_name?.[0] || '?'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{req.friend.display_name || 'Unknown'}</p>
                </div>
                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  Pending
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
