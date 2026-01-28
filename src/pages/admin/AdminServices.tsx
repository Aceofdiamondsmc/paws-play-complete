import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Store, MapPin, Loader2, CheckCircle, AlertCircle, Download, Wand2, ImageIcon } from 'lucide-react';
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

  // Image generation state
  const [isGeneratingImages, setIsGeneratingImages] = useState(false);
  const [imageGenProgress, setImageGenProgress] = useState<{
    processed: number;
    successful: number;
    failed: number;
    results: Array<{ id: number; name: string; success: boolean; error?: string }>;
  } | null>(null);
  const [imageStatus, setImageStatus] = useState<{
    total: number;
    hasValidImage: number;
    needsImage: number;
  } | null>(null);

  const { data: services, isLoading } = useServices();
  const queryClient = useQueryClient();

  // Fetch image status on mount
  useEffect(() => {
    fetchImageStatus();
  }, []);

  const fetchImageStatus = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('generate-service-images', {
        body: { action: 'get_status' }
      });
      if (!error && data) {
        setImageStatus(data);
      }
    } catch (e) {
      console.error('Failed to fetch image status:', e);
    }
  };

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

  const handleGenerateImages = async (batchSize: number = 5) => {
    setIsGeneratingImages(true);
    setImageGenProgress(null);

    try {
      const { data, error } = await supabase.functions.invoke('generate-service-images', {
        body: { action: 'process_batch', limit: batchSize }
      });

      if (error) {
        throw new Error(error.message || "Image generation failed");
      }

      setImageGenProgress(data);
      
      if (data.successful > 0) {
        toast({
          title: "Images generated!",
          description: `Successfully generated ${data.successful} images`,
        });
        queryClient.invalidateQueries({ queryKey: ['services'] });
        fetchImageStatus();
      } else if (data.processed === 0) {
        toast({
          title: "All images up to date",
          description: "No services need new images",
        });
      } else {
        toast({
          title: "Generation completed with errors",
          description: `${data.failed} images failed to generate`,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Image generation error:", error);
      toast({
        title: "Image generation failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingImages(false);
    }
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

      {/* Generate Service Images Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wand2 className="h-5 w-5" />
            AI Image Generation
          </CardTitle>
          <CardDescription>
            Generate unique, professional images for services using AI
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Image Status */}
          {imageStatus && (
            <div className="flex items-center gap-4 p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-2">
                <ImageIcon className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  <span className="font-medium">{imageStatus.hasValidImage}</span> with images
                </span>
              </div>
              <div className="h-4 w-px bg-border" />
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-warning" />
                <span className="text-sm">
                  <span className="font-medium">{imageStatus.needsImage}</span> need images
                </span>
              </div>
            </div>
          )}

          {/* Generate Buttons */}
          <div className="flex gap-2">
            <Button
              onClick={() => handleGenerateImages(5)}
              disabled={isGeneratingImages || (imageStatus?.needsImage === 0)}
              className="flex-1"
            >
              {isGeneratingImages ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Wand2 className="h-4 w-4 mr-2" />
                  Generate 5 Images
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => handleGenerateImages(10)}
              disabled={isGeneratingImages || (imageStatus?.needsImage === 0)}
            >
              Generate 10
            </Button>
          </div>

          {/* Generation Progress */}
          {imageGenProgress && (
            <div className="mt-4 p-4 bg-muted rounded-lg space-y-3">
              <div className="flex items-center gap-2">
                {imageGenProgress.successful > 0 ? (
                  <CheckCircle className="h-5 w-5 text-success" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-warning" />
                )}
                <span className="font-medium">
                  Generated {imageGenProgress.successful} of {imageGenProgress.processed} images
                </span>
              </div>

              {imageGenProgress.results.length > 0 && (
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">Results:</div>
                  <div className="flex flex-wrap gap-2">
                    {imageGenProgress.results.map((result, i) => (
                      <Badge 
                        key={i} 
                        variant={result.success ? "default" : "destructive"}
                      >
                        {result.name.slice(0, 20)}{result.name.length > 20 ? '...' : ''}
                        {result.success ? ' ✓' : ' ✗'}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {imageGenProgress.failed > 0 && (
                <div className="text-sm text-destructive">
                  {imageGenProgress.failed} images failed to generate
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
