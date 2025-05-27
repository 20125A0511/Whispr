import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/utils/supabase'; // Assuming this is the configured Supabase client
import { RealtimeChannel } from '@supabase/supabase-js';
import { useChat } from '@/context/ChatProvider'; // Added for ChatContext access

type EndReason = 'host' | 'guest';
type CurrentUserRole = 'host' | 'guest';

interface UseEndChatReturn {
  isModalOpen: boolean;
  countdown: number;
  endReason: EndReason | null;
  isEnding: boolean;
  endChat: (reason: EndReason, currentChatId: string) => void;
  handleIncomingEndChatEvent: (
    payload: { reason: EndReason; chatId: string },
    currentChatId: string,
    currentUserRole: CurrentUserRole
  ) => void;
}

const COUNTDOWN_INITIAL = 5;

export const useEndChat = (currentUserRole: CurrentUserRole): UseEndChatReturn => {
  const { receivedEndChatEvent, clearReceivedEndChatEvent, activeChatSessionId } = useChat();

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [countdown, setCountdown] = useState<number>(COUNTDOWN_INITIAL);
  const [endReason, setEndReason] = useState<EndReason | null>(null);
  const [isEnding, setIsEnding] = useState<boolean>(false);

  const router = useRouter();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  // channelRef is no longer needed for the broadcast channel as its lifecycle is self-contained in endChat.

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const startCountdown = useCallback((onComplete: () => void) => {
    clearTimer();
    setCountdown(COUNTDOWN_INITIAL);
    setIsModalOpen(true);
    intervalRef.current = setInterval(() => {
      setCountdown((prevCountdown) => {
        if (prevCountdown <= 1) {
          clearTimer();
          onComplete();
          return 0;
        }
        return prevCountdown - 1;
      });
    }, 1000);
  }, [clearTimer]);

  const endChat = useCallback(async (reason: EndReason, currentChatId: string) => {
    if (isEnding) return;

    setIsEnding(true);
    setEndReason(reason);
    // Modal is opened by startCountdown

    if (supabase) {
      const channelName = `realtime-chat-${currentChatId}`;
      // Create a new channel instance for sending this event.
      // Important: This instance is temporary and specific to this send operation.
      const tempChannel = supabase.channel(channelName, {
        config: {
          broadcast: {
            ack: true, // As per new requirement for channel management
            // self: false, // Generally good, but ChatProvider might need to see its own for some reason (unlikely for chat:end)
                         // If ChatProvider is already subscribed and handles its own events, this is fine.
                         // The main thing is that `useEndChat` doesn't also trigger its own `handleIncomingEndChatEvent` from its own send.
                         // The `isEnding` flag in `handleIncomingEndChatEvent` should prevent self-triggering issues.
          },
        },
      });

      tempChannel.subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          try {
            await tempChannel.send({
              type: 'broadcast',
              event: 'chat:end',
              payload: { reason, chatId: currentChatId },
            });
            console.log(`[useEndChat] Sent "chat:end" event on ${channelName}`);
          } catch (error) {
            console.error(`[useEndChat] Error sending "chat:end" event on ${channelName}:`, error);
          } finally {
            // Immediately unsubscribe and remove this temporary channel instance
            // to avoid conflicts or duplicate handlers with ChatProvider's persistent channel.
            supabase.removeChannel(tempChannel);
            console.log(`[useEndChat] Removed temporary channel instance ${channelName} after sending.`);
          }
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
          console.error(`[useEndChat] Channel error for ${channelName} before sending "chat:end": ${status}.`);
          // Attempt to remove the channel to clean up
          supabase.removeChannel(tempChannel);
          console.log(`[useEndChat] Removed temporary channel instance ${channelName} due to error.`);
        }
      });
    } else {
      console.warn('[useEndChat] Supabase client not available for sending chat:end event.');
    }

    startCountdown(() => {
      // Post-countdown actions for initiator
      fetch('/api/end-chat-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatId: currentChatId }),
      })
      .then(async res => {
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({})); // Catch if res.json() fails
          console.error('API call to /api/end-chat-session failed:', res.status, errorData);
          // Potentially handle error, e.g. show a notification to the user
        } else {
          console.log('/api/end-chat-session call successful');
        }
      })
      .catch(error => {
        console.error('Error calling /api/end-chat-session:', error);
      })
      .finally(() => {
        // Role-specific redirects for the initiator
        if (reason === 'host') {
          router.push('/');
        } else if (reason === 'guest') {
          router.push('/chat-ended');
        }
        setIsModalOpen(false); // Or let redirect handle unmount
        setIsEnding(false);
        setEndReason(null);
        setCountdown(COUNTDOWN_INITIAL); // Reset countdown for potential next use
      });
    });
  }, [isEnding, router, startCountdown, clearTimer]);


  const handleIncomingEndChatEvent = useCallback((
    payload: { reason: EndReason; chatId: string },
    currentChatId: string,
    currentUserRole: CurrentUserRole
  ) => {
    if (payload.chatId !== currentChatId || isEnding) {
      return;
    }

    setIsEnding(true);
    setEndReason(payload.reason);
    // Modal is opened by startCountdown

    startCountdown(() => {
      // Post-countdown actions for receiver
      // API call is NOT made by the receiver as per design.
      if (currentUserRole === 'host') {
        router.push('/');
      } else if (currentUserRole === 'guest') {
        router.push('/chat-ended');
      }
      setIsModalOpen(false); // Or let redirect handle unmount
      setIsEnding(false);
      setEndReason(null);
      setCountdown(COUNTDOWN_INITIAL); // Reset countdown
    });
  }, [isEnding, router, startCountdown, clearTimer]); // Dependencies seem correct

  // Effect to handle incoming chat end events from ChatContext
  useEffect(() => {
    if (
      receivedEndChatEvent &&
      activeChatSessionId &&
      receivedEndChatEvent.chatId === activeChatSessionId
    ) {
      console.log('[useEndChat] Detected receivedEndChatEvent from context:', receivedEndChatEvent);
      // The handleIncomingEndChatEvent function is responsible for checking isEnding
      handleIncomingEndChatEvent(
        receivedEndChatEvent,
        activeChatSessionId,
        currentUserRole
      );
      clearReceivedEndChatEvent(); // Reset the event in ChatContext
    }
  }, [
    receivedEndChatEvent,
    clearReceivedEndChatEvent,
    activeChatSessionId,
    currentUserRole,
    handleIncomingEndChatEvent, // handleIncomingEndChatEvent is memoized with useCallback
  ]);

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      clearTimer();
      // channelRef.current is no longer used for the broadcast channel,
      // as its lifecycle is self-contained within the endChat function.
      // If channelRef were used for other persistent subscriptions by this hook, that cleanup would remain.
    };
  }, [clearTimer]);

  return {
    isModalOpen,
    countdown,
    endReason,
    isEnding,
    endChat,
    handleIncomingEndChatEvent,
  };
};
