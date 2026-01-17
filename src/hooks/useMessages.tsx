import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import type { Message, Conversation, Profile } from '@/types';

interface ConversationWithProfile extends Conversation {
  otherUser?: Profile;
  lastMessage?: Message;
  unreadCount: number;
}

export function useMessages() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<ConversationWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const subscriptionRef = useRef<any>(null);

  const fetchConversations = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Fetch conversations
      const { data: convos, error } = await supabase
        .from('conversations')
        .select('*')
        .or(`participant_1_id.eq.${user.id},participant_2_id.eq.${user.id}`)
        .order('last_message_at', { ascending: false });

      if (error) throw error;

      // Get other participant IDs
      const otherUserIds = new Set<string>();
      convos?.forEach((c: Conversation) => {
        const otherId = c.participant_1_id === user.id ? c.participant_2_id : c.participant_1_id;
        otherUserIds.add(otherId);
      });

      // Fetch profiles
      const { data: profiles } = await supabase
        .from('profiles')
        .select('*')
        .in('id', Array.from(otherUserIds));

      const profileMap = new Map<string, Profile>();
      profiles?.forEach((p: Profile) => profileMap.set(p.id, p));

      // Fetch last message and unread count for each conversation
      const enrichedConvos = await Promise.all(
        (convos || []).map(async (c: Conversation) => {
          const otherId = c.participant_1_id === user.id ? c.participant_2_id : c.participant_1_id;

          // Get last message
          const { data: messages } = await supabase
            .from('messages')
            .select('*')
            .eq('conversation_id', c.id)
            .order('created_at', { ascending: false })
            .limit(1);

          // Get unread count
          const { count } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('conversation_id', c.id)
            .neq('sender_id', user.id)
            .is('read_at', null);

          return {
            ...c,
            otherUser: profileMap.get(otherId),
            lastMessage: messages?.[0] as Message | undefined,
            unreadCount: count || 0
          };
        })
      );

      setConversations(enrichedConvos);
    } catch (e) {
      console.error('Error fetching conversations:', e);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Set up realtime subscription
  useEffect(() => {
    if (!user) return;

    fetchConversations();

    // Subscribe to new messages
    subscriptionRef.current = supabase
      .channel('messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages'
        },
        () => {
          fetchConversations();
        }
      )
      .subscribe();

    return () => {
      if (subscriptionRef.current) {
        supabase.removeChannel(subscriptionRef.current);
      }
    };
  }, [user, fetchConversations]);

  const startConversation = async (otherUserId: string) => {
    if (!user) return { conversation: null, error: new Error('Not authenticated') };

    // Check if conversation already exists
    const existing = conversations.find(
      c =>
        (c.participant_1_id === user.id && c.participant_2_id === otherUserId) ||
        (c.participant_1_id === otherUserId && c.participant_2_id === user.id)
    );

    if (existing) {
      return { conversation: existing, error: null };
    }

    // Create new conversation
    const { data, error } = await supabase
      .from('conversations')
      .insert({
        participant_1_id: user.id,
        participant_2_id: otherUserId,
        status: 'active'
      })
      .select()
      .single();

    if (!error) {
      await fetchConversations();
    }

    return { conversation: data as Conversation | null, error };
  };

  const totalUnread = conversations.reduce((sum, c) => sum + c.unreadCount, 0);

  return {
    conversations,
    loading,
    totalUnread,
    startConversation,
    refresh: fetchConversations
  };
}

export function useConversationMessages(conversationId: string | null) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const subscriptionRef = useRef<any>(null);

  const fetchMessages = useCallback(async () => {
    if (!conversationId) return;

    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      setMessages((data || []) as Message[]);

      // Mark messages as read
      if (user) {
        await supabase
          .from('messages')
          .update({ read_at: new Date().toISOString() })
          .eq('conversation_id', conversationId)
          .neq('sender_id', user.id)
          .is('read_at', null);
      }
    } catch (e) {
      console.error('Error fetching messages:', e);
    } finally {
      setLoading(false);
    }
  }, [conversationId, user]);

  // Set up realtime subscription
  useEffect(() => {
    if (!conversationId) return;

    fetchMessages();

    subscriptionRef.current = supabase
      .channel(`conversation:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        (payload) => {
          setMessages(prev => [...prev, payload.new as Message]);
        }
      )
      .subscribe();

    return () => {
      if (subscriptionRef.current) {
        supabase.removeChannel(subscriptionRef.current);
      }
    };
  }, [conversationId, fetchMessages]);

  const sendMessage = async (content: string) => {
    if (!user || !conversationId) return { error: new Error('Not ready') };

    const { error } = await supabase.from('messages').insert({
      conversation_id: conversationId,
      sender_id: user.id,
      content
    });

    // Update conversation's last_message_at
    if (!error) {
      await supabase
        .from('conversations')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', conversationId);
    }

    return { error };
  };

  return {
    messages,
    loading,
    sendMessage,
    refresh: fetchMessages
  };
}
