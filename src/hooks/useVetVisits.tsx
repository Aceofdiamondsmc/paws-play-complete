import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface VetVisit {
  id: string;
  user_id: string;
  dog_id: string;
  visit_date: string;
  clinic_name: string | null;
  visit_type: string;
  vaccination_types: string[];
  notes: string | null;
  created_at: string;
}

export interface LogVetVisitData {
  dog_id: string;
  visit_date: string;
  clinic_name?: string;
  visit_type: string;
  vaccination_types?: string[];
  notes?: string;
  create_yearly_reminder?: boolean;
  reminder_time?: string;
}

const VACCINATION_EXPIRY_MONTHS: Record<string, number> = {
  'Bordetella': 6,
  'Canine Influenza': 6,
  // All others default to 12 months
};

export function useVetVisits() {
  const { user } = useAuth();
  const [visits, setVisits] = useState<VetVisit[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchVisits = useCallback(async () => {
    if (!user) { setVisits([]); setLoading(false); return; }
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('vet_visits')
        .select('*')
        .eq('user_id', user.id)
        .order('visit_date', { ascending: false });
      if (error) throw error;
      setVisits((data || []) as VetVisit[]);
    } catch (e) {
      console.error('Error fetching vet visits:', e);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { fetchVisits(); }, [fetchVisits]);

  const logVisit = async (data: LogVetVisitData) => {
    if (!user) return { error: new Error('Not authenticated') };
    try {
      // 1. Insert the vet visit
      const { error: insertError } = await supabase.from('vet_visits').insert({
        user_id: user.id,
        dog_id: data.dog_id,
        visit_date: data.visit_date,
        clinic_name: data.clinic_name || null,
        visit_type: data.visit_type,
        vaccination_types: data.vaccination_types || [],
        notes: data.notes || null,
      });
      if (insertError) throw insertError;

      // 2. Auto-update vaccination records
      const vaccTypes = data.vaccination_types || [];
      if (vaccTypes.length > 0) {
        for (const vaccType of vaccTypes) {
          const expiryMonths = VACCINATION_EXPIRY_MONTHS[vaccType] ?? 12;
          const visitDate = new Date(data.visit_date);
          const expiryDate = new Date(visitDate);
          expiryDate.setMonth(expiryDate.getMonth() + expiryMonths);
          const expiryStr = expiryDate.toISOString().split('T')[0];
          // Check if record exists
          const { data: existing } = await supabase
            .from('vaccination_records')
            .select('id')
            .eq('dog_id', data.dog_id)
            .eq('vaccination_type', vaccType)
            .limit(1);

          if (existing && existing.length > 0) {
            await supabase.from('vaccination_records')
              .update({
                expiry_date: expiryStr,
                status: 'verified',
                verified_date: new Date().toISOString(),
              })
              .eq('id', existing[0].id);
          } else {
            await supabase.from('vaccination_records').insert({
              dog_id: data.dog_id,
              vaccination_type: vaccType,
              expiry_date: expiryStr,
              status: 'verified',
              verified_date: new Date().toISOString(),
            });
          }
        }
      }

      // 3. Log to care_history
      await supabase.from('care_history').insert({
        user_id: user.id,
        category: 'vet_log',
        task_details: `${data.visit_type}${data.clinic_name ? ` at ${data.clinic_name}` : ''}`,
        notes: data.notes || null,
      });

      // 4. Create yearly reminder if requested
      if (data.create_yearly_reminder) {
        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
        await supabase.from('care_reminders').insert({
          user_id: user.id,
          category: 'vet_visit',
          task_details: `Annual ${data.visit_type}${data.clinic_name ? ` at ${data.clinic_name}` : ''}`,
          reminder_time: data.reminder_time || '09:00:00',
          reminder_date: data.visit_date,
          is_recurring: false,
          recurrence_pattern: 'yearly',
          is_enabled: true,
          user_timezone: tz,
        });
      }

      await fetchVisits();
      return { error: null };
    } catch (e) {
      console.error('Error logging vet visit:', e);
      return { error: e as Error };
    }
  };

  const deleteVisit = async (visitId: string) => {
    try {
      const { error } = await supabase.from('vet_visits').delete().eq('id', visitId);
      if (error) throw error;
      await fetchVisits();
      return { error: null };
    } catch (e) {
      console.error('Error deleting vet visit:', e);
      return { error: e as Error };
    }
  };

  return { visits, loading, logVisit, deleteVisit, refresh: fetchVisits };
}
