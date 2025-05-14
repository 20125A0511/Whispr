'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input'; // Assuming you have a general Input component
import { useChat } from '@/context/ChatProvider'; // To potentially set guest name later

export default function JoinChatPage() {
  const params = useParams();
  const router = useRouter();
  const { joinChat } = useChat(); // We might use this or pass info differently

  const chatId = params.chatId as string;
  const [guestName, setGuestName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!chatId) {
      setError('Chat ID is missing from the link.');
    }
  }, [chatId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestName.trim()) {
      setError('Please enter your name.');
      return;
    }
    if (!chatId) {
      setError('Chat ID is missing. Cannot proceed.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await fetch('/api/validate-join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ chatId, guestName: guestName.trim() }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to join chat. The link may be invalid, expired, or already used.');
      }

      setSuccessMessage('Successfully joined! Redirecting to chat...');
      
      // Option 1: Call joinChat from ChatProvider if it can handle guestName
      // joinChat(data.chatId, data.guestName, data.hostName); // This would require ChatProvider modification

      // Option 2: Navigate to the main chat page with guest info in query params or state management
      // For simplicity, let's use query params for now. This means ChatInterface/ChatPage needs to read them.
      router.push(`/chat/${data.chatId}?guest=${encodeURIComponent(data.guestName)}&host=${encodeURIComponent(data.hostName)}`);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(errorMessage);
      console.error('Error joining chat:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (!chatId && !error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
        <div className="bg-white p-8 rounded-lg shadow-xl max-w-md w-full text-center">
          <p className="text-gray-700">Loading chat information...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-600 p-4">
      <div className="bg-white p-8 sm:p-10 rounded-xl shadow-2xl max-w-md w-full animate-fadeIn">
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-2">Join Chat</h1>
        <p className="text-center text-gray-600 mb-6">You've been invited to a temporary chat.</p>
        
        {successMessage && (
          <div className="mb-4 p-3 rounded-md bg-green-50 text-green-700 border border-green-200 text-center">
            {successMessage}
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 rounded-md bg-red-50 text-red-700 border border-red-200 text-center whitespace-pre-wrap">
            {error}
          </div>
        )}

        {!successMessage && (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="guestName" className="block text-sm font-medium text-gray-700 mb-1">
                Enter Your Name
              </label>
              <Input
                id="guestName"
                type="text"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                placeholder="Your Name"
                required
                className="w-full text-lg"
                disabled={isLoading}
              />
            </div>
            <Button 
              type="submit" 
              className="w-full h-12 text-base font-semibold"
              disabled={isLoading || !chatId}
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Joining...
                </span>
              ) : (
                'Join Chat'
              )}
            </Button>
          </form>
        )}
        
        {error && !successMessage && (
            <div className="mt-6 text-center">
                 <p className="text-sm text-gray-500">If you believe this is an error, please contact the person who invited you.</p>
            </div>
        )}
      </div>
    </div>
  );
} 