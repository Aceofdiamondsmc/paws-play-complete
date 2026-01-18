import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface VaccinationRecord {
  id: string;
  dog_id: string;
  vaccination_type: string;
  expiry_date: string;
  document_url: string | null;
  status: string;
  verified_date: string | null;
  created_at: string | null;
}

export function useVaccinations(dogId?: string) {
  const { user } = useAuth();
  const [records, setRecords] = useState<VaccinationRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRecords = useCallback(async () => {
    if (!user || !dogId) {
      setRecords([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('vaccination_records')
        .select('*')
        .eq('dog_id', dogId)
        .order('expiry_date', { ascending: false });

      if (error) throw error;
      setRecords((data || []) as VaccinationRecord[]);
    } catch (e) {
      console.error('Error fetching vaccination records:', e);
    } finally {
      setLoading(false);
    }
  }, [user, dogId]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  const addRecord = async (
    vaccinationType: string,
    expiryDate: string,
    documentFile?: File
  ) => {
    if (!user || !dogId) return { error: new Error('Not ready') };

    try {
      let documentUrl: string | null = null;

      // Upload document if provided
      if (documentFile) {
        const fileExt = documentFile.name.split('.').pop()?.toLowerCase() || 'pdf';
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
        const filePath = `${user.id}/${dogId}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('vaccination-docs')
          .upload(filePath, documentFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('vaccination-docs')
          .getPublicUrl(filePath);

        documentUrl = publicUrl;
      }

      const { error } = await supabase
        .from('vaccination_records')
        .insert({
          dog_id: dogId,
          vaccination_type: vaccinationType,
          expiry_date: expiryDate,
          document_url: documentUrl,
          status: 'verified',
          verified_date: new Date().toISOString()
        });

      if (error) throw error;

      await fetchRecords();
      return { error: null };
    } catch (e) {
      console.error('Error adding vaccination record:', e);
      return { error: e as Error };
    }
  };

  const deleteRecord = async (recordId: string) => {
    try {
      const { error } = await supabase
        .from('vaccination_records')
        .delete()
        .eq('id', recordId);

      if (error) throw error;

      await fetchRecords();
      return { error: null };
    } catch (e) {
      console.error('Error deleting vaccination record:', e);
      return { error: e as Error };
    }
  };

  const isUpToDate = records.some(r => 
    new Date(r.expiry_date) > new Date() && r.status === 'verified'
  );

  return {
    records,
    loading,
    isUpToDate,
    addRecord,
    deleteRecord,
    refresh: fetchRecords
  };
}
