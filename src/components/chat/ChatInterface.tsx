'use client';

import { useState } from 'react';
import { useChat } from '@/context/ChatProvider';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import ShareChat from './ShareChat';

export default function ChatInterface() {
  const { messages, chatId, addMessage } = useChat();
  const [newMessage, setNewMessage] = useState('');
  const [showShareOptions, setShowShareOptions] = useState(false);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim()) {
      addMessage(newMessage.trim(), 'user');
      setNewMessage('');
    }
  };

  const toggleShareOptions = () => {
    setShowShareOptions(!showShareOptions);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Chat header */}
      <div className="bg-blue-600 text-white p-3 flex justify-between items-center">
        <h2 className="font-semibold">Temporary Chat</h2>
        <Button 
          onClick={toggleShareOptions}
          variant="ghost"
          className="text-white hover:bg-blue-700"
        >
          {showShareOptions ? 'Hide Share Options' : 'Share Chat'}
        </Button>
      </div>

      {/* Share options */}
      {showShareOptions && (
        <div className="p-3 border-b border-gray-200">
          <ShareChat chatId={chatId} />
        </div>
      )}

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
                <div className="text-xs mt-1 opacity-70">
                  {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
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
  );
} 