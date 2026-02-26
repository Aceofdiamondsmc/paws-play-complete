import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
import { Switch } from '@/components/ui/switch';
import { Store, MapPin, Loader2, CheckCircle, AlertCircle, Download, Wand2, ImageIcon, ClipboardList, Check, X, Pencil, Trash2, Plus, Upload, Star } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useServices, getServiceImage, Service } from '@/hooks/useServices';
import { useAllSubmissions, useApproveSubmission, useRejectSubmission, ServiceSubmission } from '@/hooks/useServiceSubmissions';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from '@/components/ui/use-toast';
import { useImageUpload } from '@/hooks/useImageUpload';

const needsImage = (service: Service): boolean => {
  if (!service.image_url) return true;
  if (service.image_url.includes('supabase')) return false;
  const brokenPatterns = ['petworks.com', 'example.com', 'placeholder', 'via.placeholder', 'dummyimage'];
  return brokenPatterns.some(p => service.image_url?.toLowerCase().includes(p));
};

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
  const [importResult, setImportResult] = useState<{ success: boolean; imported: number; services: Array<{ name: string; category: string }>; errors?: string[] } | null>(null);
  const [isGeneratingImages, setIsGeneratingImages] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<ServiceSubmission | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  // Create/Edit/Delete state
  const [formMode, setFormMode] = useState<'create' | 'edit' | null>(null);
  const [editingServiceId, setEditingServiceId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({ name: '', category: 'Groomers', description: '', address: '', image_url: '', price: '', rating: '0', is_verified: false, is_featured: false, latitude: '', longitude: '', website: '', phone: '' });
  const [isFormSubmitting, setIsFormSubmitting] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [deletingServiceId, setDeletingServiceId] = useState<number | null>(null);
  const { uploadImage, uploading: imageUploading } = useImageUpload();
  const svcFileInputRef = useRef<HTMLInputElement>(null);

  const { data: services, isLoading } = useServices();
  const { data: submissions, isLoading: submissionsLoading } = useAllSubmissions('paid', 'pending');
  const approveSubmission = useApproveSubmission();
  const rejectSubmission = useRejectSubmission();
  const queryClient = useQueryClient();

  const handleCategoryToggle = (categoryId: string) => {
    setSelectedCategories(prev => prev.includes(categoryId) ? prev.filter(c => c !== categoryId) : [...prev, categoryId]);
  };

  const handleImport = async () => {
    if (!location.trim() || selectedCategories.length === 0) return;
    setIsImporting(true);
    setImportResult(null);
    try {
      const response = await supabase.functions.invoke('import-services', {
        body: { location: location.trim(), categories: selectedCategories },
      });
      if (response.error) throw new Error(response.error.message);
      setImportResult(response.data);
      if (response.data.imported > 0) {
        toast({ title: "Import successful!", description: `Imported ${response.data.imported} services` });
        queryClient.invalidateQueries({ queryKey: ['services'] });
      }
    } catch (error) {
      toast({ title: "Import failed", description: error instanceof Error ? error.message : "Unknown error", variant: "destructive" });
    } finally {
      setIsImporting(false);
    }
  };

  const handleReject = async () => {
    if (!selectedSubmission || !rejectionReason.trim()) return;
    await rejectSubmission.mutateAsync({ submissionId: selectedSubmission.id, reason: rejectionReason });
    setRejectDialogOpen(false);
    setSelectedSubmission(null);
    setRejectionReason('');
  };

  const openCreateModal = () => {
    setFormMode('create');
    setEditingServiceId(null);
    setEditForm({ name: '', category: 'Groomers', description: '', address: '', image_url: '', price: '$', rating: '0', is_verified: false, is_featured: false, latitude: '', longitude: '', website: '', phone: '' });
  };

  const openEditModal = (service: Service) => {
    setFormMode('edit');
    setEditingServiceId(service.id);
    setEditForm({
      name: service.name || '',
      category: service.category || 'Groomers',
      description: service.description || '',
      address: (service as any).verified_address || '',
      image_url: service.image_url || '',
      price: service.price || '$',
      rating: String(service.rating || 0),
      is_verified: !!service.is_verified,
      is_featured: !!service.is_featured,
      latitude: service.latitude != null ? String(service.latitude) : '',
      longitude: service.longitude != null ? String(service.longitude) : '',
      website: (service as any).website || '',
      phone: (service as any).phone || '',
    });
  };

  const handleFormSave = async () => {
    if (!editForm.name.trim() || !editForm.category) return;
    setIsFormSubmitting(true);
    try {
      if (formMode === 'create') {
        const { error } = await supabase.from('services').insert({
          name: editForm.name.trim(),
          category: editForm.category,
          description: editForm.description.trim() || null,
          verified_address: editForm.address.trim() || null,
          image_url: editForm.image_url.trim() || 'https://placedog.net/600/400?id=service',
          price: editForm.price || '$',
          rating: parseFloat(editForm.rating) || 0,
          is_verified: editForm.is_verified,
          is_featured: editForm.is_featured,
          latitude: editForm.latitude ? parseFloat(editForm.latitude) : null,
          longitude: editForm.longitude ? parseFloat(editForm.longitude) : null,
          website: editForm.website.trim() || null,
          phone: editForm.phone.trim() || null,
        });
        if (error) throw error;
        toast({ title: 'Service created!' });
      } else if (formMode === 'edit' && editingServiceId !== null) {
        const { error } = await supabase
          .from('services')
          .update({
            name: editForm.name.trim(),
            category: editForm.category,
            description: editForm.description.trim() || null,
            verified_address: editForm.address.trim() || null,
            image_url: editForm.image_url.trim() || null,
            is_verified: editForm.is_verified,
            is_featured: editForm.is_featured,
            latitude: editForm.latitude ? parseFloat(editForm.latitude) : null,
            longitude: editForm.longitude ? parseFloat(editForm.longitude) : null,
            website: editForm.website.trim() || null,
            phone: editForm.phone.trim() || null,
            price: editForm.price || '$',
            rating: parseFloat(editForm.rating) || 0,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingServiceId);
        if (error) throw error;
        toast({ title: 'Service updated!' });
      }
      queryClient.invalidateQueries({ queryKey: ['services'] });
      setFormMode(null);
    } catch (error: any) {
      toast({ title: formMode === 'create' ? 'Create failed' : 'Update failed', description: error.message, variant: 'destructive' });
    } finally {
      setIsFormSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (deletingServiceId === null) return;
    const idToDelete = deletingServiceId;
    setDeletingServiceId(null);

    // Optimistic removal
    queryClient.setQueryData(['services'], (old: Service[] | undefined) =>
      old ? old.filter(s => s.id !== idToDelete) : []
    );

    try {
      const { error } = await supabase.from('services').delete().eq('id', idToDelete);
      if (error) throw error;
      toast({ title: 'Service deleted' });
    } catch (error: any) {
      toast({ title: 'Delete failed', description: error.message, variant: 'destructive' });
    }
    queryClient.invalidateQueries({ queryKey: ['services'] });
  };

  const servicesByCategory = services?.reduce((acc, service) => {
    acc[service.category] = (acc[service.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Services Management</h1>
        <p className="text-muted-foreground">Manage pet services and business submissions</p>
      </div>

      <Tabs defaultValue="submissions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="submissions" className="gap-2">
            <ClipboardList className="h-4 w-4" />
            Pending
            {submissions && submissions.length > 0 && <Badge variant="default" className="ml-1">{submissions.length}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="import">Import</TabsTrigger>
          <TabsTrigger value="all">All Services</TabsTrigger>
        </TabsList>

        <TabsContent value="submissions">
          <Card>
            <CardHeader>
              <CardTitle>Pending Submissions</CardTitle>
              <CardDescription>Review paid business listing requests</CardDescription>
            </CardHeader>
            <CardContent>
              {submissionsLoading ? (
                <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
              ) : submissions && submissions.length > 0 ? (
                <div className="space-y-4">
                  {submissions.map(sub => (
                    <div key={sub.id} className="p-4 border rounded-lg space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-bold">{sub.business_name}</h3>
                          <p className="text-sm text-muted-foreground">{sub.category} • {sub.city}, {sub.state}</p>
                        </div>
                        <Badge className="bg-success">Paid</Badge>
                      </div>
                      <div className="flex gap-2 justify-end">
                        <Button size="sm" variant="outline" onClick={() => { setSelectedSubmission(sub); setRejectDialogOpen(true); }}>
                          <X className="w-4 h-4 mr-1" />Reject
                        </Button>
                        <Button size="sm" onClick={() => approveSubmission.mutate(sub.id)} disabled={approveSubmission.isPending}>
                          <Check className="w-4 h-4 mr-1" />Approve
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">No pending submissions</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="import">
          <Card>
            <CardHeader>
              <CardTitle>Import from Google Places</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input placeholder="City name or coordinates" value={location} onChange={e => setLocation(e.target.value)} disabled={isImporting} />
              <div className="flex flex-wrap gap-4">
                {CATEGORIES.map(cat => (
                  <div key={cat.id} className="flex items-center space-x-2">
                    <Checkbox id={cat.id} checked={selectedCategories.includes(cat.id)} onCheckedChange={() => handleCategoryToggle(cat.id)} />
                    <Label htmlFor={cat.id}>{cat.label}</Label>
                  </div>
                ))}
              </div>
              <Button onClick={handleImport} disabled={isImporting || !location.trim()} className="w-full">
                {isImporting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
                Import
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="all">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>All Services ({services?.length || 0})</CardTitle>
              <Button onClick={openCreateModal} size="sm">
                <Plus className="w-4 h-4 mr-1" />
                Create New Service
              </Button>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
              ) : services && services.length > 0 ? (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {services.map(service => (
                    <div key={service.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <img src={getServiceImage(service)} alt={service.name} className="w-12 h-12 rounded-lg object-cover" />
                        <div>
                          <div className="font-medium">{service.name}</div>
                          <div className="text-sm text-muted-foreground">{service.category}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {service.is_verified && <Badge className="bg-success">Verified</Badge>}
                        <Button size="icon" variant="ghost" onClick={() => openEditModal(service)} aria-label="Edit service">
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => setDeletingServiceId(service.id)} aria-label="Delete service" className="text-destructive hover:text-destructive">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">No services yet</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Reject Submission Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Submission</DialogTitle>
            <DialogDescription>Provide a reason for rejecting {selectedSubmission?.business_name}</DialogDescription>
          </DialogHeader>
          <Textarea placeholder="Reason for rejection..." value={rejectionReason} onChange={e => setRejectionReason(e.target.value)} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleReject} disabled={!rejectionReason.trim()}>Reject</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create/Edit Service Modal */}
      <Dialog open={formMode !== null} onOpenChange={(open) => !open && setFormMode(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{formMode === 'create' ? 'Create New Service' : 'Edit Service'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2 max-h-[60vh] overflow-y-auto">
            <div className="space-y-2">
              <Label htmlFor="svc-name">Name</Label>
              <Input id="svc-name" value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} placeholder="Business name" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="svc-category">Category</Label>
              <Select value={editForm.category} onValueChange={v => setEditForm(f => ({ ...f, category: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(c => <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="svc-desc">Description</Label>
              <Textarea id="svc-desc" value={editForm.description} onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))} className="min-h-[80px]" placeholder="Service description..." />
            </div>
            <div className="space-y-2">
              <Label htmlFor="svc-address">Address</Label>
              <Input id="svc-address" value={editForm.address} onChange={e => setEditForm(f => ({ ...f, address: e.target.value }))} placeholder="123 Main St, City, State" />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-1"
                disabled={!editForm.address.trim() || isGeocoding}
                onClick={async () => {
                  setIsGeocoding(true);
                  try {
                    const { data: tokenData, error: tokenErr } = await supabase.functions.invoke('mapbox-token');
                    if (tokenErr || !tokenData?.token) throw new Error('Failed to fetch Mapbox token');
                    const res = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(editForm.address.trim())}.json?access_token=${tokenData.token}&limit=1`);
                    const geo = await res.json();
                    if (!geo.features?.length) throw new Error('No results found for this address');
                    const [lng, lat] = geo.features[0].center;
                    setEditForm(f => ({ ...f, latitude: String(lat), longitude: String(lng) }));
                    toast({ title: 'Coordinates found', description: `${lat.toFixed(4)}, ${lng.toFixed(4)}` });
                  } catch (err: any) {
                    toast({ title: 'Geocoding failed', description: err.message, variant: 'destructive' });
                  } finally {
                    setIsGeocoding(false);
                  }
                }}
              >
                {isGeocoding ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <MapPin className="h-4 w-4 mr-1" />}
                Geocode
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="svc-price">Price</Label>
                <Input id="svc-price" value={editForm.price} onChange={e => setEditForm(f => ({ ...f, price: e.target.value }))} placeholder="$ or $$" />
              </div>
              <div className="space-y-2">
                <Label>Rating</Label>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-5 h-5 cursor-pointer transition-colors ${
                          star <= parseFloat(editForm.rating) ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground'
                        }`}
                        onClick={() => setEditForm(f => ({ ...f, rating: String(star) }))}
                      />
                    ))}
                  </div>
                  <Input
                    type="number"
                    step="0.1"
                    min="0"
                    max="5"
                    value={editForm.rating}
                    onChange={e => setEditForm(f => ({ ...f, rating: e.target.value }))}
                    className="w-16"
                  />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="svc-website">Website URL</Label>
                <Input id="svc-website" value={editForm.website} onChange={e => setEditForm(f => ({ ...f, website: e.target.value }))} placeholder="https://example.com" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="svc-phone">Phone</Label>
                <Input id="svc-phone" value={editForm.phone} onChange={e => setEditForm(f => ({ ...f, phone: e.target.value }))} placeholder="(555) 123-4567" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Image</Label>
              <input
                ref={svcFileInputRef}
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
                    setEditForm(f => ({ ...f, image_url: url }));
                  }
                  if (svcFileInputRef.current) svcFileInputRef.current.value = '';
                }}
              />
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => svcFileInputRef.current?.click()}
                  disabled={imageUploading}
                >
                  {imageUploading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
                  {imageUploading ? 'Uploading...' : 'Upload Image'}
                </Button>
                {editForm.image_url && (
                  <Button type="button" variant="ghost" size="icon" onClick={() => setEditForm(f => ({ ...f, image_url: '' }))} className="h-8 w-8">
                    <X className="h-4 w-4" />
                  </Button>
                )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="svc-lat">Latitude</Label>
                <Input id="svc-lat" type="number" step="any" value={editForm.latitude} onChange={e => setEditForm(f => ({ ...f, latitude: e.target.value }))} placeholder="e.g. 42.3601" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="svc-lng">Longitude</Label>
                <Input id="svc-lng" type="number" step="any" value={editForm.longitude} onChange={e => setEditForm(f => ({ ...f, longitude: e.target.value }))} placeholder="e.g. -71.0589" />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="svc-verified">Verified Business</Label>
              <Switch id="svc-verified" checked={editForm.is_verified} onCheckedChange={v => setEditForm(f => ({ ...f, is_verified: v }))} />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="svc-featured">Featured Listing</Label>
              <Switch id="svc-featured" checked={editForm.is_featured} onCheckedChange={v => setEditForm(f => ({ ...f, is_featured: v }))} />
            </div>
              <Input
                value={editForm.image_url}
                onChange={e => setEditForm(f => ({ ...f, image_url: e.target.value }))}
                placeholder="Or paste an image URL..."
              />
              {editForm.image_url && (
                <img src={editForm.image_url} alt="Preview" className="mt-2 rounded-lg max-h-32 object-cover w-full border border-border" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormMode(null)} disabled={isFormSubmitting}>Cancel</Button>
            <Button onClick={handleFormSave} disabled={isFormSubmitting || !editForm.name.trim()}>
              {isFormSubmitting ? 'Saving...' : formMode === 'create' ? 'Create Service' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deletingServiceId !== null} onOpenChange={(open) => !open && setDeletingServiceId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Service</AlertDialogTitle>
            <AlertDialogDescription>Are you sure? This will permanently remove this service.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
