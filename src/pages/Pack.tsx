import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { ChevronRight, ChevronLeft, Zap, Star, Heart, Shield, CheckCircle, Ruler, Dog as DogIcon, MapPin, PawPrint, ShieldBan, ShieldCheck, ShieldOff, MessageSquare, MoreHorizontal, UserMinus } from 'lucide-react';
import { VaccinationBadge } from '@/components/profile/VaccinationBadge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import type { Dog as DogType, Profile, DogWithDistance } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { useFriendships } from '@/hooks/useFriendships';
import { useBlockedUsers } from '@/hooks/useBlockedUsers';
import { useMessages } from '@/hooks/useMessages';
import { RequestPlaydateModal } from '@/components/playdate/RequestPlaydateModal';
import { UserProfilePopover } from '@/components/pack/UserProfilePopover';
import { toast } from 'sonner';
import { UserPlus, UserCheck, Clock as ClockIcon } from 'lucide-react';

interface DogWithOwner extends DogType {
  owner?: Profile;
  distance_meters?: number | null;
}

// Test dogs data for demo
const testDogs: DogWithOwner[] = [
  {
    id: 'test-1',
    name: 'Max',
    breed: 'Golden Retriever',
    size: 'Large',
    energy_level: 'High',
    bio: 'Loves to play fetch and swim! Always ready for an adventure at the park. Great with other dogs and kids.',
    avatar_url: 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=400&h=400&fit=crop',
    owner_id: 'test-owner-1',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    age_years: null,
    weight_lbs: null,
    health_notes: null,
    play_style: ['Fetch', 'Swimming'],
    vaccination_certified: null,
    vet_verified: null,
    owner: {
      id: 'test-owner-1',
      display_name: 'Sarah Johnson',
      avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop',
      is_public: true,
    } as Profile
  },
  {
    id: 'test-2',
    name: 'Fisco',
    breed: 'French Bulldog',
    size: 'Small',
    energy_level: 'Medium',
    bio: 'A playful little guy who loves cuddles and short walks. Gets along great with everyone!',
    avatar_url: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=400&h=400&fit=crop',
    owner_id: 'test-owner-2',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    age_years: null,
    weight_lbs: null,
    health_notes: null,
    play_style: ['Cuddling', 'Tug-of-war'],
    vaccination_certified: null,
    vet_verified: null,
    owner: {
      id: 'test-owner-2',
      display_name: 'Mike Chen',
      avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
      is_public: true,
    } as Profile
  },
  {
    id: 'test-3',
    name: 'Bella',
    breed: 'Border Collie',
    size: 'Medium',
    energy_level: 'High',
    bio: 'Super smart and loves to run! Agility champion in training. Needs an active playmate.',
    avatar_url: 'https://images.unsplash.com/photo-1503256207526-0d5d80fa2f47?w=400&h=400&fit=crop',
    owner_id: 'test-owner-3',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    age_years: null,
    weight_lbs: null,
    health_notes: null,
    play_style: ['Chase', 'Fetch'],
    vaccination_certified: null,
    vet_verified: null,
    owner: {
      id: 'test-owner-3',
      display_name: 'Emily Davis',
      avatar_url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop',
      is_public: true,
    } as Profile
  },
  {
    id: 'test-4',
    name: 'Sonny',
    breed: 'Labrador Retriever',
    size: 'Large',
    energy_level: 'Low',
    bio: 'A gentle giant who loves lazy afternoons and belly rubs. Perfect for calm playdates.',
    avatar_url: 'https://images.unsplash.com/photo-1529429617124-95b109e86bb8?w=400&h=400&fit=crop',
    owner_id: 'test-owner-4',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    age_years: null,
    weight_lbs: null,
    health_notes: null,
    play_style: ['Cuddling', 'Swimming'],
    vaccination_certified: null,
    vet_verified: null,
    owner: {
      id: 'test-owner-4',
      display_name: 'James Wilson',
      avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop',
      is_public: true,
    } as Profile
  }
];

