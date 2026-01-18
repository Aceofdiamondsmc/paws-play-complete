import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Star, Phone, Globe, Clock, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useService, getServiceImage } from '@/hooks/useServices';

export default function ServiceDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: service, isLoading, error } = useService(id);

  if (isLoading) {
    return (
      <div className="min-h-screen pb-24">
        <div className="relative">
          <Skeleton className="w-full h-64" />
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 left-4 bg-background/80 backdrop-blur rounded-full"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </div>
        <div className="p-4 space-y-4">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    );
  }

  if (error || !service) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <h2 className="text-xl font-bold mb-2">Service not found</h2>
        <p className="text-muted-foreground mb-4">This service may have been removed.</p>
        <Button onClick={() => navigate('/explore')}>Back to Explore</Button>
      </div>
    );
  }

  const imageUrl = getServiceImage(service);

  return (
    <div className="min-h-screen pb-24">
      {/* Hero Image */}
      <div className="relative">
        <img
          src={imageUrl}
          alt={service.name}
          className="w-full h-64 object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-4 left-4 bg-background/80 backdrop-blur rounded-full"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        {service.is_featured && (
          <Badge className="absolute top-4 right-4 bg-primary">Featured</Badge>
        )}
      </div>

      {/* Content */}
      <div className="p-4 space-y-6 -mt-8 relative">
        <Card className="p-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold">{service.name}</h1>
              <Badge variant="secondary" className="mt-2">{service.category}</Badge>
            </div>
            <div className="flex items-center gap-1 text-warning">
              <Star className="w-5 h-5 fill-current" />
              <span className="font-bold">{service.rating}</span>
            </div>
          </div>
        </Card>

        {/* Quick Info */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="p-3 flex items-center gap-3">
            <div className="p-2 rounded-full bg-primary/10">
              <DollarSign className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Price</p>
              <p className="font-semibold">{service.price}</p>
            </div>
          </Card>
          {service.distance && (
            <Card className="p-3 flex items-center gap-3">
              <div className="p-2 rounded-full bg-accent/10">
                <MapPin className="w-5 h-5 text-accent" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Distance</p>
                <p className="font-semibold">{service.distance}</p>
              </div>
            </Card>
          )}
        </div>

        {/* Description */}
        {service.description && (
          <Card className="p-4">
            <h2 className="font-bold mb-2">About</h2>
            <p className="text-muted-foreground">{service.description}</p>
          </Card>
        )}

        {/* Map Preview */}
        {service.latitude && service.longitude && (
          <Card className="p-4">
            <h2 className="font-bold mb-2">Location</h2>
            <div className="h-40 bg-muted rounded-lg flex items-center justify-center">
              <div className="text-center">
                <MapPin className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  {service.latitude.toFixed(4)}, {service.longitude.toFixed(4)}
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button className="flex-1 rounded-full" size="lg">
            <Phone className="w-4 h-4 mr-2" />
            Contact
          </Button>
          <Button variant="outline" className="flex-1 rounded-full" size="lg">
            <Globe className="w-4 h-4 mr-2" />
            Website
          </Button>
        </div>
      </div>
    </div>
  );
}
