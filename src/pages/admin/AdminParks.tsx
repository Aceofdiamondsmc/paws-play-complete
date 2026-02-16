import { useState, useRef } from 'react';
import { useParks } from '@/hooks/useParks';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useImageUpload } from '@/hooks/useImageUpload';
import { Plus, Pencil, Trash2, Search, Loader2, MapPin, Star, Upload, X } from 'lucide-react';
import type { Park } from '@/types';

interface ParkFormData {
  name: string;
  address: string;
  city: string;
  state: string;
  description: string;
  latitude: number | null;
  longitude: number | null;
  image_url: string;
  is_fully_fenced: boolean;
  has_water_station: boolean;
  has_small_dog_area: boolean;
  has_large_dog_area: boolean;
  has_agility_equipment: boolean;
  has_parking: boolean;
  has_grass_surface: boolean;
  is_dog_friendly: boolean;
}

const initialFormData: ParkFormData = {
  name: '',
  address: '',
  city: '',
  state: '',
  description: '',
  latitude: null,
  longitude: null,
  image_url: '',
  is_fully_fenced: false,
  has_water_station: false,
  has_small_dog_area: false,
  has_large_dog_area: false,
  has_agility_equipment: false,
  has_parking: false,
  has_grass_surface: false,
  is_dog_friendly: true,
};

