import React, { useState, useEffect } from 'react';
import { PawPrint, ChevronRight, Zap, Star, Heart, Shield, CheckCircle, Ruler, Dog as DogIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useFriendships } from '@/hooks/useFriendships';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import type { Dog as DogType, Profile } from '@/types';

interface DogWithOwner extends DogType {
  owner?: Profile;
  playStyles?: string[];
}

export default function Pack() {
  const { user } = useAuth();
  const { friends } = useFriendships();
  const [discoveryDogs, setDiscoveryDogs] = useState<DogWithOwner[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

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

        // Add mock play styles for demo
        const playStyleOptions = ['Fetch Fanatic', 'Water Lover', 'Tug Champion', 'Chase Expert', 'Cuddler'];
        
        setDiscoveryDogs(dogs.map(d => ({
          ...d as DogType,
          owner: profileMap.get(d.owner_id),
          playStyles: playStyleOptions.slice(0, Math.floor(Math.random() * 3) + 1)
        })));
      }
    };

    fetchDogs();
  }, [user]);

  const currentDog = discoveryDogs[currentIndex];

  const handleNext = () => {
    if (currentIndex < discoveryDogs.length - 1) {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const getEnergyLevel = (energy?: string | null) => {
    switch (energy?.toLowerCase()) {
      case 'high': return { value: 85, label: 'High', color: 'bg-red-500' };
      case 'medium': return { value: 50, label: 'Medium', color: 'bg-yellow-500' };
      case 'low': return { value: 25, label: 'Low', color: 'bg-green-500' };
      default: return { value: 70, label: 'High', color: 'bg-red-500' };
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-[hsl(var(--primary)/0.3)] to-background">
        <Card className="p-8 text-center max-w-sm bg-card">
          <DogIcon className="w-16 h-16 mx-auto mb-4 text-primary" />
          <h2 className="text-xl font-bold mb-2">Join the Pack!</h2>
          <p className="text-muted-foreground mb-4">Sign in to discover new friends for your pup</p>
          <Button className="w-full rounded-full" asChild>
            <a href="/me">Sign In</a>
          </Button>
        </Card>
      </div>
    );
  }

  if (!currentDog) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <DogIcon className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-xl font-bold mb-2">No more pups nearby</h2>
          <p className="text-muted-foreground">Check back later for new friends!</p>
        </div>
      </div>
    );
  }

  const energyInfo = getEnergyLevel(currentDog.energy_level || currentDog.energy);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Green Header with Dog Photo */}
      <div className="bg-gradient-to-b from-[#7CB69D] to-[#6BA889] pt-8 pb-20 text-center relative">
        <div className="relative inline-block">
          <Avatar className="w-32 h-32 border-4 border-white shadow-lg">
            <AvatarImage src={currentDog.avatar_url || undefined} className="object-cover" />
            <AvatarFallback className="bg-muted text-4xl">
              {currentDog.name?.[0] || 'D'}
            </AvatarFallback>
          </Avatar>
          {/* Energy Badge */}
          <div className="absolute bottom-0 right-0 w-10 h-10 bg-yellow-400 rounded-full flex items-center justify-center shadow-lg">
            <Zap className="w-6 h-6 text-white" fill="white" />
          </div>
        </div>
        <h1 className="text-3xl font-bold text-white mt-4">{currentDog.name}</h1>
        <p className="text-white/80">{currentDog.breed || 'Mixed Breed'}</p>
      </div>

      {/* Main Content Card */}
      <div className="flex-1 bg-card -mt-8 rounded-t-3xl relative">
        {/* Next Button */}
        <button 
          onClick={handleNext}
          className="absolute right-4 top-8 w-12 h-12 bg-muted rounded-full flex items-center justify-center shadow-lg"
        >
          <ChevronRight className="w-6 h-6" />
        </button>

        <div className="p-6 pt-8 space-y-6">
          {/* Badges */}
          <div className="flex flex-wrap gap-2">
            <Badge className="bg-green-500/20 text-green-500 border-green-500/30 gap-1">
              <CheckCircle className="w-4 h-4" />
              Verified
            </Badge>
            <Badge variant="outline" className="border-muted-foreground/30 gap-1">
              <Star className="w-4 h-4" />
              High Energy Match
            </Badge>
            <Badge className="bg-pink-500/20 text-pink-400 border-pink-500/30 gap-1">
              <Heart className="w-4 h-4" />
              Perfect Playmate
            </Badge>
            <Badge variant="outline" className="border-muted-foreground/30 gap-1">
              <Star className="w-4 h-4" />
              Social Butterfly
            </Badge>
          </div>

          {/* Play Style */}
          <div>
            <h3 className="font-bold mb-3">Play Style</h3>
            <div className="flex flex-wrap gap-2">
              {(currentDog.playStyles || ['Fetch Fanatic', 'Water Lover']).map((style, idx) => (
                <Badge 
                  key={idx}
                  className={cn(
                    "gap-1",
                    idx === 0 ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" : "bg-blue-500/20 text-blue-400 border-blue-500/30"
                  )}
                >
                  <Zap className="w-4 h-4" />
                  {style}
                </Badge>
              ))}
            </div>
          </div>

          {/* Energy Level */}
          <Card className="p-4 bg-muted/50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold tracking-wide text-muted-foreground">ENERGY LEVEL</span>
              <span className="font-bold">{energyInfo.label}</span>
            </div>
            <div className="h-3 bg-muted rounded-full overflow-hidden">
              <div 
                className={cn("h-full rounded-full transition-all", energyInfo.color)}
                style={{ width: `${energyInfo.value}%` }}
              />
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Needs lots of exercise and active playdates
            </p>
          </Card>

          {/* Size / Energy / Breed Cards */}
          <div className="grid grid-cols-3 gap-3">
            <Card className="p-4 text-center bg-muted/50">
              <div className="w-10 h-10 mx-auto mb-2 bg-purple-500/20 rounded-full flex items-center justify-center">
                <Ruler className="w-5 h-5 text-purple-400" />
              </div>
              <span className="text-xs text-muted-foreground block">SIZE</span>
              <span className="font-bold">{currentDog.size || 'Large'}</span>
            </Card>
            <Card className="p-4 text-center bg-muted/50">
              <div className="w-10 h-10 mx-auto mb-2 bg-yellow-500 rounded-full flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <span className="text-xs text-muted-foreground block">ENERGY</span>
              <span className="font-bold">{energyInfo.label}</span>
            </Card>
            <Card className="p-4 text-center bg-muted/50">
              <div className="w-10 h-10 mx-auto mb-2 bg-blue-500/20 rounded-full flex items-center justify-center">
                <Shield className="w-5 h-5 text-blue-400" />
              </div>
              <span className="text-xs text-muted-foreground block">BREED</span>
              <span className="font-bold text-sm truncate">{currentDog.breed || 'Mixed'}</span>
            </Card>
          </div>

          {/* About Section */}
          <Card className="p-4 bg-muted/50">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h3 className="text-sm font-semibold tracking-wide text-muted-foreground mb-2">
                  ABOUT {currentDog.name?.toUpperCase()}
                </h3>
                <p className="text-foreground">
                  {currentDog.bio || `Loves to play fetch and swim! Always ready for an adventure at the park. Great with other dogs and kids.`}
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground ml-4 flex-shrink-0" />
            </div>
          </Card>

          {/* Request Playdate Button */}
          <Button className="w-full h-14 rounded-2xl bg-yellow-400 hover:bg-yellow-500 text-black font-bold text-lg">
            <Heart className="w-5 h-5 mr-2" />
            Request Playdate
          </Button>

          {/* Pack Leader */}
          {currentDog.owner && (
            <div className="border-t border-border pt-4">
              <h3 className="text-sm font-semibold tracking-wide text-muted-foreground mb-3">
                PACK LEADER
              </h3>
              <Card className="p-4 bg-primary/10 border-primary/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={currentDog.owner.avatar_url || undefined} />
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {currentDog.owner.display_name?.[0] || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-semibold">{currentDog.owner.display_name || 'Dog Parent'}</span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </div>
              </Card>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Gradient */}
      <div className="h-16 bg-gradient-to-t from-[#7CB69D] to-transparent" />
    </div>
  );
}
