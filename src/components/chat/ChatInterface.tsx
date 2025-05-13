'use client';

import { useState, useRef, useEffect } from 'react';
import { useChat } from '@/context/ChatProvider';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import ShareChat from './ShareChat';
import { FiShare2, FiSend, FiUser } from 'react-icons/fi';

interface ChatInterfaceProps {
  chatId?: string | null;
  hostName?: string;
}

export default function ChatInterface({ chatId: externalChatId, hostName }: ChatInterfaceProps) {
  const { messages, chatId: contextChatId, addMessage } = useChat();
  const [newMessage, setNewMessage] = useState('');
  const [showShareOptions, setShowShareOptions] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Use externally provided chatId if available, otherwise use the one from context
  const activeChatId = externalChatId || contextChatId;

  // Scroll to bottom of messages when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim()) {
      // Add the host name to the message if available
      addMessage(newMessage.trim(), 'user', hostName);
      setNewMessage('');
    }
  };

  const toggleShareOptions = () => {
    setShowShareOptions(!showShareOptions);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Chat header */}
      <div className="bg-white border-b border-gray-200 p-4 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-2">
          <h2 className="font-medium text-gray-800">Conversation</h2>
          {hostName && (
            <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full flex items-center gap-1">
              <FiUser className="w-3 h-3" />
              {hostName}
            </span>
          )}
        </div>
        <Button 
          onClick={toggleShareOptions}
          variant="outline"
          size="sm"
          className="text-gray-700 border-gray-200 hover:bg-gray-50 hover:text-indigo-600 hover:border-indigo-200 transition-colors flex items-center gap-1.5"
        >
          <FiShare2 className="w-3.5 h-3.5" />
          <span>{showShareOptions ? 'Hide Share Options' : 'Share Chat'}</span>
        </Button>
      </div>

      {/* Share options */}
      {showShareOptions && (
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <ShareChat chatId={activeChatId || ''} />
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 p-5 overflow-y-auto bg-white">
        <div className="space-y-5 max-w-3xl mx-auto">
          {messages.length === 0 && (
            <div className="text-center py-10">
              <p className="text-gray-500 text-sm">No messages yet. Start the conversation!</p>
            </div>
          )}
          
          {messages.map((message) => (
            <div 
              key={message.id} 
              className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div 
                className={`max-w-[80%] p-3.5 rounded-xl shadow-sm ${
                  message.sender === 'user' 
                    ? 'bg-indigo-600 text-white rounded-br-none' 
                    : 'bg-gray-100 text-gray-800 rounded-bl-none border border-gray-200'
                }`}
              >
                {message.senderName && (
                  <div className={`text-xs mb-1 font-medium ${message.sender === 'user' ? 'text-indigo-200' : 'text-gray-500'}`}>
                    {message.senderName}
                  </div>
                )}
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.text}</p>
                <div className={`text-xs mt-1.5 ${message.sender === 'user' ? 'text-indigo-200' : 'text-gray-500'}`}>
                  {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} /> {/* Empty div for scrolling to bottom */}
        </div>
      </div>

      {/* Message input */}
      <div className="border-t border-gray-200 p-4 bg-white">
        <form onSubmit={handleSendMessage} className="flex space-x-2 max-w-3xl mx-auto">
          <Input
            type="text"
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            className="flex-1 focus:ring-indigo-500 focus:border-indigo-500 rounded-full"
          />
          <Button 
            type="submit" 
            className="rounded-full bg-indigo-600 hover:bg-indigo-700 flex items-center gap-1.5 px-4"
            disabled={!newMessage.trim()}
          >
            <span>Send</span>
            <FiSend className="w-3.5 h-3.5" />
          </Button>
        </form>
      </div>
    </div>
  );
} 