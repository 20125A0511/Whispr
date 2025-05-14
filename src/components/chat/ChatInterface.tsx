'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useChat } from '@/context/ChatProvider';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import ShareChat from './ShareChat';
import { FiShare2, FiSend, FiUser, FiUsers, FiInfo, FiRefreshCw } from 'react-icons/fi';
import { useAuth } from '@/context/AuthProvider';

interface ChatInterfaceProps {
  chatId: string;
  currentUserName: string;
  isHost: boolean;
  initialHostName?: string | null;
  initialGuestName?: string | null;
}

export default function ChatInterface({
  chatId,
  currentUserName,
  isHost,
  initialHostName,
  initialGuestName,
}: ChatInterfaceProps) {
  const { user: authenticatedUser } = useAuth();
  const {
    messages,
    addMessage,
    isLoadingMessages,
    chatError,
    activeChatSessionId,
    joinChatSession,
    clearChatError,
  } = useChat();
  const [newMessage, setNewMessage] = useState('');
  const [showShareOptions, setShowShareOptions] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatId && (!activeChatSessionId || activeChatSessionId !== chatId)) {
      console.log(`[ChatInterface] Prop chatId (${chatId}) differs from context activeChatSessionId (${activeChatSessionId}). Calling joinChatSession.`);
      joinChatSession(chatId);
    }
  }, [chatId, activeChatSessionId, joinChatSession]);

  useEffect(() => {
    console.log('[ChatInterface] Props:', { chatId, currentUserName, isHost, initialHostName, initialGuestName });
    console.log('[ChatInterface] Chat context:', { activeChatSessionId, isLoadingMessages, chatError, messageCount: messages.length });
  }, [chatId, messages.length, isLoadingMessages, chatError, activeChatSessionId]);

  const displayHostName = initialHostName || (isHost ? currentUserName : 'Host');
  const displayGuestName = initialGuestName || (!isHost ? currentUserName : 'Guest');

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('[ChatInterface] handleSendMessage triggered.');

    if (!activeChatSessionId) {
      console.error('[ChatInterface] Cannot send message, no active chat session in context.');
      // Optionally, set a local error or trigger a reconnect/rejoin
      return;
    }
    if (!currentUserName) {
      console.error('[ChatInterface] Cannot send message, currentUserName is not set.');
      return;
    }
    if (!newMessage.trim()) {
      console.log('[ChatInterface] Message is empty, not sending.');
      return;
    }

    console.log(`[ChatInterface] Attempting to send message: "${newMessage.trim()}" as ${currentUserName} (isHost: ${isHost}) to chat ${activeChatSessionId}`);
    try {
      await addMessage(newMessage.trim(), currentUserName, isHost ? authenticatedUser?.id : null);
      setNewMessage(''); // Clear input only on successful attempt
    } catch (error) {
      console.error('[ChatInterface] Error calling addMessage:', error);
      // The error should be set in ChatProvider and reflected by chatError
    }
  }, [newMessage, currentUserName, isHost, authenticatedUser, addMessage, activeChatSessionId]);

  const toggleShareOptions = () => setShowShareOptions(!showShareOptions);
  const handleDismissError = () => clearChatError();

  const otherParticipantName = isHost ? displayGuestName : displayHostName;
  
  const isInputDisabled = isLoadingMessages || !!chatError || !activeChatSessionId;
  const isSendButtonDisabled = isInputDisabled || !newMessage.trim() || !currentUserName;

  const handleForceRefresh = () => {
    console.log('[ChatInterface] Manual refresh requested for chatId:', chatId);
    clearChatError();
    joinChatSession(chatId); // Re-join and re-fetch
  };
  
  // Dev-only debug info
  const DebugInfo = () => (
    // Set to null to hide the debug info panel permanently
    null
    // process.env.NODE_ENV === 'development' ? (
    //   <div className="p-2 text-xs bg-gray-50 border-b text-gray-500">
    //     <p>DEBUG:</p>
    //     <p>Prop Chat ID: {chatId}, Context Active ID: {activeChatSessionId || 'N/A'}</p>
    //     <p>Current User: {currentUserName || 'N/A'}, Is Host: {String(isHost)}</p>
    //     <p>Messages: {messages.length}, Loading: {String(isLoadingMessages)}, Error: {chatError || 'None'}</p>
    //     <p>Input Disabled: {String(isInputDisabled)}, Send Disabled: {String(isSendButtonDisabled)}</p>
    //     <Button onClick={handleForceRefresh} size="sm" variant="outline" className="mt-1 text-xs h-6">
    //         <FiRefreshCw className="mr-1 h-3 w-3" /> Force Re-join & Fetch
    //     </Button>
    //   </div>
    // ) : null
  );

  return (
    <div className="flex flex-col h-full">
      {/* <DebugInfo /> */}
      <div className="bg-white border-b border-gray-200 p-4 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-3">
          <FiUsers className="w-5 h-5 text-indigo-600" />
          <div>
            <h2 className="font-medium text-gray-800 leading-tight">
              Chat with {otherParticipantName === 'Guest' && !initialGuestName ? 'your Guest' : otherParticipantName}
            </h2>
            <p className="text-xs text-gray-500">
              You are: <span className="font-semibold">{currentUserName}</span> {isHost ? '(Host)' : '(Guest)'}
            </p>
          </div>
        </div>
        {chatId && isHost && ( // Only show Share button if user isHost
          <Button 
            onClick={toggleShareOptions}
            variant="outline"
            size="sm"
            className="text-gray-700 border-gray-200 hover:bg-gray-50 hover:text-indigo-600 hover:border-indigo-200 transition-colors flex items-center gap-1.5"
          >
            <FiShare2 className="w-3.5 h-3.5" />
            <span>{showShareOptions ? 'Hide Options' : 'Share / Info'}</span>
          </Button>
        )}
      </div>

      {isHost && showShareOptions && chatId && ( // Only show Share options panel if user isHost
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <ShareChat chatId={chatId} />
          <div className="mt-3 pt-3 border-t border-gray-200">
            <p className="text-xs text-gray-600">
              <FiInfo className="inline mr-1 mb-0.5" /> 
              This is a temporary chat. The conversation will be deleted when the session ends or the host closes it.
            </p>
          </div>
        </div>
      )}

      <div className="flex-1 p-5 overflow-y-auto bg-white">
        <div className="space-y-5 max-w-3xl mx-auto">
          {isLoadingMessages && messages.length === 0 && (
            <div className="text-center py-10"><p>Loading messages...</p></div>
          )}
          {!isLoadingMessages && chatError && (
            <div className="text-center py-10 bg-red-50 p-4 rounded-md relative">
              <p>Error: {chatError}</p>
              <Button onClick={handleDismissError} variant="outline" size="sm" className="mt-2">Dismiss</Button>
            </div>
          )}
          {!isLoadingMessages && !chatError && messages.length === 0 && (
            <div className="text-center py-10"><p>No messages yet. Send one to start!</p></div>
          )}
          
          {messages.map((message) => (
            <div 
              key={message.id} 
              className={`flex ${message.sender_name === currentUserName ? 'justify-end' : 'justify-start'}`}
            >
              <div 
                className={`max-w-[80%] p-3.5 rounded-xl shadow-sm ${ message.sender_name === currentUserName ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-gray-100 text-gray-800 rounded-bl-none border border-gray-200'}
                }`}
              >
                <div className={`text-xs mb-1 font-medium ${message.sender_name === currentUserName ? 'text-indigo-200' : 'text-gray-500'}`}>
                  {message.sender_name} {message.user_id === authenticatedUser?.id && isHost ? '(You - Host)' : message.sender_name === currentUserName ? '(You)' : ''}
                </div>
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.message_text}</p>
                <div className={`text-xs mt-1.5 ${message.sender_name === currentUserName ? 'text-indigo-200' : 'text-gray-500'}`}>
                  {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="border-t border-gray-200 p-4 bg-white">
        <form onSubmit={handleSendMessage} className="flex space-x-2 max-w-3xl mx-auto">
          <Input
            type="text"
            placeholder={isInputDisabled ? (chatError ? "Error occurred" : "Connecting...") : "Type a message..."}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            className="flex-1 focus:ring-indigo-500 focus:border-indigo-500 rounded-full"
            disabled={isInputDisabled}
            onFocus={handleDismissError} // Clear error on focus to allow typing if it was an error
          />
          <Button 
            type="submit" 
            className="rounded-full bg-indigo-600 hover:bg-indigo-700 flex items-center gap-1.5 px-4"
            disabled={isSendButtonDisabled}
          >
            <span>Send</span>
            <FiSend className="w-3.5 h-3.5" />
          </Button>
        </form>
      </div>
    </div>
  );
} 