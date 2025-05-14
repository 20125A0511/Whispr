'use client';

import React, { createContext, useContext, useState, useEffect, useRef, ReactNode, useCallback } from 'react';
import { supabase } from '@/utils/supabase'; // Import Supabase client
import { RealtimeChannel } from '@supabase/supabase-js';
// import { generateChatId, isChatExpired } from '@/utils/chatUtils'; // generateChatId might be used by dashboard now

// Updated Message Interface
export interface Message {
  id: string; // UUID from Supabase
  chat_id: string;
  user_id?: string | null; // Authenticated user's ID (e.g., host)
  sender_name: string; // Changed from senderName to sender_name to match DB column
  message_text: string;
  created_at: string; // ISO string date
}

// Updated ChatContextType
interface ChatContextType {
  messages: Message[];
  chatId: string | null; // Can be null initially
  isLoadingMessages: boolean;
  chatError: string | null;
  addMessage: (message_text: string, sender_name: string, user_id?: string | null) => Promise<void>;
  clearChat: () => void;
  // startNewChat: () => string; // Now primarily for host dashboard, returns new chatId
  joinChatSession: (chatSessionId: string) => void; // To explicitly join/load a session
  activeChatSessionId: string | null; // Renamed from chatId for clarity
  clearChatError: () => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeChatSessionId, setActiveChatSessionId] = useState<string | null>(null);
  const [isLoadingMessages, setIsLoadingMessages] = useState<boolean>(false);
  const [chatError, setChatError] = useState<string | null>(null);
  
  const channelRef = useRef<RealtimeChannel | null>(null);

  const clearChatError = useCallback(() => {
    setChatError(null);
  }, []);

  const handleNewMessage = useCallback((payload: any) => {
    console.log('[ChatProvider] Received realtime payload:', payload);
    if (payload.eventType === 'INSERT' && payload.new) {
      const newMessage = payload.new as Message;
      if (newMessage.id && newMessage.chat_id && newMessage.sender_name && newMessage.message_text && newMessage.created_at) {
        setMessages((prevMessages) => {
          if (!prevMessages.find(msg => msg.id === newMessage.id)) {
            console.log('[ChatProvider] Adding new message to state:', newMessage);
            return [...prevMessages, newMessage];
          }
          console.log('[ChatProvider] Duplicate message detected, not adding:', newMessage.id);
          return prevMessages;
        });
      } else {
        console.warn('[ChatProvider] Received invalid or incomplete message payload from Realtime:', payload.new);
      }
    } else {
      console.log('[ChatProvider] Received non-insert event or empty payload:', payload.eventType);
    }
  }, []);

  useEffect(() => {
    const cleanupChannel = async () => {
      if (channelRef.current) {
        console.log(`[ChatProvider] Cleaning up channel for ${channelRef.current.topic}`);
        try {
          const status = await supabase.removeChannel(channelRef.current);
          console.log(`[ChatProvider] Unsubscribed from ${channelRef.current.topic}, status: ${status}`);
        } catch (error) {
          console.error(`[ChatProvider] Error unsubscribing from ${channelRef.current.topic}:`, error);
        }
        channelRef.current = null;
      }
    };

    if (!activeChatSessionId) {
      console.log('[ChatProvider] No active chat session. Clearing messages and ensuring no channel.');
      setMessages([]);
      cleanupChannel();
      return;
    }

    console.log(`[ChatProvider] Active session changed to: ${activeChatSessionId}. Setting up new channel.`);
    
    // Cleanup previous channel before setting up a new one.
    // This is important if activeChatSessionId changes rapidly.
    cleanupChannel();

    const fetchInitialMessages = async () => {
      setIsLoadingMessages(true);
      setChatError(null);
      console.log(`[ChatProvider] Fetching messages for chat_id: ${activeChatSessionId}`);
      try {
        const { data, error } = await supabase
          .from('temporary_chat_messages')
          .select('*')
          .eq('chat_id', activeChatSessionId)
          .order('created_at', { ascending: true });

        if (error) {
          console.error('[ChatProvider] Error fetching messages:', error);
          if (error.code !== 'PGRST116') { // PGRST116: "Row to be returned was not found" (empty table)
            setChatError(`Failed to load messages: ${error.message}`);
          } else {
            setMessages([]); // No messages found is not an error itself
          }
        } else {
          console.log(`[ChatProvider] Fetched ${data?.length || 0} messages.`);
          setMessages(data || []);
        }
      } catch (e: any) {
        console.error('[ChatProvider] Exception fetching messages:', e);
        setChatError(`Failed to load messages: ${e.message}`);
      } finally {
        setIsLoadingMessages(false);
      }
    };

    fetchInitialMessages();

    console.log(`[ChatProvider] Subscribing to realtime for chat_id: ${activeChatSessionId}`);
    const newChannel = supabase
      .channel(`realtime-chat-${activeChatSessionId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'temporary_chat_messages', filter: `chat_id=eq.${activeChatSessionId}` },
        handleNewMessage
      )
      .subscribe((status, err) => {
        console.log(`[ChatProvider] Subscription status for ${activeChatSessionId}: ${status}`);
        if (status === 'SUBSCRIBED') {
          console.log(`[ChatProvider] Successfully subscribed to ${activeChatSessionId}.`);
          setChatError(null); // Clear any previous subscription errors
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          console.error(`[ChatProvider] Subscription error for ${activeChatSessionId}:`, err);
          // Avoid setting error if it's a common "channel already joined" type of issue from quick refreshes
          if (err && err.message && !err.message.includes('already joined')) {
            setChatError(`Realtime connection error: ${err.message}. Try refreshing.`);
          }
        } else if (status === 'CLOSED') {
          console.log(`[ChatProvider] Subscription closed for ${activeChatSessionId}.`);
        }
      });

    channelRef.current = newChannel;

    return () => {
      console.log(`[ChatProvider] useEffect cleanup: Unsubscribing from ${activeChatSessionId}`);
      cleanupChannel();
    };
  }, [activeChatSessionId, handleNewMessage]);

  const addMessage = async (message_text: string, sender_name: string, user_id?: string | null) => {
    if (!activeChatSessionId) {
      console.error('[ChatProvider] addMessage: No active chat session.');
      setChatError('Cannot send message: No active chat session.');
      return;
    }
    if (!sender_name || !message_text) {
      console.warn('[ChatProvider] addMessage: Sender name or message text is empty.');
      // Do not set a chatError for this, as it's a validation issue.
      return;
    }

    // Optimistically clear errors before attempting to send
    clearChatError();
    // setIsLoadingMessages(true); // Optional: Indicate sending state

    const messageData: Omit<Message, 'id' | 'created_at'> = {
      chat_id: activeChatSessionId,
      user_id: user_id || null,
      sender_name: sender_name,
      message_text: message_text,
    };

    console.log('[ChatProvider] Attempting to insert message:', messageData);
    try {
      const { data: insertedMessages, error } = await supabase
        .from('temporary_chat_messages')
        .insert(messageData)
        .select(); // Select the inserted row

      if (error) {
        console.error('[ChatProvider] Error inserting message:', error);
        setChatError(`Failed to send message: ${error.message}. Please try again.`);
        throw error;
      }

      if (insertedMessages && insertedMessages.length > 0) {
         console.log('[ChatProvider] Message inserted successfully via DB, awaiting Realtime:', insertedMessages[0]);
         // Realtime should pick this up. If Realtime is failing, this log helps confirm DB write.
      } else {
        console.warn('[ChatProvider] Message insert returned no data, though no error reported.');
      }
      
    } catch (e: any) {
      console.error('[ChatProvider] Exception sending message:', e);
      // The error might have already been set by the direct Supabase error.
      if (!chatError) {
        setChatError(`Failed to send message: ${e.message}. Please try again.`);
      }
    } finally {
      // setIsLoadingMessages(false); // Optional: Clear sending state
    }
  };

  const clearChat = () => {
    setMessages([]);
    // Consider if activeChatSessionId should be cleared or if a "leave" action is needed.
    // For now, just clearing local messages.
  };
  
  const joinChatSession = useCallback((newChatSessionId: string) => {
    console.log(`[ChatProvider] joinChatSession called for: ${newChatSessionId}. Current: ${activeChatSessionId}`);
    if (activeChatSessionId === newChatSessionId && channelRef.current?.state === 'joined') {
      console.log(`[ChatProvider] Already in session and channel joined: ${newChatSessionId}.`);
      // If already in the session and subscribed, no need to do much, but perhaps a quick refresh of messages could be an option if needed.
      // For now, assume if joined, everything is up to date or will be via realtime.
      // One could add a specific function to re-fetch messages if there's suspicion of missed messages without full re-subscription.
      return;
    }
    
    // If it's a new chat session ID, or if we are not currently joined to the right channel.
    console.log(`[ChatProvider] Setting new active chat session ID: ${newChatSessionId}`);
    setMessages([]); // Clear messages from any previous chat
    setChatError(null); // Clear any errors from old session
    setActiveChatSessionId(newChatSessionId); // This will trigger the main useEffect to fetch messages and subscribe
  }, [activeChatSessionId]); // Removed channelRef.current from dependencies as its state is checked directly

  // The old startNewChat and initial welcome message useEffect are removed.
  // Chat creation and initial session setup are now handled by the dashboard/invite flow.

  return (
    <ChatContext.Provider
      value={{
        messages,
        chatId: activeChatSessionId,
        isLoadingMessages,
        chatError,
        addMessage,
        clearChat,
        joinChatSession,
        activeChatSessionId,
        clearChatError,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export const useChat = () => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
} 