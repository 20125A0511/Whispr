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
  isChatActive: boolean; // Whether the current chat session is active
  isSessionEnded: boolean; // Whether the session has been ended by the host
  addMessage: (message_text: string, sender_name: string, user_id?: string | null) => Promise<void>;
  clearChat: () => void;
  // startNewChat: () => string; // Now primarily for host dashboard, returns new chatId
  joinChatSession: (chatSessionId: string) => void; // To explicitly join/load a session
  endChatSession: (chatSessionId: string, userId?: string | null) => Promise<void>; // End a chat session (host only)
  activeChatSessionId: string | null; // Renamed from chatId for clarity
  clearChatError: () => void;
  typingUsers: string[];
  sendTypingEvent: (userName: string, isTyping: boolean) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeChatSessionId, setActiveChatSessionId] = useState<string | null>(null);
  const [isLoadingMessages, setIsLoadingMessages] = useState<boolean>(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const [isChatActive, setIsChatActive] = useState<boolean>(true);
  const [isSessionEnded, setIsSessionEnded] = useState<boolean>(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  
  const channelRef = useRef<RealtimeChannel | null>(null);
  const sessionChannelRef = useRef<RealtimeChannel | null>(null);

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
  
  // Add retry mechanism for Realtime connections
  const setupRealtimeConnection = useCallback((chatId: string, retryCount = 0) => {
    console.log(`[ChatProvider] Setting up realtime connection for ${chatId}, attempt ${retryCount + 1}`);
    
    if (retryCount > 3) {
      console.error(`[ChatProvider] Failed to connect after ${retryCount} attempts.`);
      setChatError("Realtime connection error: Maximum retry attempts reached. Please refresh the page.");
      return null;
    }
    
    const channel = supabase
      .channel(`realtime-chat-${chatId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'temporary_chat_messages', filter: `chat_id=eq.${chatId}` },
        handleNewMessage
      )
      .subscribe((status, err) => {
        console.log(`[ChatProvider] Subscription status for ${chatId}: ${status}`, err);
        if (status === 'SUBSCRIBED') {
          console.log(`[ChatProvider] Successfully subscribed to ${chatId}.`);
          setChatError(null); // Clear any previous subscription errors
          
          // Subscribe to typing events
          channel.on('broadcast', { event: 'TYPING_EVENT' }, (payload) => {
            console.log('[ChatProvider] Typing event received:', payload);
            const { userName, isTyping } = payload.payload;
            // For now, let ChatInterface filter out the current user.
            // Or, we can get currentUserName from a ref if we store it.
            // For simplicity, ChatInterface will handle filtering for display.
            setTypingUsers(prev => {
              const otherUsers = prev.filter(u => u !== userName);
              return isTyping ? [...otherUsers, userName] : otherUsers;
            });
          });

        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          console.error(`[ChatProvider] Subscription error for ${chatId}:`, err);
          
          // Handle specific Realtime errors
          if (err?.message?.includes('unable to connect to the project database')) {
            // This is a known issue, try to reconnect
            console.log(`[ChatProvider] Attempting to reconnect (attempt ${retryCount + 1})`);
            
            // Close the current channel
            supabase.removeChannel(channel);
            
            // Wait a bit before retrying
            setTimeout(() => {
              const newChannel = setupRealtimeConnection(chatId, retryCount + 1);
              if (newChannel) channelRef.current = newChannel;
            }, 2000 * (retryCount + 1)); // Exponential backoff
          } else if (err && err.message && !err.message.includes('already joined')) {
            setChatError(`Realtime connection error: ${err.message}. Try refreshing.`);
          }
        } else if (status === 'CLOSED') {
          console.log(`[ChatProvider] Subscription closed for ${chatId}.`);
        }
      });
      
    return channel;
  }, [handleNewMessage]); // Removed setTypingUsers from deps, it's a setter

  const sendTypingEvent = useCallback((userName: string, isTyping: boolean) => {
    if (channelRef.current && channelRef.current.state === 'joined') {
      console.log(`[ChatProvider] Sending TYPING_EVENT: ${userName} is ${isTyping ? 'typing' : 'stopping'}`);
      channelRef.current.send({
        type: 'broadcast',
        event: 'TYPING_EVENT',
        payload: { userName, isTyping },
      });
    } else {
      console.warn('[ChatProvider] Cannot send typing event, channel not ready or not joined.');
    }
  }, []); // channelRef is a ref, so it doesn't need to be in deps

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
      
      if (sessionChannelRef.current) {
        try {
          await supabase.removeChannel(sessionChannelRef.current);
        } catch (error) {
          console.error('[ChatProvider] Error unsubscribing from session channel:', error);
        }
        sessionChannelRef.current = null;
      }
    };

    if (!activeChatSessionId) {
      console.log('[ChatProvider] No active chat session. Clearing messages and ensuring no channel.');
      setMessages([]);
      setIsChatActive(true);
      setIsSessionEnded(false);
      setTypingUsers([]); // Clear typing users when session is not active
      cleanupChannel();
      return;
    }

    console.log(`[ChatProvider] Active session changed to: ${activeChatSessionId}. Setting up new channel.`);
    setTypingUsers([]); // Clear typing users for the new session

    // Cleanup previous channel before setting up a new one.
    // This is important if activeChatSessionId changes rapidly.
    cleanupChannel();

    const fetchInitialMessages = async () => {
      setIsLoadingMessages(true);
      setChatError(null);
      console.log(`[ChatProvider] Fetching messages for chat_id: ${activeChatSessionId}`);
      try {
        // First check if chat session is active
        const { data: chatSession, error: sessionError } = await supabase
          .from('chat_sessions')
          .select('is_active')
          .eq('chat_id', activeChatSessionId)
          .single();
          
        if (sessionError) {
          if (sessionError.code !== 'PGRST116') { // Not found
            console.error('[ChatProvider] Error fetching chat session status:', sessionError);
          }
        } else if (chatSession) {
          setIsChatActive(chatSession.is_active);
          setIsSessionEnded(!chatSession.is_active);
        }
        
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

    // Replace the existing subscription code with this:
    console.log(`[ChatProvider] Subscribing to realtime for chat_id: ${activeChatSessionId}`);
    const newChannel = setupRealtimeConnection(activeChatSessionId);
    channelRef.current = newChannel;
    
    // Also subscribe to chat_sessions table to detect when the session is ended
    const sessionChannel = supabase
      .channel(`session-${activeChatSessionId}`)
      .on(
        'postgres_changes',
        { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'chat_sessions', 
          filter: `chat_id=eq.${activeChatSessionId}` 
        },
        (payload) => {
          console.log('[ChatProvider] Chat session updated:', payload);
          if (payload.new && payload.new.is_active === false) {
            console.log('[ChatProvider] Host ended the session');
            setIsChatActive(false);
            setIsSessionEnded(true);
          }
        }
      )
      .subscribe();
      
    sessionChannelRef.current = sessionChannel;

    return () => {
      console.log(`[ChatProvider] useEffect cleanup: Unsubscribing from ${activeChatSessionId}`);
      cleanupChannel();
    };
  }, [activeChatSessionId, handleNewMessage, setupRealtimeConnection]);

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

  const endChatSession = async (chatSessionId: string, userId?: string | null) => {
    if (!chatSessionId) {
      console.error('[ChatProvider] endChatSession: No chat session ID provided');
      return;
    }
    
    try {
      const response = await fetch('/api/end-chat-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chatId: chatSessionId,
          userId: userId,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('[ChatProvider] Error ending chat session:', errorData);
        setChatError(`Failed to end chat session: ${errorData.error || 'Unknown error'}`);
        return;
      }
      
      setIsChatActive(false);
      setIsSessionEnded(true);
    } catch (error) {
      console.error('[ChatProvider] Exception ending chat session:', error);
      setChatError(`Failed to end chat session: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // The old startNewChat and initial welcome message useEffect are removed.
  // Chat creation and initial session setup are now handled by the dashboard/invite flow.

  return (
    <ChatContext.Provider
      value={{
        messages,
        chatId: activeChatSessionId,
        isLoadingMessages,
        chatError,
        isChatActive,
        isSessionEnded,
        addMessage,
        clearChat,
        joinChatSession,
        endChatSession,
        activeChatSessionId,
        clearChatError,
        typingUsers,
        sendTypingEvent,
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