export default function AdminParks() {
  const { allParks, loading, refresh } = useParks();
  const { toast } = useToast();
  const { uploadImage, uploading: parkImageUploading } = useImageUpload();
  const parkFileInputRef = useRef<HTMLInputElement>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedPark, setSelectedPark] = useState<Park | null>(null);
  const [formData, setFormData] = useState<ParkFormData>(initialFormData);
  const [isSaving, setIsSaving] = useState(false);

  const filteredParks = allParks.filter(park =>
    park.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    park.address?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    park.city?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleOpenCreate = () => {
    setSelectedPark(null);
    setFormData(initialFormData);
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (park: Park) => {
    setSelectedPark(park);
    setFormData({
      name: park.name || '',
      address: park.address || '',
      city: park.city || '',
      state: park.state || '',
      description: park.description || '',
      latitude: park.latitude || null,
      longitude: park.longitude || null,
      image_url: (park as any).image_url || '',
      is_fully_fenced: park.is_fully_fenced || false,
      has_water_station: park.has_water_station || false,
      has_small_dog_area: park.has_small_dog_area || false,
      has_large_dog_area: park.has_large_dog_area || false,
      has_agility_equipment: park.has_agility_equipment || false,
      has_parking: park.has_parking || false,
      has_grass_surface: park.has_grass_surface || false,
      is_dog_friendly: park.is_dog_friendly ?? true,
    });
    setIsDialogOpen(true);
  };

  const handleOpenDelete = (park: Park) => {
    setSelectedPark(park);
    setIsDeleteDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast({ title: 'Error', description: 'Park name is required', variant: 'destructive' });
      return;
    }

    setIsSaving(true);
    try {
      const parkData = {
        name: formData.name,
        address: formData.address || null,
        city: formData.city || null,
        state: formData.state || null,
        description: formData.description || null,
        latitude: formData.latitude,
        longitude: formData.longitude,
        image_url: formData.image_url.trim() || null,
        is_fully_fenced: formData.is_fully_fenced,
        has_water_station: formData.has_water_station,
        has_small_dog_area: formData.has_small_dog_area,
        has_large_dog_area: formData.has_large_dog_area,
        has_agility_equipment: formData.has_agility_equipment,
        has_parking: formData.has_parking,
        has_grass_surface: formData.has_grass_surface,
        is_dog_friendly: formData.is_dog_friendly,
      };

      if (selectedPark) {
        // Update existing park
        const { error } = await supabase
          .from('parks')
          .update(parkData)
          .eq('Id', parseInt(selectedPark.id));

        if (error) throw error;
        toast({ title: 'Success', description: 'Park updated successfully' });
      } else {
        // Create new park - need to get next ID
        const { data: maxIdData } = await supabase
          .from('parks')
          .select('Id')
          .order('Id', { ascending: false })
          .limit(1)
          .single();
        
        const nextId = (maxIdData?.Id || 0) + 1;

        const { error } = await supabase
          .from('parks')
          .insert({ ...parkData, Id: nextId });

        if (error) throw error;
        toast({ title: 'Success', description: 'Park created successfully' });
      }

      setIsDialogOpen(false);
      refresh();
    } catch (error: any) {
      console.error('Save error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to save park',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedPark) return;

    try {
      const { error } = await supabase
        .from('parks')
        .delete()
        .eq('Id', parseInt(selectedPark.id));

      if (error) throw error;

      toast({ title: 'Success', description: 'Park deleted successfully' });
      setIsDeleteDialogOpen(false);
      refresh();
    } catch (error: any) {
      console.error('Delete error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete park',
        variant: 'destructive',
      });
    }
  };

  const updateFormField = <K extends keyof ParkFormData>(field: K, value: ParkFormData[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Parks Management</h1>
          <p className="text-muted-foreground">{allParks.length} parks total</p>
        </div>
        <Button onClick={handleOpenCreate} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Park
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search parks..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Parks Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead className="hidden md:table-cell">Location</TableHead>
                <TableHead className="hidden sm:table-cell">Rating</TableHead>
                <TableHead className="hidden lg:table-cell">Features</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredParks.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    {searchQuery ? 'No parks match your search' : 'No parks found'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredParks.map((park) => (
                  <TableRow key={park.id}>
                    <TableCell>
                      <div className="font-medium">{park.name}</div>
                      <div className="text-sm text-muted-foreground md:hidden">
                        {park.city}, {park.state}
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div className="flex items-center gap-1 text-sm">
                        <MapPin className="h-3 w-3" />
                        {park.city}, {park.state}
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      {park.rating ? (
                        <div className="flex items-center gap-1">
                          <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                          <span>{park.rating.toFixed(1)}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <div className="flex flex-wrap gap-1">
                        {park.is_fully_fenced && <Badge variant="secondary">Fenced</Badge>}
                        {park.has_water_station && <Badge variant="secondary">Water</Badge>}
                        {park.has_parking && <Badge variant="secondary">Parking</Badge>}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenEdit(park)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenDelete(park)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedPark ? 'Edit Park' : 'Add New Park'}</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => updateFormField('name', e.target.value)}
                placeholder="Park name"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => updateFormField('address', e.target.value)}
                placeholder="Street address"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => updateFormField('city', e.target.value)}
                  placeholder="City"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  value={formData.state}
                  onChange={(e) => updateFormField('state', e.target.value)}
                  placeholder="State"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="latitude">Latitude</Label>
                <Input
                  id="latitude"
                  type="number"
                  step="any"
                  value={formData.latitude ?? ''}
                  onChange={(e) => updateFormField('latitude', e.target.value ? parseFloat(e.target.value) : null)}
                  placeholder="e.g., 42.3601"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="longitude">Longitude</Label>
                <Input
                  id="longitude"
                  type="number"
                  step="any"
                  value={formData.longitude ?? ''}
                  onChange={(e) => updateFormField('longitude', e.target.value ? parseFloat(e.target.value) : null)}
                  placeholder="e.g., -71.0589"
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => updateFormField('description', e.target.value)}
                placeholder="Park description..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Image</Label>
              <input
                ref={parkFileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const { url, error } = await uploadImage(file, 'post-images');
                  if (error) {
                    toast({ title: 'Upload failed', description: error.message, variant: 'destructive' });
                  } else if (url) {
                    updateFormField('image_url', url);
                  }
                  if (parkFileInputRef.current) parkFileInputRef.current.value = '';
                }}
              />
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => parkFileInputRef.current?.click()}
                  disabled={parkImageUploading}
                >
                  {parkImageUploading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
                  {parkImageUploading ? 'Uploading...' : 'Upload Image'}
                </Button>
                {formData.image_url && (
                  <Button type="button" variant="ghost" size="icon" onClick={() => updateFormField('image_url', '')} className="h-8 w-8">
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <Input
                value={formData.image_url}
                onChange={(e) => updateFormField('image_url', e.target.value)}
                placeholder="Or paste an image URL..."
              />
              {formData.image_url && (
                <img src={formData.image_url} alt="Preview" className="mt-2 rounded-lg max-h-32 object-cover w-full border border-border" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
              )}
            </div>

            <div className="space-y-3">
              <Label>Features</Label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { key: 'is_fully_fenced', label: 'Fully Fenced' },
                  { key: 'has_water_station', label: 'Water Station' },
                  { key: 'has_small_dog_area', label: 'Small Dog Area' },
                  { key: 'has_large_dog_area', label: 'Large Dog Area' },
                  { key: 'has_agility_equipment', label: 'Agility Equipment' },
                  { key: 'has_parking', label: 'Parking Available' },
                  { key: 'has_grass_surface', label: 'Grass Surface' },
                  { key: 'is_dog_friendly', label: 'Dog Friendly' },
                ].map(({ key, label }) => (
                  <div key={key} className="flex items-center justify-between rounded-lg border p-3">
                    <Label htmlFor={key} className="cursor-pointer">{label}</Label>
                    <Switch
                      id={key}
                      checked={formData[key as keyof ParkFormData] as boolean}
                      onCheckedChange={(checked) => updateFormField(key as keyof ParkFormData, checked)}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {selectedPark ? 'Update Park' : 'Create Park'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Park</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedPark?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
