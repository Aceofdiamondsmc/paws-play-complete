import React, { useState, useEffect } from 'react';
import { PawPrint, X, Dog, Sparkles, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useFriendships } from '@/hooks/useFriendships';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import type { Dog as DogType, Profile } from '@/types';

interface DogWithOwner extends DogType {
  owner?: Profile;
}

export default function Pack() {
  const { user } = useAuth();
  const { friends, pendingRequests, acceptRequest, declineRequest } = useFriendships();
  const [discoveryDogs, setDiscoveryDogs] = useState<DogWithOwner[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);

  useEffect(() => {
    if (!user) return;

    const fetchDogs = async () => {
      const { data: dogs } = await supabase
        .from('dogs')
        .select('*')
        .neq('owner_id', user.id)
        .limit(20);

      if (dogs && dogs.length > 0) {
        const ownerIds = [...new Set(dogs.map(d => d.owner_id))];
        const { data: profiles } = await supabase
          .from('profiles')
          .select('*')
          .in('id', ownerIds);

        const profileMap = new Map<string, Profile>();
        profiles?.forEach(p => profileMap.set(p.id, p as Profile));

        setDiscoveryDogs(dogs.map(d => ({
          ...d as DogType,
          owner: profileMap.get(d.owner_id)
        })));
      }
    };

    fetchDogs();
  }, [user]);

  const currentDog = discoveryDogs[currentIndex];

  const handleSwipe = (dir: 'left' | 'right') => {
    setSwipeDirection(dir);
    setTimeout(() => {
      setCurrentIndex(prev => prev + 1);
      setSwipeDirection(null);
    }, 300);
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="p-8 text-center max-w-sm">
          <Dog className="w-16 h-16 mx-auto mb-4 text-primary" />
          <h2 className="text-xl font-bold mb-2">Join the Pack!</h2>
          <p className="text-muted-foreground mb-4">Sign in to discover new friends for your pup</p>
          <Button className="w-full rounded-full" asChild>
            <a href="/me">Sign In</a>
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <div className="bg-card/95 backdrop-blur border-b border-border p-4">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <PawPrint className="w-6 h-6 text-primary" />
          Pack
        </h1>
      </div>

      {/* Pending Requests */}
      {pendingRequests.length > 0 && (
        <div className="p-4 bg-secondary/50">
          <h3 className="font-semibold mb-2 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            Friend Requests ({pendingRequests.length})
          </h3>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {pendingRequests.map(req => (
              <Card key={req.id} className="p-3 min-w-[160px] flex flex-col items-center">
                <Avatar className="w-12 h-12 mb-2">
                  <AvatarImage src={req.friend.avatar_url || undefined} />
                  <AvatarFallback>{req.friend.display_name?.[0] || 'U'}</AvatarFallback>
                </Avatar>
                <span className="font-medium text-sm">{req.friend.display_name}</span>
                <div className="flex gap-2 mt-2">
                  <Button size="sm" onClick={() => acceptRequest(req.id)} className="rounded-full h-8">
                    Accept
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => declineRequest(req.id)} className="rounded-full h-8">
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Dog Discovery Cards */}
      <div className="flex-1 flex flex-col items-center justify-center p-4 relative">
        {currentDog ? (
          <>
            <div className="relative w-full max-w-sm aspect-[3/4]">
              <div
                className={cn(
                  "absolute inset-0 rounded-3xl overflow-hidden bg-card shadow-lg transition-all duration-300",
                  swipeDirection === 'left' && "-translate-x-full -rotate-12 opacity-0",
                  swipeDirection === 'right' && "translate-x-full rotate-12 opacity-0"
                )}
              >
                {currentDog.avatar_url ? (
                  <img
                    src={currentDog.avatar_url}
                    alt={currentDog.name}
                    className="w-full h-2/3 object-cover"
                  />
                ) : (
                  <div className="w-full h-2/3 bg-muted flex items-center justify-center">
                    <Dog className="w-24 h-24 text-muted-foreground" />
                  </div>
                )}
                <div className="p-4">
                  <h2 className="text-2xl font-bold">{currentDog.name}</h2>
                  <p className="text-muted-foreground">
                    {currentDog.breed} • {currentDog.size}
                  </p>
                  {currentDog.bio && (
                    <p className="mt-2 text-sm line-clamp-2">{currentDog.bio}</p>
                  )}
                  {currentDog.energy_level && (
                    <span className="inline-block mt-2 px-3 py-1 bg-secondary rounded-full text-xs font-medium">
                      {currentDog.energy_level} energy
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons - Thumb Zone */}
            <div className="flex items-center justify-center gap-6 mt-6">
              <Button
                size="lg"
                variant="outline"
                className="w-16 h-16 rounded-full border-2 border-muted-foreground/30"
                onClick={() => handleSwipe('left')}
              >
                <X className="w-8 h-8 text-muted-foreground" />
              </Button>
              <Button
                size="lg"
                className="w-20 h-20 rounded-full bg-primary shadow-lg"
                onClick={() => handleSwipe('right')}
              >
                <Heart className="w-10 h-10" />
              </Button>
            </div>
          </>
        ) : (
          <div className="text-center">
            <Dog className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-xl font-bold mb-2">No more pups nearby</h2>
            <p className="text-muted-foreground">Check back later for new friends!</p>
          </div>
        )}
      </div>

      {/* Friends List */}
      {friends.length > 0 && (
        <div className="p-4 border-t border-border">
          <h3 className="font-semibold mb-3">Your Pack ({friends.length})</h3>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {friends.map(f => (
              <div key={f.id} className="flex flex-col items-center">
                <Avatar className="w-14 h-14 ring-2 ring-primary ring-offset-2">
                  <AvatarImage src={f.friend.avatar_url || undefined} />
                  <AvatarFallback>{f.friend.display_name?.[0] || 'U'}</AvatarFallback>
                </Avatar>
                <span className="text-xs mt-1 font-medium">{f.friend.display_name?.split(' ')[0]}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
