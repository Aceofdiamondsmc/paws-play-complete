import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Store, MapPin, Loader2, CheckCircle, AlertCircle, Download, Wand2, ImageIcon, ClipboardList, Check, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useServices, getServiceImage, Service } from '@/hooks/useServices';
import { useAllSubmissions, useApproveSubmission, useRejectSubmission, ServiceSubmission } from '@/hooks/useServiceSubmissions';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from '@/components/ui/use-toast';

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
            <CardHeader>
              <CardTitle>All Services ({services?.length || 0})</CardTitle>
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
                      {service.is_verified && <Badge className="bg-success">Verified</Badge>}
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
    </div>
  );
}
