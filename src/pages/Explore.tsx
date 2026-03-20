import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Scissors as ScissorsIcon, Search, Dog, Scissors, Stethoscope, Home, MapPin, List, Map as MapIcon, BadgeCheck, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useServices, useNearbyServices, getServiceImage, Service } from '@/hooks/useServices';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { ServicesMap } from '@/components/explore/ServicesMap';
import { ExploreAssistant } from '@/components/explore/ExploreAssistant';
import { AddServiceCTA } from '@/components/explore/AddServiceCTA';
import { WeatherWidget } from '@/components/explore/WeatherWidget';
import { FreeTrialBanner } from '@/components/explore/FreeTrialBanner';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';

const serviceCategories = [
  { id: 'Dog Walkers', label: 'Dog Walkers', icon: Dog, color: 'bg-blue-100 text-blue-600', activeColor: 'bg-blue-500 text-white shadow-[0_0_20px_rgba(59,130,246,0.5)]' },
  { id: 'Daycare', label: 'Daycare', icon: Home, color: 'bg-green-100 text-green-600', activeColor: 'bg-green-500 text-white shadow-[0_0_20px_rgba(34,197,94,0.5)]' },
  { id: 'Vet Clinics', label: 'Vet Clinics', icon: Stethoscope, color: 'bg-red-100 text-red-600', activeColor: 'bg-red-500 text-white shadow-[0_0_20px_rgba(239,68,68,0.5)]' },
  { id: 'Trainers', label: 'Trainers', icon: Dog, color: 'bg-orange-100 text-orange-600', activeColor: 'bg-orange-500 text-white shadow-[0_0_20px_rgba(249,115,22,0.5)]' },
  { id: 'Groomers', label: 'Groomers', icon: Scissors, color: 'bg-purple-100 text-purple-600', activeColor: 'bg-purple-500 text-white shadow-[0_0_20px_rgba(168,85,247,0.5)]' },
];