// Helper to format distance in miles
function formatDistanceMiles(meters: number | null | undefined): string {
  if (!meters) return '';
  const miles = meters / 1609.34;
  if (miles < 0.1) return 'Nearby';
  if (miles < 1) return `${(miles).toFixed(1)} mi`;
  return `${Math.round(miles)} mi`;
}

// Compute dynamic match badges based on compatibility with user's dogs
function computeMatchBadges(dog: DogWithOwner, userDogs: DogType[]) {
  const badges: { label: string; icon: React.ElementType; className: string }[] = [];

  if (userDogs.length === 0) return badges;

  // Energy Match — same energy_level as any of your dogs
  if (dog.energy_level && userDogs.some(d => d.energy_level === dog.energy_level)) {
    badges.push({ label: 'Energy Match', icon: Zap, className: 'bg-[#f97316]/15 text-[#fb923c] border-[#f97316]/40' });
  }

  // Size Match — same size as any of your dogs
  if (dog.size && userDogs.some(d => d.size === dog.size)) {
    badges.push({ label: 'Size Match', icon: Ruler, className: 'bg-[#3b82f6]/15 text-[#60a5fa] border-[#3b82f6]/40' });
  }

  // Play Pal — shares at least one play_style with any of your dogs
  if (dog.play_style && dog.play_style.length > 0) {
    const userStyles = new Set(userDogs.flatMap(d => d.play_style || []));
    if (dog.play_style.some(s => userStyles.has(s))) {
      badges.push({ label: 'Play Pal', icon: Heart, className: 'bg-[#ec4899]/15 text-[#f472b6] border-[#ec4899]/40' });
    }
  }

  // Nearby — distance < 8km (~5 miles)
  if (dog.distance_meters != null && dog.distance_meters < 8000) {
    badges.push({ label: 'Nearby', icon: MapPin, className: 'bg-[#4ade80]/15 text-[#4ade80] border-[#4ade80]/40' });
  }

  // Social Butterfly — dog has 3+ play styles
  if (dog.play_style && dog.play_style.length >= 3) {
    badges.push({ label: 'Social Butterfly', icon: Star, className: 'bg-[#a855f7]/15 text-[#c084fc] border-[#a855f7]/40' });
  }

  return badges;
}

