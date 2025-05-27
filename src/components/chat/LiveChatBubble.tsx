'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useChat } from '@/context/ChatProvider';
import { FiMessageSquare, FiX } from 'react-icons/fi'; // Chat icon and a close icon

const LiveChatBubble = () => {
  const { activeChatSessionId, messages } = useChat();
  const router = useRouter();
  const pathname = usePathname();

  const [isVisible, setIsVisible] = useState(false);
  const [hasNewMessages, setHasNewMessages] = useState(false);
  const prevMessagesLengthRef = useRef(messages.length);

  // Determine if the bubble should be visible
  useEffect(() => {
    const isOnChatPage = pathname?.startsWith('/chat/');
    if (activeChatSessionId && !isOnChatPage) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
      setHasNewMessages(false); // Reset new messages indicator if not visible or on chat page
    }
  }, [activeChatSessionId, pathname]);

  // Simplified new message detection
  useEffect(() => {
    const isOnChatPage = pathname?.startsWith('/chat/');
    if (isVisible && !isOnChatPage && messages.length > prevMessagesLengthRef.current) {
      setHasNewMessages(true);
    }
    prevMessagesLengthRef.current = messages.length;
  }, [messages, isVisible, pathname]);

  const handleBubbleClick = () => {
    if (activeChatSessionId) {
      router.push(`/chat/${activeChatSessionId}`);
      setHasNewMessages(false); // Reset indicator on click
    }
  };

  if (!isVisible) {
    return null;
  }

  return (
    <button
      onClick={handleBubbleClick}
      className="fixed bottom-5 right-5 z-50 bg-indigo-600 text-white p-4 rounded-full shadow-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all duration-150 ease-in-out"
      aria-label="Open live chat"
    >
      <FiMessageSquare size={24} />
      {hasNewMessages && (
        <span className="absolute top-0 right-0 block h-3.5 w-3.5 transform -translate-y-1/3 -translate-x-1/3 rounded-full bg-red-500 ring-2 ring-white" />
      )}
    </button>
  );
};

export default LiveChatBubble;
