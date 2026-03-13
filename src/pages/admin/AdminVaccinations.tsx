import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShieldCheck, XCircle, FileText, Loader2, Dog as DogIcon } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface PendingRecord {
  id: string;
  dog_id: string;
  vaccination_type: string;
  expiry_date: string;
  document_url: string | null;
  status: string;
  created_at: string | null;
  dog_name?: string;
  owner_name?: string;
  owner_id?: string;
}

export default function AdminVaccinations() {
  const [records, setRecords] = useState<PendingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'pending_review' | 'vet_verified' | 'rejected'>('pending_review');

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('vaccination_records')
        .select('*')
        .eq('status', filter)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Enrich with dog and owner info
      const enriched: PendingRecord[] = [];
      for (const rec of data || []) {
        const { data: dog } = await supabase
          .from('dogs')
          .select('name, owner_id')
          .eq('id', rec.dog_id)
          .maybeSingle();

        let ownerName = 'Unknown';
        if (dog?.owner_id) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('display_name')
            .eq('id', dog.owner_id)
            .maybeSingle();
          ownerName = profile?.display_name || 'Unknown';
        }

        enriched.push({
          ...rec,
          dog_name: dog?.name || 'Unknown',
          owner_name: ownerName,
          owner_id: dog?.owner_id || undefined,
        });
      }

      setRecords(enriched);
    } catch (e) {
      console.error('Error fetching vaccination records:', e);
      toast.error('Failed to load records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [filter]);

  const handleApprove = async (record: PendingRecord) => {
    setProcessingId(record.id);
    try {
      // Update vaccination record status
      const { error: recError } = await supabase
        .from('vaccination_records')
        .update({ status: 'vet_verified', verified_date: new Date().toISOString() })
        .eq('id', record.id);

      if (recError) throw recError;

      // Set dog's vet_verified to true
      const { error: dogError } = await supabase
        .from('dogs')
        .update({ vet_verified: true } as any)
        .eq('id', record.dog_id);

      if (dogError) throw dogError;

      toast.success(`Approved ${record.vaccination_type} for ${record.dog_name}`);
      await fetchRecords();
    } catch (e) {
      console.error('Error approving:', e);
      toast.error('Failed to approve');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (record: PendingRecord) => {
    setProcessingId(record.id);
    try {
      const { error } = await supabase
        .from('vaccination_records')
        .update({ status: 'rejected' })
        .eq('id', record.id);

      if (error) throw error;

      toast.success(`Rejected ${record.vaccination_type} for ${record.dog_name}`);
      await fetchRecords();
    } catch (e) {
      console.error('Error rejecting:', e);
      toast.error('Failed to reject');
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Vaccination Review</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Review uploaded vaccination documents and approve or reject them.
        </p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        {(['pending_review', 'vet_verified', 'rejected'] as const).map((f) => (
          <Button
            key={f}
            variant={filter === f ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter(f)}
          >
            {f === 'pending_review' ? 'Pending' : f === 'vet_verified' ? 'Approved' : 'Rejected'}
          </Button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : records.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          No {filter === 'pending_review' ? 'pending' : filter === 'vet_verified' ? 'approved' : 'rejected'} records
        </div>
      ) : (
        <div className="space-y-3">
          {records.map((record) => (
            <div
              key={record.id}
              className="border rounded-lg p-4 flex flex-col sm:flex-row sm:items-center gap-4 bg-card"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center shrink-0">
                  <DogIcon className="w-5 h-5 text-muted-foreground" />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-sm truncate">{record.dog_name}</p>
                  <p className="text-xs text-muted-foreground truncate">Owner: {record.owner_name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="secondary" className="text-xs">{record.vaccination_type}</Badge>
                    <span className="text-xs text-muted-foreground">
                      Exp: {format(new Date(record.expiry_date), 'MMM d, yyyy')}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {record.document_url && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={record.document_url} target="_blank" rel="noopener noreferrer">
                      <FileText className="w-4 h-4 mr-1" />
                      View Doc
                    </a>
                  </Button>
                )}

                {filter === 'pending_review' && (
                  <>
                    <Button
                      size="sm"
                      variant="default"
                      disabled={processingId === record.id}
                      onClick={() => handleApprove(record)}
                      className="bg-emerald-600 hover:bg-emerald-700"
                    >
                      <ShieldCheck className="w-4 h-4 mr-1" />
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      disabled={processingId === record.id}
                      onClick={() => handleReject(record)}
                    >
                      <XCircle className="w-4 h-4 mr-1" />
                      Reject
                    </Button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
