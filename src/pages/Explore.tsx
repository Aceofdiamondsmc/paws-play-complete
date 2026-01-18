import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Compass, Search, Dog, Scissors, Stethoscope, Home, MapPin, List, Map as MapIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useServices, getServiceImage, Service } from '@/hooks/useServices';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

// Initialize Mapbox
mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN || '';

const serviceCategories = [
  { id: 'Dog Walkers', label: 'Dog Walkers', icon: Dog, color: 'bg-primary/10 text-primary', markerColor: '#8B5CF6' },
  { id: 'Daycare', label: 'Daycare', icon: Home, color: 'bg-accent/10 text-accent', markerColor: '#F97316' },
  { id: 'Vet Clinics', label: 'Vet Clinics', icon: Stethoscope, color: 'bg-success/10 text-success', markerColor: '#22C55E' },
  { id: 'Trainers', label: 'Trainers', icon: Dog, color: 'bg-warning/10 text-warning', markerColor: '#EAB308' },
  { id: 'Groomers', label: 'Groomers', icon: Scissors, color: 'bg-secondary text-secondary-foreground', markerColor: '#EC4899' },
];

function getCategoryColor(category: string): string {
  const cat = serviceCategories.find(c => c.id === category);
  return cat?.markerColor || '#8B5CF6';
}

export default function Explore() {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const { data: services, isLoading } = useServices(selectedCategory);
  
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);

  const handleCategoryClick = (categoryId: string) => {
    setSelectedCategory(prev => prev === categoryId ? null : categoryId);
  };

  // Filter services by search query
  const filteredServices = services?.filter(service => 
    searchQuery === '' || 
    service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    service.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Initialize map
  useEffect(() => {
    if (viewMode !== 'map' || !mapContainer.current || map.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [-122.4194, 37.7749], // San Francisco default
      zoom: 12,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [viewMode]);

  // Update markers when services change
  useEffect(() => {
    if (!map.current || viewMode !== 'map') return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    if (!filteredServices?.length) return;

    const bounds = new mapboxgl.LngLatBounds();
    let hasValidCoords = false;

    filteredServices.forEach(service => {
      if (service.latitude && service.longitude) {
        hasValidCoords = true;
        const color = getCategoryColor(service.category);
        
        // Create custom marker element
        const el = document.createElement('div');
        el.className = 'service-marker';
        el.innerHTML = `
          <div style="
            width: 36px;
            height: 36px;
            background: ${color};
            border-radius: 50%;
            border: 3px solid white;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: transform 0.2s;
          ">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="white" stroke="white" stroke-width="2">
              <path d="M10 16c-3.5 0-6-2.5-6-5.5S6.5 5 10 5c3.5 0 6 2.5 6 5.5S13.5 16 10 16z"/>
              <path d="M14 14l6 6"/>
            </svg>
          </div>
        `;
        el.addEventListener('mouseenter', () => {
          el.querySelector('div')!.style.transform = 'scale(1.2)';
        });
        el.addEventListener('mouseleave', () => {
          el.querySelector('div')!.style.transform = 'scale(1)';
        });

        // Create popup
        const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`
          <div style="padding: 8px; min-width: 150px;">
            <h3 style="font-weight: 600; margin-bottom: 4px;">${service.name}</h3>
            <p style="color: #666; font-size: 12px; margin-bottom: 4px;">${service.category}</p>
            <div style="display: flex; align-items: center; gap: 4px; color: #EAB308;">
              <span>★</span>
              <span style="font-weight: 500;">${service.rating}</span>
            </div>
            <p style="color: #8B5CF6; font-weight: 500; margin-top: 4px;">${service.price}</p>
          </div>
        `);

        const marker = new mapboxgl.Marker(el)
          .setLngLat([service.longitude, service.latitude])
          .setPopup(popup)
          .addTo(map.current!);

        el.addEventListener('click', () => {
          navigate(`/explore/${service.id}`);
        });

        markersRef.current.push(marker);
        bounds.extend([service.longitude, service.latitude]);
      }
    });

    if (hasValidCoords && !bounds.isEmpty()) {
      map.current.fitBounds(bounds, { padding: 60, maxZoom: 14 });
    }
  }, [filteredServices, viewMode, navigate]);

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <div className="bg-card/95 backdrop-blur border-b border-border p-4 space-y-3 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Compass className="w-6 h-6 text-primary" />
            Explore
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
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Search pet services..."
            className="pl-10 rounded-full"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
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
                className={`flex items-center gap-2 px-4 py-2.5 rounded-full whitespace-nowrap font-medium transition-all ${
                  isSelected 
                    ? 'bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2' 
                    : `${cat.color} hover:opacity-80`
                }`}
              >
                <Icon className="w-4 h-4" />
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Map View */}
        {viewMode === 'map' && (
          <div className="relative rounded-xl overflow-hidden border border-border">
            <div ref={mapContainer} className="w-full h-[60vh]" />
            {isLoading && (
              <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Loading services...</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* List View */}
        {viewMode === 'list' && (
          <div>
            <h2 className="font-bold text-lg mb-3 flex items-center gap-2">
              {selectedCategory ? selectedCategory : 'Nearby Services'}
              {filteredServices && (
                <Badge variant="secondary">{filteredServices.length}</Badge>
              )}
            </h2>
            <div className="space-y-3">
              {isLoading ? (
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
                  <ServiceCard key={service.id} service={service} onClick={() => navigate(`/explore/${service.id}`)} />
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
    </div>
  );
}

function ServiceCard({ service, onClick }: { service: Service; onClick: () => void }) {
  const imageUrl = getServiceImage(service);
  
  return (
    <Card className="p-4 card-playful cursor-pointer hover:shadow-lg transition-shadow" onClick={onClick}>
      <div className="flex items-start gap-4">
        <img 
          src={imageUrl} 
          alt={service.name}
          className="w-20 h-20 rounded-xl object-cover"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-bold truncate">{service.name}</h3>
            {service.is_featured && (
              <Badge variant="default" className="shrink-0">Featured</Badge>
            )}
          </div>
          <Badge variant="secondary" className="mt-1">{service.category}</Badge>
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
        </div>
      </div>
    </Card>
  );
}
