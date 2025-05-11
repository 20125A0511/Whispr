'use client';

import { useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useChat } from '@/context/ChatProvider';
import ChatInterface from '@/components/chat/ChatInterface';
import { useAuth } from '@/context/AuthProvider';
import OtpAuthFlow from '@/components/auth/OtpAuthFlow';

export default function ChatPage() {
  const params = useParams();
  const chatId = params.chatId as string;
  const { joinChat } = useChat();
  const { user, isLoading } = useAuth();

  // Join the chat when component mounts and chatId is available
  useEffect(() => {
    if (chatId && user) {
      joinChat(chatId);
    }
  }, [chatId, joinChat, user]);

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-white flex items-center justify-center z-[200]">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-6 sm:p-8 max-w-md w-full border border-gray-200">
          <OtpAuthFlow 
            onSuccess={() => { /* Potentially reload or handle join logic */}} 
            signInMode="withName"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <main className="flex-1 flex flex-col bg-white shadow-md max-w-4xl mx-auto h-full">
        <ChatInterface />
      </main>
    </div>
  );
} 