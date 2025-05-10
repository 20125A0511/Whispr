'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthProvider';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [messages, setMessages] = useState<{ id: number; text: string; sender: 'user' | 'other' }[]>([
    { id: 1, text: 'Hello! Welcome to texttemp.', sender: 'other' },
    { id: 2, text: 'This is a demo of our iMessage-like interface.', sender: 'other' },
    { id: 3, text: 'Try sending a message below!', sender: 'other' },
  ]);
  const [newMessage, setNewMessage] = useState('');

  useEffect(() => {
    if (!user) {
      router.push('/');
    }
  }, [user, router]);

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim()) {
      const userMessage = {
        id: messages.length + 1,
        text: newMessage,
        sender: 'user' as const,
      };
      
      setMessages([...messages, userMessage]);
      setNewMessage('');
      
      // Simulate a response after a short delay
      setTimeout(() => {
        const botResponse = {
          id: messages.length + 2,
          text: `You said: "${newMessage}"`,
          sender: 'other' as const,
        };
        setMessages(prev => [...prev, botResponse]);
      }, 1000);
    }
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

      {/* Chat container */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <div className="w-64 bg-white border-r border-gray-200 hidden md:block p-4">
          <h2 className="font-bold mb-4">Conversations</h2>
          <div className="bg-blue-100 rounded-lg p-3 cursor-pointer">
            <div className="font-medium">Demo Chat</div>
            <div className="text-xs text-gray-500 truncate">Try sending a message!</div>
          </div>
        </div>

        {/* Main chat area */}
        <div className="flex-1 flex flex-col">
          {/* Messages */}
          <div className="flex-1 p-4 overflow-y-auto">
            <div className="space-y-4">
              {messages.map((message) => (
                <div 
                  key={message.id} 
                  className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div 
                    className={`max-w-[70%] p-3 rounded-lg ${
                      message.sender === 'user' 
                        ? 'bg-blue-600 text-white rounded-br-none' 
                        : 'bg-gray-200 text-gray-800 rounded-bl-none'
                    }`}
                  >
                    {message.text}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Message input */}
          <div className="border-t border-gray-200 p-4 bg-white">
            <form onSubmit={handleSendMessage} className="flex space-x-2">
              <Input
                type="text"
                placeholder="Type a message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                className="flex-1"
              />
              <Button type="submit">Send</Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
} 