'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthProvider';
import { Button } from '@/components/ui/Button';
import ChatInterface from '@/components/chat/ChatInterface';

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      router.push('/');
    }
  }, [user, router]);

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  if (!user) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-blue-600 text-white p-4 flex justify-between items-center">
        <h1 className="text-xl font-bold">texttemp</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm">{user.email}</span>
          <Button 
            onClick={handleSignOut}
            variant="ghost"
            className="text-white hover:bg-blue-700"
          >
            Sign Out
          </Button>
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar (can be used to show available chats) */}
        <div className="w-64 bg-white border-r border-gray-200 hidden md:block p-4">
          <h2 className="font-bold mb-4">Temporary Chat</h2>
          <p className="text-sm text-gray-600 mb-4">Your conversations are not stored and will be deleted when the session ends.</p>
          
          <div className="bg-blue-100 rounded-lg p-3 cursor-pointer">
            <div className="font-medium">Current Session</div>
            <div className="text-xs text-gray-500 truncate">Share your chat using the button above</div>
          </div>
        </div>

        {/* Main chat area */}
        <div className="flex-1 flex flex-col">
          <ChatInterface />
        </div>
      </div>
    </div>
  );
} 