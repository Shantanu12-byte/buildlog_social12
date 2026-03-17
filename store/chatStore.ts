import { create } from 'zustand';
import { supabase } from '@/lib/supabase';

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  encrypted_content: string;
  created_at: string;
  sender_username?: string;
  sender_avatar?: string;
}

interface ChatState {
  messages: Message[];
  inbox: any[];
  isLoading: boolean;
  fetchMessages: (chatTargetId: string) => Promise<void>;
  fetchInbox: (userId: string) => Promise<void>;
  sendMessage: (senderId: string, receiverId: string, encryptedContent: string) => Promise<void>;
  addOptimisticMessage: (message: Message) => void;
  subscribeToMessages: (userId: string, onNewMessage: (msg: Message) => void) => () => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  inbox: [],
  isLoading: false,

  fetchMessages: async (chatTargetId: string) => {
    set({ isLoading: true });
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error } = await supabase
        .from('private_messages')
        .select('*')
        .or(`and(sender_id.eq.${session.user.id},receiver_id.eq.${chatTargetId}),and(sender_id.eq.${chatTargetId},receiver_id.eq.${session.user.id})`)
        .order('created_at', { ascending: true });

      if (error) throw error;
      set({ messages: data || [] });
    } catch (error) {
      console.error("fetchMessages Error:", error);
    } finally {
      set({ isLoading: false });
    }
  },

  fetchInbox: async (userId: string) => {
    set({ isLoading: true });
    try {
      // Fetch latest message per conversation
      const { data, error } = await supabase
        .from('private_messages')
        .select(`
          id,
          sender_id,
          receiver_id,
          encrypted_content,
          created_at
        `)
        .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const contactsMap = new Map();
      const contactIds = new Set<string>();

      data?.forEach((msg: any) => {
        const otherId = msg.sender_id === userId ? msg.receiver_id : msg.sender_id;
        if (!contactsMap.has(otherId)) {
          contactsMap.set(otherId, {
            id: otherId,
            lastMessage: msg.encrypted_content,
            timestamp: msg.created_at,
          });
          contactIds.add(otherId);
        }
      });

      if (contactIds.size > 0) {
        const { data: profiles, error: pError } = await supabase
          .from('profiles')
          .select('id, username, avatar_url')
          .in('id', Array.from(contactIds));
        
        if (pError) throw pError;

        const hydratedInbox = profiles.map(profile => ({
          ...profile,
          ...contactsMap.get(profile.id)
        })).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

        set({ inbox: hydratedInbox });
      } else {
        set({ inbox: [] });
      }
    } catch (error) {
      console.error("fetchInbox Error:", error);
    } finally {
      set({ isLoading: false });
    }
  },

  sendMessage: async (senderId, receiverId, encryptedContent) => {
    try {
      const { data, error } = await supabase
        .from('private_messages')
        .insert({
          sender_id: senderId,
          receiver_id: receiverId,
          encrypted_content: encryptedContent,
        })
        .select()
        .single();

      if (error) throw error;
      
      // Update the optimistic message with the real one if needed, 
      // but usually fetchMessages or real-time will handle it.
      // However, to be fast, we can just replace it in the state.
      if (data) {
        set((state) => ({
          messages: state.messages.map(m => m.id.startsWith('temp-') ? data : m)
        }));
        // Update inbox to reflect new message/timestamp
        get().fetchInbox(senderId);
      }
    } catch (error) {
      console.error("sendMessage Error:", error);
      throw error;
    }
  },

  addOptimisticMessage: (message) => {
    set((state) => {
      const exists = state.messages.find(m => m.id === message.id);
      if (exists) return state;
      return { messages: [...state.messages, message] };
    });
  },

  subscribeToMessages: (userId, onNewMessage) => {
    // Unique channel to avoid collisions between store instances or users
    const channelId = `messages_${userId}_${Math.random().toString(36).substr(2, 9)}`;
    
    const channel = supabase
      .channel(channelId)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'private_messages',
          filter: `receiver_id=eq.${userId}`,
        },
        (payload) => {
          const newMsg = payload.new as Message;
          console.log("🔔 INCOMING_WHISPER");
          
          // Update local state if we are already in this chat
          // This avoids the need for every component to call fetchMessages separately
          onNewMessage(newMsg);
        }
      )
      .subscribe();

    return () => {
      console.log("🔕 UNSUBSCRIBING_FROM_WHISPERS");
      supabase.removeChannel(channel);
    };
  },
}));
