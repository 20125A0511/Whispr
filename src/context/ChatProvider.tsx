'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { generateChatId, isChatExpired } from '@/utils/chatUtils';

interface Message {
  id: number;
  text: string;
  sender: 'user' | 'other';
  senderName?: string;
  timestamp: Date;
}

interface ChatContextType {
  messages: Message[];
  chatId: string;
  lastActivity: Date;
  isTemporary: boolean;
  addMessage: (text: string, sender: 'user' | 'other', senderName?: string) => void;
  clearChat: () => void;
  startNewChat: () => void;
  joinChat: (id: string) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatId, setChatId] = useState<string>('');
  const [lastActivity, setLastActivity] = useState<Date>(new Date());
  const [isTemporary] = useState<boolean>(true);

  // Initialize with a new chat ID when the component mounts
  useEffect(() => {
    const newChatId = generateChatId();
    setChatId(newChatId);
    
    // Set welcome messages
    setMessages([
      { 
        id: 1, 
        text: 'Welcome to your temporary chat!', 
        sender: 'other',
        senderName: 'System',
        timestamp: new Date()
      },
      { 
        id: 2, 
        text: 'Share your unique link or QR code to invite others.', 
        sender: 'other',
        senderName: 'System',
        timestamp: new Date()
      },
      { 
        id: 3, 
        text: 'Remember: This chat will be deleted when the session ends.', 
        sender: 'other',
        senderName: 'System',
        timestamp: new Date()
      },
    ]);
  }, []);
  
  // Check for chat expiry every minute
  useEffect(() => {
    const checkInterval = setInterval(() => {
      if (isTemporary && isChatExpired(lastActivity)) {
        clearChat();
      }
    }, 60000); // Check every minute
    
    return () => clearInterval(checkInterval);
  }, [lastActivity, isTemporary]);

  // Clear chat data when window is closed or refreshed
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (isTemporary) {
        // We could persist data to sessionStorage here if we wanted a way to recover
        // But for truly temporary chats, we let it get destroyed
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isTemporary]);

  const addMessage = (text: string, sender: 'user' | 'other', senderName?: string) => {
    const newMessage = {
      id: messages.length + 1,
      text,
      sender,
      senderName,
      timestamp: new Date()
    };
    
    setMessages((prev) => [...prev, newMessage]);
    setLastActivity(new Date());
  };

  const clearChat = () => {
    setMessages([]);
    setLastActivity(new Date());
  };
  
  const startNewChat = () => {
    clearChat();
    const newChatId = generateChatId();
    setChatId(newChatId);
  };
  
  const joinChat = (id: string) => {
    setChatId(id);
    clearChat();
    
    // Add a welcome message for the joined chat
    addMessage(`You&apos;ve joined a temporary chat session. This conversation will be deleted when the session ends.`, 'other', 'System');
  };

  return (
    <ChatContext.Provider
      value={{
        messages,
        chatId,
        lastActivity,
        isTemporary,
        addMessage,
        clearChat,
        startNewChat,
        joinChat
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