import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Store, MapPin, Loader2, CheckCircle, AlertCircle, Download } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useServices } from '@/hooks/useServices';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from '@/components/ui/use-toast';

const CATEGORIES = [
  { id: 'Dog Walkers', label: 'Dog Walkers' },
  { id: 'Groomers', label: 'Groomers' },
  { id: 'Vet Clinics', label: 'Vet Clinics' },
  { id: 'Trainers', label: 'Trainers' },
  { id: 'Daycare', label: 'Daycare' },
];

export default function AdminServices() {
  const [location, setLocation] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>(CATEGORIES.map(c => c.id));
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<{
    success: boolean;
    imported: number;
    services: Array<{ name: string; category: string }>;
    errors?: string[];
  } | null>(null);

  const { data: services, isLoading } = useServices();
  const queryClient = useQueryClient();

  const handleCategoryToggle = (categoryId: string) => {
    setSelectedCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(c => c !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleImport = async () => {
    if (!location.trim()) {
      toast({
        title: "Location required",
        description: "Please enter a city name or coordinates",
        variant: "destructive",
      });
      return;
    }

    if (selectedCategories.length === 0) {
      toast({
        title: "Categories required",
        description: "Please select at least one category to import",
        variant: "destructive",
      });
      return;
    }

    setIsImporting(true);
    setImportResult(null);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;

      if (!token) {
        throw new Error("Not authenticated");
      }

      const response = await supabase.functions.invoke('import-services', {
        body: {
          location: location.trim(),
          categories: selectedCategories,
        },
      });

      if (response.error) {
        throw new Error(response.error.message || "Import failed");
      }

      setImportResult(response.data);
      
      if (response.data.imported > 0) {
        toast({
          title: "Import successful!",
          description: `Imported ${response.data.imported} services near ${location}`,
        });
        // Refresh services list
        queryClient.invalidateQueries({ queryKey: ['services'] });
      } else {
        toast({
          title: "No new services found",
          description: "All services in this area may already be imported",
        });
      }
    } catch (error) {
      console.error("Import error:", error);
      toast({
        title: "Import failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
    }
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast({
        title: "Geolocation not supported",
        description: "Your browser doesn't support location services",
        variant: "destructive",
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation(`${position.coords.latitude},${position.coords.longitude}`);
        toast({
          title: "Location detected",
          description: "Using your current coordinates",
        });
      },
      (error) => {
        toast({
          title: "Location error",
          description: error.message,
          variant: "destructive",
        });
      }
    );
  };

  // Group services by category for stats
  const servicesByCategory = services?.reduce((acc, service) => {
    acc[service.category] = (acc[service.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Services Management</h1>
        <p className="text-muted-foreground">Import and manage pet services from Google Places</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {CATEGORIES.map(cat => (
          <Card key={cat.id}>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold">{servicesByCategory[cat.id] || 0}</div>
              <div className="text-sm text-muted-foreground">{cat.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Import Services Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Import Services from Google Places
          </CardTitle>
          <CardDescription>
            Search for pet services in any location and import them to your database
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Location Input */}
          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <div className="flex gap-2">
              <Input
                id="location"
                placeholder="Enter city name (e.g., Boston, MA) or coordinates"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                disabled={isImporting}
                className="flex-1"
              />
              <Button
                variant="outline"
                onClick={handleUseCurrentLocation}
                disabled={isImporting}
              >
                <MapPin className="h-4 w-4 mr-2" />
                Use My Location
              </Button>
            </div>
          </div>

          {/* Category Selection */}
          <div className="space-y-2">
            <Label>Categories to Import</Label>
            <div className="flex flex-wrap gap-4">
              {CATEGORIES.map(cat => (
                <div key={cat.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={cat.id}
                    checked={selectedCategories.includes(cat.id)}
                    onCheckedChange={() => handleCategoryToggle(cat.id)}
                    disabled={isImporting}
                  />
                  <Label htmlFor={cat.id} className="text-sm font-normal cursor-pointer">
                    {cat.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Import Button */}
          <Button
            onClick={handleImport}
            disabled={isImporting || !location.trim() || selectedCategories.length === 0}
            className="w-full"
          >
            {isImporting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Importing Services...
              </>
            ) : (
              <>
                <Store className="h-4 w-4 mr-2" />
                Import Services
              </>
            )}
          </Button>

          {/* Import Results */}
          {importResult && (
            <div className="mt-4 p-4 bg-muted rounded-lg space-y-3">
              <div className="flex items-center gap-2">
                {importResult.imported > 0 ? (
                  <CheckCircle className="h-5 w-5 text-success" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-warning" />
                )}
                <span className="font-medium">
                  Imported {importResult.imported} services
                </span>
              </div>

              {importResult.services.length > 0 && (
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">Imported services:</div>
                  <div className="flex flex-wrap gap-2">
                    {importResult.services.slice(0, 10).map((service, i) => (
                      <Badge key={i} variant="secondary">
                        {service.name}
                      </Badge>
                    ))}
                    {importResult.services.length > 10 && (
                      <Badge variant="outline">
                        +{importResult.services.length - 10} more
                      </Badge>
                    )}
                  </div>
                </div>
              )}

              {importResult.errors && importResult.errors.length > 0 && (
                <div className="space-y-1">
                  <div className="text-sm text-destructive">Errors:</div>
                  {importResult.errors.map((error, i) => (
                    <div key={i} className="text-sm text-muted-foreground">• {error}</div>
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Services List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Store className="h-5 w-5" />
            All Services
            {services && (
              <Badge variant="secondary">{services.length}</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : services && services.length > 0 ? (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {services.map(service => (
                <div
                  key={service.id}
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div>
                      <div className="font-medium">{service.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {service.category} • ★ {service.rating}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {service.is_verified && (
                      <Badge variant="default" className="bg-success">Verified</Badge>
                    )}
                    {service.is_flagged && (
                      <Badge variant="destructive">Flagged</Badge>
                    )}
                    <Badge variant="outline">{service.enrichment_status}</Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No services yet. Import some using the form above!
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
