import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ServiceSubmission {
  id: string;
  business_name: string;
  category: string;
  description: string | null;
  address: string;
  city: string;
  state: string;
  phone: string | null;
  website: string | null;
  email: string;
  latitude: number | null;
  longitude: number | null;
  image_url: string | null;
  submitter_id: string | null;
  submitter_name: string;
  payment_status: 'unpaid' | 'pending' | 'paid' | 'failed' | 'refunded';
  stripe_session_id: string | null;
  stripe_subscription_id: string | null;
  stripe_customer_id: string | null;
  subscription_tier: 'starter' | 'basic' | 'featured' | 'premium';
  subscription_valid_until: string | null;
  approval_status: 'pending' | 'approved' | 'rejected';
  approved_at: string | null;
  approved_by: string | null;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface SubmissionFormData {
  business_name: string;
  category: string;
  description?: string;
  address: string;
  city: string;
  state: string;
  phone?: string;
  website?: string;
  email: string;
  submitter_name: string;
  subscription_tier?: 'starter' | 'basic' | 'featured' | 'premium';
}

// Hook for fetching user's own submissions
export function useMySubmissions() {
  return useQuery({
    queryKey: ['my-service-submissions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('service_submissions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as ServiceSubmission[];
    },
  });
}

// Hook for fetching all submissions (admin only)
export function useAllSubmissions(filterByPayment?: string, filterByApproval?: string) {
  return useQuery({
    queryKey: ['all-service-submissions', filterByPayment, filterByApproval],
    queryFn: async () => {
      let query = supabase
        .from('service_submissions')
        .select('*')
        .order('created_at', { ascending: false });

      if (filterByPayment) {
        query = query.eq('payment_status', filterByPayment);
      }
      if (filterByApproval) {
        query = query.eq('approval_status', filterByApproval);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as ServiceSubmission[];
    },
  });
}

// Hook for creating a new submission
export function useCreateSubmission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (formData: SubmissionFormData) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('You must be logged in to submit a service');

      const { data, error } = await supabase
        .from('service_submissions')
        .insert({
          ...formData,
          submitter_id: user.id,
          payment_status: 'unpaid',
          approval_status: 'pending',
        })
        .select()
        .single();

      if (error) throw error;
      return data as ServiceSubmission;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-service-submissions'] });
    },
    onError: (error) => {
      toast.error('Failed to submit', { description: error.message });
    },
  });
}

// Hook for creating checkout session
export function useCreateCheckout() {
  return useMutation({
    mutationFn: async ({ submissionId, tier }: { submissionId: string; tier: string }) => {
      const { data, error } = await supabase.functions.invoke('create-checkout-session', {
        body: { submissionId, tier },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);
      
      return data as { url: string };
    },
    onError: (error) => {
      toast.error('Checkout failed', { description: error.message });
    },
  });
}

// Hook for admin to approve a submission
export function useApproveSubmission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (submissionId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('service_submissions')
        .update({
          approval_status: 'approved',
          approved_by: user.id,
        })
        .eq('id', submissionId)
        .select()
        .single();

      if (error) throw error;
      return data as ServiceSubmission;
    },
    onSuccess: async (data) => {
      queryClient.invalidateQueries({ queryKey: ['all-service-submissions'] });
      queryClient.invalidateQueries({ queryKey: ['services'] });
      toast.success('Submission approved', { description: 'The service has been added to the directory' });

      // Trigger AI image generation for the new service
      try {
        // Find the newly created service by matching business_name
        const { data: newService } = await supabase
          .from('services')
          .select('id')
          .eq('name', data.business_name)
          .order('id', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (newService) {
          toast.info('Generating AI image...', { description: 'This may take a moment' });
          await supabase.functions.invoke('generate-service-images', {
            body: { action: 'process_single', serviceId: newService.id }
          });
          queryClient.invalidateQueries({ queryKey: ['services'] });
          toast.success('Image generated', { description: 'AI image has been added to the service' });
        }
      } catch (imageError) {
        console.error('Image generation failed:', imageError);
        toast.warning('Image generation failed', { description: 'You can manually generate an image later' });
      }
    },
    onError: (error) => {
      toast.error('Approval failed', { description: error.message });
    },
  });
}

// Hook for admin to reject a submission
export function useRejectSubmission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ submissionId, reason }: { submissionId: string; reason: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('service_submissions')
        .update({
          approval_status: 'rejected',
          rejection_reason: reason,
          approved_by: user.id,
        })
        .eq('id', submissionId)
        .select()
        .single();

      if (error) throw error;
      return data as ServiceSubmission;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-service-submissions'] });
      toast.success('Submission rejected');
    },
    onError: (error) => {
      toast.error('Rejection failed', { description: error.message });
    },
  });
}