export default function Explore() {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [userCoords, setUserCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [isLocating, setIsLocating] = useState(true);
  const [nearMeMode, setNearMeMode] = useState(true);

  // Auto-locate on page load
  useEffect(() => {
    if (!navigator.geolocation) {
      setNearMeMode(false);
      setIsLocating(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserCoords({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setIsLocating(false);
        toast.success("Showing services near you!");
      },
      () => {
        setNearMeMode(false);
        setIsLocating(false);
        toast.error("Could not get your location. Showing all services.");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  const { data: services, isLoading, refetch: refetchServices } = useServices(selectedCategory);
  const { data: nearbyServices, isLoading: nearbyLoading, refetch: refetchNearby } = useNearbyServices(
    nearMeMode ? userCoords : null,
    selectedCategory
  );

  const handlePullRefresh = useCallback(async () => {
    if (nearMeMode) { await refetchNearby(); } else { await refetchServices(); }
  }, [nearMeMode, refetchNearby, refetchServices]);

  const { containerRef: pullRefreshRef, PullIndicator } = usePullToRefresh({ onRefresh: handlePullRefresh });

  const handleCategoryClick = (categoryId: string) => {
    setSelectedCategory(prev => prev === categoryId ? null : categoryId);
  };

  const handleFindNearMe = () => {
    if (nearMeMode) {
      // Toggle off near me mode
      setNearMeMode(false);
      toast.info("Showing all services");
      return;
    }

    if (!navigator.geolocation) {
      toast.error("Geolocation not supported");
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserCoords({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });
        setNearMeMode(true);
        setIsLocating(false);
        toast.success("Showing services near you!");
      },
      () => {
        setIsLocating(false);
        toast.error("Could not get your location");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Use nearby services when in nearMeMode, otherwise use regular services
  const activeServices = nearMeMode ? nearbyServices : services;
  const activeLoading = nearMeMode ? nearbyLoading : isLoading;

  // Filter services by search query
  const filteredServices = activeServices?.filter(service => 
    searchQuery === '' || 
    service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    service.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div ref={pullRefreshRef} className="min-h-screen pb-24 overflow-y-auto">
      {/* Header */}
      <div className="bg-card/95 backdrop-blur border-b border-border p-4 space-y-3 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ScissorsIcon className="w-6 h-6 text-primary" />
            Services
          </h1>
          <div className="flex gap-2">
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="rounded-full"
            >
              <List className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'map' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('map')}
              className="rounded-full"
            >
              <MapIcon className="w-4 h-4" />
            </Button>
          </div>
        </div>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Search pet services..."
              className="pl-10 rounded-full"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button
            variant={nearMeMode ? "default" : "outline"}
            size="icon"
            className="rounded-full shrink-0"
            onClick={handleFindNearMe}
            disabled={isLocating}
            title={nearMeMode ? "Show all services" : "Find services near me"}
          >
            {isLocating ? <Loader2 className="w-4 h-4 animate-spin" /> : <MapPin className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Category Pills */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {serviceCategories.map(cat => {
            const Icon = cat.icon;
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => handleCategoryClick(cat.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-full whitespace-nowrap font-medium transition-all duration-300 ${
                  isSelected 
                    ? cat.activeColor
                    : `${cat.color} hover:opacity-80`
                }`}
              >
                <Icon className="w-4 h-4" />
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Weather Widget */}
        {userCoords && (
          <WeatherWidget latitude={userCoords.latitude} longitude={userCoords.longitude} />
        )}

        {/* Free Trial / Subscription Status */}
        <FreeTrialBanner />

        {/* Add Service CTA */}
        <AddServiceCTA />

{/* Map View */}
        {viewMode === 'map' && (
          <ServicesMap 
            services={filteredServices || []} 
            selectedCategory={selectedCategory}
            onServiceClick={(id) => navigate(`/services/${id}`)}
          />
        )}

        {/* List View */}
        {viewMode === 'list' && (
          <div>
            <h2 className="font-bold text-lg mb-3 flex items-center gap-2">
              {nearMeMode ? 'Near You' : (selectedCategory ? selectedCategory : 'Nearby Services')}
              {filteredServices && (
                <Badge variant="secondary">{filteredServices.length}</Badge>
              )}
            </h2>
            <div className="space-y-3">
              {activeLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <Card key={i} className="p-4">
                    <div className="flex items-start gap-4">
                      <Skeleton className="w-20 h-20 rounded-xl" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-5 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                        <Skeleton className="h-4 w-1/4" />
                      </div>
                    </div>
                  </Card>
                ))
              ) : filteredServices && filteredServices.length > 0 ? (
                filteredServices.map(service => (
                  <ServiceCard key={service.id} service={service} onClick={() => navigate(`/services/${service.id}`)} />
                ))
              ) : (
                <Card className="p-6 text-center bg-muted/50">
                  <Dog className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
                  <h3 className="font-bold">No services found</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {selectedCategory 
                      ? `No ${selectedCategory} available yet. Check back soon!`
                      : 'No services available in your area yet.'}
                  </p>
                </Card>
              )}
            </div>

          </div>
        )}
      </div>
      
      {/* AI Assistant FAB */}
      <ExploreAssistant />
    </div>
  );
}

const categoryColorMap: Record<string, string> = {
  'Dog Walkers': 'bg-blue-100 text-blue-600 border-blue-200',
  'Daycare': 'bg-green-100 text-green-600 border-green-200',
  'Vet Clinics': 'bg-red-100 text-red-600 border-red-200',
  'Trainers': 'bg-orange-100 text-orange-600 border-orange-200',
  'Groomers': 'bg-purple-100 text-purple-600 border-purple-200',
};

function ServiceCard({ service, onClick }: { service: Service; onClick: () => void }) {
  const imageUrl = getServiceImage(service);
  const badgeColor = categoryColorMap[service.category] || '';
  
  return (
    <Card className="p-4 card-playful cursor-pointer hover:shadow-lg transition-shadow" onClick={onClick}>
      <div className="flex items-start gap-4">
        <div className="relative">
          <img 
            src={imageUrl} 
            alt={service.name}
            className="w-20 h-20 rounded-xl object-cover"
          />
          {service.is_verified && (
            <div className="absolute -top-1 -right-1 bg-success text-success-foreground rounded-full p-0.5" title="Verified Business">
              <BadgeCheck className="w-4 h-4" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <h3 className="font-bold truncate">{service.name}</h3>
              {service.is_verified && (
                <BadgeCheck className="w-4 h-4 text-success shrink-0" />
              )}
            </div>
            <div className="flex items-center gap-1 shrink-0">
              {service.is_verified && (
                <Badge variant="outline" className="border-success text-success text-xs">Verified</Badge>
              )}
              {service.is_featured && (
                <Badge variant="default" className="shrink-0">Featured</Badge>
              )}
            </div>
          </div>
          <Badge variant="secondary" className={`mt-1 border ${badgeColor}`}>{service.category}</Badge>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
            <span className="text-warning flex items-center gap-0.5">
              ★ {service.rating}
            </span>
            {service.distance && (
              <>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {service.distance}
                </span>
              </>
            )}
          </div>
          <p className="text-sm font-medium text-primary mt-1">{service.price}</p>
          {service.enriched_description && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{service.enriched_description}</p>
          )}
        </div>
      </div>
    </Card>
  );
}
