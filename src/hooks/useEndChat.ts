import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/utils/supabase';

type UseEndChatProps = {
  chatId: string;
  isHost: boolean;
  // onRemoteEnd: (endedByHost: boolean) => void; // Removed
};

const useEndChat = ({ chatId, isHost }: UseEndChatProps) => { // Removed onRemoteEnd
  const router = useRouter();

  const [showEndChatModal, setShowEndChatModal] = useState<boolean>(false);
  const [countdown, setCountdown] = useState<number>(5);
  const [endedByHost, setEndedByHost] = useState<boolean | null>(null);
  const [isEndingChat, setIsEndingChat] = useState<boolean>(false);

  const closeModalAndReset = useCallback(() => {
    setShowEndChatModal(false);
    setCountdown(5);
    setEndedByHost(null);
    setIsEndingChat(false);
  }, []);

  const endChat = useCallback(async (reason: 'host' | 'guest') => {
    if (isEndingChat) return;

    setIsEndingChat(true);
    setShowEndChatModal(true);
    setEndedByHost(reason === 'host');

    const channel = supabase.channel(`session-${chatId}`);
    // No need to subscribe here just to send.
    // The listener useEffect will handle receiving for all clients.
    channel.send({
      type: 'broadcast',
      event: 'chat:end',
      payload: { chatId, reason },
    });
    // Ensure the channel is subscribed to in the listening useEffect.
    // If not already subscribed for listening, this send might not go through
    // or might implicitly create it. Best practice is to ensure
    // the listening subscription is robust.
    // For now, this direct send is fine as the listening useEffect establishes the channel.

    // Countdown will be handled by the useEffect hook
  }, [chatId, isEndingChat, supabase]);

  const triggerRemoteEnd = useCallback((reason: 'host' | 'guest') => {
    if (isEndingChat) return;

    setIsEndingChat(true);
    setShowEndChatModal(true);
    setEndedByHost(reason === 'host');
    // Countdown will be handled by the useEffect hook
    // onRemoteEnd(reason === 'host'); // Removed call
  }, [isEndingChat]); // Removed onRemoteEnd from dependency array

  // useEffect for countdown
  useEffect(() => {
    let timer: NodeJS.Timeout;

    if (isEndingChat && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prevCountdown) => prevCountdown - 1);
      }, 1000);
    } else if (isEndingChat && countdown === 0) {
      fetch('/api/end-chat-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatId }),
      })
        .then(() => {
          if (isHost) {
            router.push('/dashboard');
          } else {
            router.push('/chat-ended');
          }
        })
        .catch(console.error) // Handle potential errors
        .finally(() => {
          closeModalAndReset();
        });
    }

    return () => {
      clearInterval(timer);
    };
  }, [isEndingChat, countdown, isHost, router, chatId, closeModalAndReset]); // Removed supabase

  // useEffect for Supabase subscription
  useEffect(() => {
    const channel = supabase.channel(`session-${chatId}`);

    const handleRemoteEnd = (payload: any) => {
      // Check if the event is for this chat
      if (payload.chatId === chatId) { // Removed !isEndingChat check
        const reason = payload.reason as 'host' | 'guest';
        triggerRemoteEnd(reason);
      }
    };

    channel
      .on('broadcast', { event: 'chat:end' }, ({ payload }) => handleRemoteEnd(payload))
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log(`Subscribed to chat:end on session-${chatId}`);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [chatId, supabase, triggerRemoteEnd, isEndingChat]);


  return {
    showEndChatModal,
    countdown,
    endedByHost,
    isEndingChat,
    endChat,
    triggerRemoteEnd,
    closeModalAndReset,
  };
};

export default useEndChat;
