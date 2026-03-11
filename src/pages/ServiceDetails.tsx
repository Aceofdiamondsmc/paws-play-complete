import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Star, Phone, Globe, Clock, DollarSign, BadgeCheck, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useService, getServiceImage } from '@/hooks/useServices';
import { ServiceLocationMap } from '@/components/explore/ServiceLocationMap';

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
        <Button onClick={() => navigate('/services')}>Back to Services</Button>
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
        <div className="absolute top-4 right-4 flex items-center gap-2">
          {service.is_verified && (
            <Badge className="bg-success text-success-foreground">
              <BadgeCheck className="w-3 h-3 mr-1" />
              Verified
            </Badge>
          )}
          {service.is_featured && (
            <Badge className="bg-primary">Featured</Badge>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-6 -mt-8 relative">
        <Card className="p-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold">{service.name}</h1>
                {service.is_verified && (
                  <BadgeCheck className="w-6 h-6 text-success" />
                )}
              </div>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="secondary">{service.category}</Badge>
                {service.is_verified && (
                  <span className="text-xs text-success flex items-center gap-1">
                    <BadgeCheck className="w-3 h-3" />
                    Google Verified
                  </span>
                )}
              </div>
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
        {(service.enriched_description || service.description) && (
          <Card className="p-4">
            <h2 className="font-bold mb-2">About</h2>
            <p className="text-muted-foreground">
              {service.enriched_description || service.description}
            </p>
          </Card>
        )}

{/* Map Preview - Use verified coordinates when available */}
        {(() => {
          const lat = service.is_verified && service.verified_latitude ? service.verified_latitude : service.latitude;
          const lng = service.is_verified && service.verified_longitude ? service.verified_longitude : service.longitude;
          
          if (!lat || !lng) return null;
          
          return (
            <Card className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-bold">Location</h2>
                {service.is_verified && (
                  <span className="text-xs text-success flex items-center gap-1">
                    <BadgeCheck className="w-3 h-3" />
                    Verified Address
                  </span>
                )}
              </div>
              <ServiceLocationMap 
                latitude={lat}
                longitude={lng}
                name={service.name}
                isVerified={service.is_verified}
              />
            </Card>
          );
        })()}

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button 
            className="flex-1 rounded-full" 
            size="lg"
            disabled={!service.phone}
            onClick={() => {
              if (service.phone) {
                window.location.href = `tel:${service.phone.replace(/\D/g, '')}`;
              }
            }}
          >
            <Phone className="w-4 h-4 mr-2" />
            Contact
          </Button>
          <Button 
            variant="outline" 
            className="flex-1 rounded-full" 
            size="lg"
            disabled={!service.website}
            onClick={() => {
              if (service.website) {
                window.open(service.website, '_blank', 'noopener,noreferrer');
              }
            }}
          >
            <Globe className="w-4 h-4 mr-2" />
            Website
          </Button>
        </div>
      </div>
    </div>
  );
}
