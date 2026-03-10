import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface GroupPlaydate {
  id: string;
  organizer_id: string;
  title: string;
  description: string | null;
  location_name: string;
  location_lat: number | null;
  location_lng: number | null;
  scheduled_date: string;
  scheduled_time: string;
  max_dogs: number;
  status: string;
  created_at: string;
  rsvps?: GroupPlaydateRsvp[];
  rsvp_count?: number;
}

export interface GroupPlaydateRsvp {
  id: string;
  group_playdate_id: string;
  user_id: string;
  dog_id: string;
  status: string;
  created_at: string;
  dog?: { name: string; avatar_url: string | null };
}

export function useGroupPlaydates() {
  const { user } = useAuth();
  const [groupPlaydates, setGroupPlaydates] = useState<GroupPlaydate[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchGroupPlaydates = async () => {
    const { data, error } = await supabase
      .from('group_playdates')
      .select('*')
      .in('status', ['open', 'full'])
      .gte('scheduled_date', new Date().toISOString().split('T')[0])
      .order('scheduled_date', { ascending: true });

    if (!error && data) {
      // Fetch RSVP counts
      const ids = data.map(gp => gp.id);
      const { data: rsvps } = await supabase
        .from('group_playdate_rsvps')
        .select('*, dogs:dog_id(name, avatar_url)')
        .in('group_playdate_id', ids.length > 0 ? ids : ['none'])
        .eq('status', 'going');

      const rsvpMap = new Map<string, GroupPlaydateRsvp[]>();
      rsvps?.forEach(r => {
        const list = rsvpMap.get(r.group_playdate_id) || [];
        list.push({
          ...r,
          dog: r.dogs as any,
        });
        rsvpMap.set(r.group_playdate_id, list);
      });

      setGroupPlaydates(data.map(gp => ({
        ...gp,
        rsvps: rsvpMap.get(gp.id) || [],
        rsvp_count: (rsvpMap.get(gp.id) || []).length,
      })));
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchGroupPlaydates();
  }, []);

  const createGroupPlaydate = async (data: {
    title: string;
    description?: string;
    location_name: string;
    location_lat?: number;
    location_lng?: number;
    scheduled_date: string;
    scheduled_time: string;
    max_dogs?: number;
  }) => {
    if (!user) return { error: new Error('Not authenticated') };

    const { error } = await supabase
      .from('group_playdates')
      .insert({
        organizer_id: user.id,
        ...data,
        max_dogs: data.max_dogs || 10,
      });

    if (!error) await fetchGroupPlaydates();
    return { error };
  };

  const rsvp = async (groupPlaydateId: string, dogId: string) => {
    if (!user) return { error: new Error('Not authenticated') };

    const { error } = await supabase
      .from('group_playdate_rsvps')
      .insert({
        group_playdate_id: groupPlaydateId,
        user_id: user.id,
        dog_id: dogId,
      });

    if (!error) await fetchGroupPlaydates();
    return { error };
  };

  const cancelRsvp = async (groupPlaydateId: string, dogId: string) => {
    if (!user) return { error: new Error('Not authenticated') };

    const { error } = await supabase
      .from('group_playdate_rsvps')
      .delete()
      .eq('group_playdate_id', groupPlaydateId)
      .eq('dog_id', dogId)
      .eq('user_id', user.id);

    if (!error) await fetchGroupPlaydates();
    return { error };
  };

  const cancelGroupPlaydate = async (id: string) => {
    if (!user) return { error: new Error('Not authenticated') };

    const { error } = await supabase
      .from('group_playdates')
      .update({ status: 'cancelled' })
      .eq('id', id)
      .eq('organizer_id', user.id);

    if (!error) await fetchGroupPlaydates();
    return { error };
  };

  return {
    groupPlaydates,
    loading,
    createGroupPlaydate,
    rsvp,
    cancelRsvp,
    cancelGroupPlaydate,
    refresh: fetchGroupPlaydates,
  };
}
