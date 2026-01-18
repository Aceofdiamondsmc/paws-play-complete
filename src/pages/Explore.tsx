import { useState } from 'react';
import { Compass, Search, Dog, Scissors, Stethoscope, Home, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useServices } from '@/hooks/useServices';
import { Skeleton } from '@/components/ui/skeleton';

const serviceCategories = [
  { id: 'Dog Walkers', label: 'Dog Walkers', icon: Dog, color: 'bg-primary/10 text-primary' },
  { id: 'Daycare', label: 'Daycare', icon: Home, color: 'bg-accent/10 text-accent' },
  { id: 'Vet Clinics', label: 'Vet Clinics', icon: Stethoscope, color: 'bg-success/10 text-success' },
  { id: 'Trainers', label: 'Trainers', icon: Dog, color: 'bg-warning/10 text-warning' },
  { id: 'Groomers', label: 'Groomers', icon: Scissors, color: 'bg-secondary text-secondary-foreground' },
];

export default function Explore() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const { data: services, isLoading } = useServices(selectedCategory);

  const handleCategoryClick = (categoryId: string) => {
    setSelectedCategory(prev => prev === categoryId ? null : categoryId);
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="bg-card/95 backdrop-blur border-b border-border p-4 space-y-3">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Compass className="w-6 h-6 text-primary" />
          Explore
        </h1>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Search pet services..."
            className="pl-10 rounded-full"
          />
        </div>
      </div>

      <div className="p-4 space-y-6">
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

        {/* Services List */}
        <div>
          <h2 className="font-bold text-lg mb-3">
            {selectedCategory ? `${selectedCategory}s` : 'Nearby Services'}
          </h2>
          <div className="space-y-3">
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <Card key={i} className="p-4">
                  <div className="flex items-start gap-4">
                    <Skeleton className="w-16 h-16 rounded-xl" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-5 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                      <Skeleton className="h-4 w-1/4" />
                    </div>
                  </div>
                </Card>
              ))
            ) : services && services.length > 0 ? (
              services.map(service => (
                <Card key={service.id} className="p-4 card-playful">
                  <div className="flex items-start gap-4">
                    {service.image_url ? (
                      <img 
                        src={service.image_url} 
                        alt={service.name}
                        className="w-16 h-16 rounded-xl object-cover"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-muted rounded-xl flex items-center justify-center">
                        <Dog className="w-8 h-8 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold">{service.name}</h3>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                        <span className="text-warning">★ {service.rating}</span>
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
                    <Button size="sm" className="rounded-full">
                      View
                    </Button>
                  </div>
                </Card>
              ))
            ) : (
              <Card className="p-6 text-center bg-muted/50">
                <Dog className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
                <h3 className="font-bold">No services found</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {selectedCategory 
                    ? `No ${selectedCategory}s available yet. Check back soon!`
                    : 'No services available in your area yet.'}
                </p>
              </Card>
            )}
          </div>
        </div>

        {/* Coming Soon Notice */}
        <Card className="p-6 text-center bg-muted/50">
          <Compass className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
          <h3 className="font-bold">More services coming soon!</h3>
          <p className="text-sm text-muted-foreground mt-1">
            We're adding more local pet services to help you and your pup.
          </p>
        </Card>
      </div>
    </div>
  );
}