export default function Pack() {
  const packNavigate = useNavigate();
  const { user, dogs: userDogs } = useAuth();
  const { friends, sentRequests, pendingRequests, sendFriendRequest, acceptRequest, declineRequest, removeFriend } = useFriendships();
  const { blockUser } = useBlockedUsers();
  const { startConversation } = useMessages();

  const handleMessage = async (ownerId: string) => {
    if (!user) {
      packNavigate('/me');
      return;
    }
    const { conversation, error } = await startConversation(ownerId);
    if (error) {
      toast.error('Failed to start conversation');
      return;
    }
    if (conversation) {
      packNavigate(`/me?chat=${conversation.id}`);
    }
  };
  const [searchParams, setSearchParams] = useSearchParams();
  const [discoveryDogs, setDiscoveryDogs] = useState<DogWithOwner[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationStatus, setLocationStatus] = useState<'pending' | 'granted' | 'denied'>('pending');
  const [playdateModalOpen, setPlaydateModalOpen] = useState(false);
  
  
  // Touch/swipe handling
  const touchStartX = useRef<number>(0);
  const touchEndX = useRef<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Get user location on mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          setLocationStatus('granted');
        },
        () => {
          setLocationStatus('denied');
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } else {
      setLocationStatus('denied');
    }
  }, []);

  // Fetch dogs when location status is resolved
  useEffect(() => {
    if (locationStatus === 'pending') return;
    
    const fetchDogs = async () => {
      setLoading(true);
      
      try {
        if (userLocation && user) {
          // Use RPC for proximity-sorted results
          const { data: dogs, error } = await (supabase.rpc as any)('get_nearby_dogs', {
            user_lat: userLocation.lat,
            user_lng: userLocation.lng,
            limit_count: 50
          });

          if (!error && dogs && dogs.length > 0) {
            setDiscoveryDogs(dogs.map((d: DogWithDistance) => ({
              id: d.id,
              owner_id: d.owner_id,
              name: d.name,
              breed: d.breed,
              size: d.size,
              energy_level: d.energy_level,
              bio: d.bio,
              avatar_url: d.avatar_url,
              age_years: d.age_years,
              play_style: d.play_style,
              created_at: d.created_at,
              updated_at: null,
              weight_lbs: null,
              health_notes: null,
              vaccination_certified: (d as any).vaccination_certified ?? null,
              distance_meters: d.distance_meters,
              owner: {
                id: d.owner_id,
                display_name: d.owner_display_name,
                avatar_url: d.owner_avatar_url,
                city: d.owner_city,
                state: d.owner_state,
                is_public: true,
              } as Profile
            })));
            setLoading(false);
            return;
          }
        }
        
        // Fallback: fetch from dogs_discovery view without distance sorting
        const { data: dogs } = await supabase
          .from('dogs')
          .select('*')
          .limit(50);

        if (dogs && dogs.length > 0) {
          // RPC now includes user's dog first - no filtering needed
          const filteredDogs = dogs;
          
          if (filteredDogs.length > 0) {
            const ownerIds = [...new Set(filteredDogs.map(d => d.owner_id))];
            const { data: profiles } = await supabase
              .from('public_profiles')
              .select('id, display_name, avatar_url, city, state')
              .in('id', ownerIds);

            const profileMap = new Map<string, Profile>();
            profiles?.forEach(p => profileMap.set(p.id as string, p as Profile));

            setDiscoveryDogs(filteredDogs.map(d => ({
              ...d as DogType,
              owner: profileMap.get(d.owner_id)
            })));
          } else {
            // Use test dogs when no other dogs in database
            setDiscoveryDogs(testDogs);
          }
        } else {
          // Use test dogs when no dogs in database
          setDiscoveryDogs(testDogs);
        }
      } catch (err) {
        console.error('Error fetching dogs:', err);
        setDiscoveryDogs(testDogs);
      }
      
      setLoading(false);
    };

    fetchDogs();
  }, [locationStatus, userLocation, user]);

  // Deep-link: jump to a specific dog/owner when navigated with ?dog= or ?user=
  useEffect(() => {
    if (discoveryDogs.length === 0) return;
    const targetDogId = searchParams.get('dog');
    const targetUserId = searchParams.get('user');
    if (targetDogId) {
      const idx = discoveryDogs.findIndex(d => d.id === targetDogId);
      if (idx >= 0) setCurrentIndex(idx);
    } else if (targetUserId) {
      const idx = discoveryDogs.findIndex(d => d.owner_id === targetUserId);
      if (idx >= 0) setCurrentIndex(idx);
    }
    if (targetDogId || targetUserId) {
      setSearchParams({}, { replace: true });
    }
  }, [discoveryDogs, searchParams, setSearchParams]);

  const currentDog = discoveryDogs[currentIndex];

  const handleNext = useCallback(() => {
    setSwipeDirection('left');
    setTimeout(() => {
      setCurrentIndex(prev => {
        const nextIndex = prev + 1;
        return nextIndex < discoveryDogs.length ? nextIndex : prev;
      });
      setSwipeDirection(null);
    }, 200);
  }, [discoveryDogs.length]);

  const handlePrev = useCallback(() => {
    setSwipeDirection('right');
    setTimeout(() => {
      setCurrentIndex(prev => {
        const nextIndex = prev - 1;
        return nextIndex >= 0 ? nextIndex : prev;
      });
      setSwipeDirection(null);
    }, 200);
  }, []);

  // Touch event handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    const swipeThreshold = 50;
    const diff = touchStartX.current - touchEndX.current;
    
    if (Math.abs(diff) > swipeThreshold) {
      if (diff > 0) {
        // Swiped left - go to next
        handleNext();
      } else {
        // Swiped right - go to previous
        handlePrev();
      }
    }
    
    touchStartX.current = 0;
    touchEndX.current = 0;
  };

  const getEnergyLevel = (energy?: string | null) => {
    switch (energy?.toLowerCase()) {
      case 'high': return { value: 85, label: 'High' };
      case 'medium': return { value: 50, label: 'Medium' };
      case 'low': return { value: 25, label: 'Low' };
      default: return { value: 85, label: 'High' };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#1a1f2e]">
        <div className="text-center">
          <DogIcon className="w-16 h-16 mx-auto mb-4 text-[#7CB69D] animate-pulse" />
          <p className="text-gray-400">Finding pups nearby...</p>
        </div>
      </div>
    );
  }

  if (!currentDog) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-[#1a1f2e]">
        <div className="text-center">
          <DogIcon className="w-16 h-16 mx-auto mb-4 text-gray-500" />
          <h2 className="text-xl font-bold mb-2 text-white">No pups nearby</h2>
          <p className="text-gray-400">Check back later for new friends!</p>
        </div>
      </div>
    );
  }

  const energyInfo = getEnergyLevel(currentDog.energy_level);

  return (
    <div 
      ref={containerRef}
      className="min-h-screen flex flex-col bg-[#1a1f2e]"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Dog counter indicator */}
      <div className="absolute top-2 left-1/2 -translate-x-1/2 z-20 flex gap-1.5">
        {discoveryDogs.map((_, idx) => (
          <div 
            key={idx}
            className={cn(
              "h-1.5 rounded-full transition-all duration-300",
              idx === currentIndex ? "w-6 bg-white" : "w-1.5 bg-white/40"
            )}
          />
        ))}
      </div>

      {/* Green Header with Dog Photo */}
      <div className={cn(
        "bg-gradient-to-b from-[#7CB69D] to-[#6BA889] pt-8 pb-24 text-center relative transition-all duration-200",
        swipeDirection === 'left' && "opacity-0 -translate-x-10",
        swipeDirection === 'right' && "opacity-0 translate-x-10"
      )}>
        <div className="relative inline-block">
          <Avatar className="w-36 h-36 border-4 border-white shadow-xl">
            <AvatarImage src={currentDog.avatar_url || undefined} className="object-cover" />
            <AvatarFallback className="bg-[#7CB69D]/30">
              <PawPrint className="w-16 h-16 text-white/80" />
            </AvatarFallback>
          </Avatar>
          {/* Energy Badge */}
          <div className="absolute bottom-0 right-0 w-12 h-12 bg-[#FFD93D] rounded-full flex items-center justify-center shadow-lg border-2 border-white">
            <Zap className="w-7 h-7 text-white" fill="white" />
          </div>
        </div>
        <h1 className="text-4xl font-bold text-white mt-4 flex items-center justify-center gap-2">
          {currentDog.name}
          <VaccinationBadge certified={currentDog.vaccination_certified} size={24} />
        </h1>
        <p className="text-white/90 text-lg">{currentDog.breed || 'Golden Retriever'}</p>
      </div>

      {/* Main Content Card */}
      <div className={cn(
        "flex-1 bg-[#1a1f2e] -mt-10 rounded-t-[2rem] relative overflow-y-auto pb-32 transition-all duration-200",
        swipeDirection === 'left' && "opacity-0 -translate-x-10",
        swipeDirection === 'right' && "opacity-0 translate-x-10"
      )}>
        {/* Previous Button */}
        <button 
          onClick={handlePrev}
          disabled={currentIndex === 0}
          className={cn(
            "absolute left-4 top-6 w-12 h-12 bg-[#2a3142] rounded-full flex items-center justify-center shadow-lg z-10 hover:bg-[#3a4156] transition-colors",
            currentIndex === 0 && "opacity-0 pointer-events-none"
          )}
        >
          <ChevronLeft className="w-6 h-6 text-gray-300" />
        </button>

        {/* Next Button */}
        <button 
          onClick={handleNext}
          disabled={currentIndex >= discoveryDogs.length - 1}
          className={cn(
            "absolute right-4 top-6 w-12 h-12 bg-[#2a3142] rounded-full flex items-center justify-center shadow-lg z-10 hover:bg-[#3a4156] transition-colors",
            currentIndex >= discoveryDogs.length - 1 && "opacity-0 pointer-events-none"
          )}
        >
          <ChevronRight className="w-6 h-6 text-gray-300" />
        </button>

        <div className="p-6 pt-8 space-y-5">
          {/* Verified Badge + Distance */}
          <div className="flex flex-wrap gap-2">
            {(currentDog as any).vet_verified ? (
              <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-emerald-500/20 text-emerald-500 font-semibold text-sm border border-emerald-500/30">
                <ShieldCheck className="w-4 h-4" />
                Vet Verified
              </span>
            ) : currentDog.vaccination_certified ? (
              <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#f59e0b]/20 text-[#f59e0b] font-semibold text-sm border border-[#f59e0b]/30">
                <ShieldCheck className="w-4 h-4" />
                Owner Certified
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-muted text-muted-foreground font-semibold text-sm border border-border">
                <ShieldOff className="w-4 h-4" />
                Unverified
              </span>
            )}
            {currentDog.distance_meters && (
              <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#3b82f6]/20 text-[#60a5fa] font-semibold text-sm border border-[#3b82f6]/30">
                <MapPin className="w-4 h-4" />
                {formatDistanceMiles(currentDog.distance_meters)}
              </span>
            )}
          </div>

          {/* Match Badges */}
          {(() => {
            const badges = computeMatchBadges(currentDog, userDogs);
            return badges.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {badges.map((badge, idx) => (
                  <span key={idx} className={cn("inline-flex items-center gap-1.5 px-4 py-2 rounded-full font-medium text-sm border", badge.className)}>
                    <badge.icon className="w-4 h-4" />
                    {badge.label}
                  </span>
                ))}
              </div>
            ) : null;
          })()}

          {/* Play Style */}
          <div>
            <h3 className="font-bold text-white mb-3">Play Style</h3>
            <div className="flex flex-wrap gap-2">
              {(currentDog.play_style && currentDog.play_style.length > 0 ? currentDog.play_style : ['No play styles set']).map((style, idx) => (
                <span 
                  key={idx}
                  className={cn(
                    "inline-flex items-center gap-1.5 px-4 py-2 rounded-full font-medium text-sm",
                    idx === 0 
                      ? "bg-[#22c55e]/15 text-[#4ade80] border border-[#22c55e]/40" 
                      : "bg-[#3b82f6]/15 text-[#60a5fa] border border-[#3b82f6]/40"
                  )}
                >
                  <Zap className="w-4 h-4" />
                  {style}
                </span>
              ))}
            </div>
          </div>

          {/* Energy Level Card */}
          <div className="bg-[#252b3b] rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-bold tracking-wider text-gray-400 uppercase">Energy Level</span>
              <span className="font-bold text-white">{energyInfo.label}</span>
            </div>
            <div className="h-3 bg-[#3a4156] rounded-full overflow-hidden">
              <div 
                className="h-full rounded-full bg-gradient-to-r from-[#ef4444] to-[#f87171]"
                style={{ width: `${energyInfo.value}%` }}
              />
            </div>
            <p className="text-sm text-gray-400 mt-3">
              Needs lots of exercise and active playdates
            </p>
          </div>

          {/* Size / Energy / Breed Cards */}
          <div className="grid grid-cols-3 gap-3">
            {/* Size Card */}
            <div className="bg-[#252b3b] rounded-2xl p-4 text-center">
              <div className="w-12 h-12 mx-auto mb-2 bg-[#a855f7]/20 rounded-full flex items-center justify-center">
                <Ruler className="w-6 h-6 text-[#a855f7]" />
              </div>
              <span className="text-xs text-gray-400 font-bold tracking-wider uppercase block">Size</span>
              <span className="font-bold text-white">{currentDog.size || 'Large'}</span>
            </div>
            
            {/* Energy Card */}
            <div className="bg-[#252b3b] rounded-2xl p-4 text-center">
              <div className="w-12 h-12 mx-auto mb-2 bg-[#FFD93D] rounded-full flex items-center justify-center">
                <Zap className="w-6 h-6 text-white" fill="white" />
              </div>
              <span className="text-xs text-gray-400 font-bold tracking-wider uppercase block">Energy</span>
              <span className="font-bold text-white">{energyInfo.label}</span>
            </div>
            
            {/* Breed Card */}
            <div className="bg-[#252b3b] rounded-2xl p-4 text-center">
              <div className="w-12 h-12 mx-auto mb-2 bg-[#3b82f6]/20 rounded-full flex items-center justify-center">
                <Shield className="w-6 h-6 text-[#3b82f6]" />
              </div>
              <span className="text-xs text-gray-400 font-bold tracking-wider uppercase block">Breed</span>
              <span className="font-bold text-white text-sm">{currentDog.breed || 'Golden Retriever'}</span>
            </div>
          </div>

          {/* About Section */}
          <div className="bg-[#252b3b] rounded-2xl p-5">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="text-sm font-bold tracking-wider text-gray-400 uppercase mb-3">
                  About {currentDog.name}
                </h3>
                <p className="text-gray-200 leading-relaxed">
                  {currentDog.bio || `Loves to play fetch and swim! Always ready for an adventure at the park. Great with other dogs and kids.`}
                </p>
              </div>
              <button className="w-10 h-10 bg-[#3a4156] rounded-full flex items-center justify-center ml-4 flex-shrink-0">
                <ChevronRight className="w-5 h-5 text-gray-300" />
              </button>
            </div>
          </div>

          {/* Request Playdate Button */}
          <Button 
            onClick={() => {
              if (!user) {
                toast.error('Please sign in to request a playdate');
                return;
              }
              if (userDogs.length === 0) {
                toast.error('Add a dog to your pack first');
                return;
              }
              if (currentDog.owner_id === user.id) {
                toast.info("That's your own pup!");
                return;
              }
              setPlaydateModalOpen(true);
            }}
            className="w-full h-14 rounded-2xl bg-[#FFD93D] hover:bg-[#f5cc2f] text-[#1a1f2e] font-bold text-lg shadow-lg"
          >
            <Heart className="w-5 h-5 mr-2" />
            Request Playdate
          </Button>

          {/* Playdate Modal */}
          {user && currentDog && (
            <RequestPlaydateModal
              open={playdateModalOpen}
              onOpenChange={setPlaydateModalOpen}
              targetDog={{
                id: currentDog.id,
                name: currentDog.name,
                avatar_url: currentDog.avatar_url,
                owner_id: currentDog.owner_id
              }}
              userDogs={userDogs}
              userId={user.id}
              onSuccess={() => toast.success('Playdate request sent!')}
            />
          )}

          {/* Divider */}
          <div className="border-t border-[#3a4156]" />

          {/* Pack Leader */}
          {currentDog.owner && (
            <div>
              <h3 className="text-sm font-bold tracking-wider text-gray-400 uppercase mb-3">
                Pack Leader
              </h3>
              <div className="bg-[#1e3a2f] rounded-2xl p-4 border border-[#4ade80]/30">
                <div className="flex items-center justify-between">
                  <UserProfilePopover
                    userId={currentDog.owner_id}
                    onMessage={user && currentDog.owner_id !== user.id ? () => handleMessage(currentDog.owner_id) : undefined}
                  >
                    <button className="flex items-center gap-3 text-left">
                      <Avatar className="w-12 h-12 border-2 border-[#4ade80]/30">
                        <AvatarImage src={currentDog.owner.avatar_url || undefined} />
                        <AvatarFallback className="bg-[#4ade80]/20">
                          <PawPrint className="w-6 h-6 text-[#4ade80]" />
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-semibold text-white">{currentDog.owner.display_name || 'Dog Parent'}</span>
                    </button>
                  </UserProfilePopover>
                  {user && currentDog.owner_id !== user.id && (() => {
                    const isFriend = friends.some(f => f.friend.id === currentDog.owner_id);
                    const friendshipRecord = friends.find(f => f.friend.id === currentDog.owner_id);
                    const isPending = sentRequests.some(r => r.friend.id === currentDog.owner_id);
                    const isIncoming = pendingRequests.some(r => r.friend.id === currentDog.owner_id);
                    const incomingReq = pendingRequests.find(r => r.friend.id === currentDog.owner_id);
                    
                    return (
                      <div className="flex flex-wrap gap-1.5">
                        {/* Friendship-specific button */}
                        {isFriend && friendshipRecord && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 rounded-full text-[#ef4444] hover:text-[#ef4444] hover:bg-[#ef4444]/10 text-xs font-semibold"
                            onClick={async (e) => {
                              e.stopPropagation();
                              const { error } = await removeFriend(friendshipRecord.id);
                              if (error) toast.error('Failed to unfriend');
                              else toast.success('Unfriended');
                            }}
                          >
                            <UserMinus className="w-3.5 h-3.5 mr-1" />
                            Unfriend
                          </Button>
                        )}
                        {isPending && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#f59e0b]/20 text-[#fbbf24] text-xs font-semibold border border-[#f59e0b]/30">
                            <ClockIcon className="w-3.5 h-3.5" />
                            Pending
                          </span>
                        )}
                        {isIncoming && incomingReq && (
                          <>
                            <Button
                              size="sm"
                              className="h-8 rounded-full bg-[#4ade80]/20 hover:bg-[#4ade80]/30 text-[#4ade80] border border-[#4ade80]/30 text-xs font-semibold"
                              onClick={async (e) => {
                                e.stopPropagation();
                                const { error } = await acceptRequest(incomingReq.id);
                                if (error) toast.error('Failed to accept request');
                                else toast.success('Friend request accepted!');
                              }}
                            >
                              <UserCheck className="w-3.5 h-3.5 mr-1" />
                              Accept
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 rounded-full text-[#ef4444] hover:text-[#ef4444] hover:bg-[#ef4444]/10 text-xs font-semibold"
                              onClick={async (e) => {
                                e.stopPropagation();
                                const { error } = await declineRequest(incomingReq.id);
                                if (error) toast.error('Failed to decline request');
                                else toast.success('Request declined');
                              }}
                            >
                              Decline
                            </Button>
                          </>
                        )}
                        {!isFriend && !isPending && !isIncoming && (
                          <Button
                            size="sm"
                            className="h-8 rounded-full bg-[#4ade80]/20 hover:bg-[#4ade80]/30 text-[#4ade80] border border-[#4ade80]/30 text-xs font-semibold"
                            onClick={async (e) => {
                              e.stopPropagation();
                              const { error } = await sendFriendRequest(currentDog.owner_id);
                              if (error) toast.error('Failed to send friend request');
                              else toast.success('Friend request sent!');
                            }}
                          >
                            <UserPlus className="w-3.5 h-3.5 mr-1" />
                            Add Friend
                          </Button>
                        )}
                        {/* Message - always visible */}
                        <Button
                          size="sm"
                          className="h-8 rounded-full bg-[#3b82f6]/20 hover:bg-[#3b82f6]/30 text-[#60a5fa] border border-[#3b82f6]/30 text-xs font-semibold"
                          onClick={async (e) => {
                            e.stopPropagation();
                            handleMessage(currentDog.owner_id);
                          }}
                        >
                          <MessageSquare className="w-3.5 h-3.5 mr-1" />
                          Message
                        </Button>
                        {/* Block - always visible */}
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 rounded-full text-[#ef4444] hover:text-[#ef4444] hover:bg-[#ef4444]/10 text-xs font-semibold"
                          onClick={async (e) => {
                            e.stopPropagation();
                            const { error } = await blockUser(currentDog.owner_id);
                            if (error) toast.error('Failed to block user');
                            else toast.success('User blocked');
                          }}
                        >
                          <ShieldBan className="w-3.5 h-3.5 mr-1" />
                          Block
                        </Button>
                      </div>
                    );
                  })()}
                  {(!user || currentDog.owner_id === user?.id) && (
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Mock Pack Leader if no owner */}
          {!currentDog.owner && (
            <div>
              <h3 className="text-sm font-bold tracking-wider text-gray-400 uppercase mb-3">
                Pack Leader
              </h3>
              <div className="bg-[#1e3a2f] rounded-2xl p-4 border border-[#4ade80]/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-12 h-12 border-2 border-[#4ade80]/30">
                      <AvatarFallback className="bg-[#4ade80]/20">
                        <PawPrint className="w-6 h-6 text-[#4ade80]" />
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-semibold text-white">Sarah Johnson</span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Gradient */}
      <div className="fixed bottom-20 left-0 right-0 h-20 bg-gradient-to-t from-[#7CB69D]/50 to-transparent pointer-events-none" />

    </div>
  );
}
