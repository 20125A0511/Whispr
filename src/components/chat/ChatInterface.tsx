'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useChat } from '@/context/ChatProvider';
import { Button } from '@/components/ui/Button';
import { useEndChat } from '@/hooks/useEndChat'; // Adjust path if needed
import EndChatModal from './EndChatModal'; // Adjust path if needed
import { Input } from '@/components/ui/Input';
import ShareChat from './ShareChat';
import { FiShare2, FiSend, FiUser, FiUsers, FiInfo, FiRefreshCw, FiAlertTriangle } from 'react-icons/fi';
import { useAuth } from '@/context/AuthProvider';
import Logo from '@/components/ui/Logo';

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
    isSessionEnded,
    isChatActive,
    endChatSession,
  } = useChat();
  const [newMessage, setNewMessage] = useState('');
  const [showShareOptions, setShowShareOptions] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const {
    isModalOpen: isEndChatModalOpen, // Renamed to avoid clash if ChatInterface had its own isModalOpen
    countdown: endChatCountdown,
    endReason: endChatReason,
    isEnding: isChatEnding, // Renamed to avoid potential clash
    endChat: triggerEndChat,
  } = useEndChat(isHost ? "host" : "guest"); // Pass currentUserRole

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

    if (isChatEnding) {
      console.log('[ChatInterface] Chat is ending, cannot send message.');
      return;
    }
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
  
  const isInputDisabled = isLoadingMessages || !!chatError || !activeChatSessionId || isSessionEnded || !isChatActive || isChatEnding;
  const isSendButtonDisabled = isInputDisabled || !newMessage.trim() || !currentUserName || isChatEnding;

  const handleForceRefresh = () => {
    console.log('[ChatInterface] Manual refresh requested for chatId:', chatId);
    clearChatError();
    joinChatSession(chatId); // Re-join and re-fetch
  };

  const handleEndChatButtonClick = () => {
    if (chatId && !isChatEnding) {
      triggerEndChat(isHost ? "host" : "guest", chatId);
    }
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

  // Add a function to check if the error is related to Realtime
  const isRealtimeError = (error: string | null) => {
    return error?.includes('Realtime connection error') || false;
  };

  return (
    <div className="flex flex-col h-full">
      <EndChatModal
        isOpen={isEndChatModalOpen}
        actor={endChatReason}
        countdown={endChatCountdown}
        onClose={() => {}} // Modal is not closable by user interaction as per spec
      />
      {/* <DebugInfo /> */}
      <div className="bg-white border-b border-gray-200 p-4 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-3">
          <Logo width={100} height={32} className="mr-2" />
          <div className="flex items-center gap-2">
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
        </div>
        {/* "End Chat" and "Share/Info" buttons container */}
        {chatId && isChatActive && (
          <div className="flex gap-2">
            {isHost && ( // Share/Info button only for host
              <Button 
                onClick={toggleShareOptions}
                variant="outline"
                size="sm"
                className="text-gray-700 border-gray-200 hover:bg-gray-50 hover:text-indigo-600 hover:border-indigo-200 transition-colors flex items-center gap-1.5"
                disabled={isChatEnding || !isChatActive} // Disable if ending or chat not active
              >
                <FiShare2 className="w-3.5 h-3.5" />
                <span>{showShareOptions ? 'Hide Options' : 'Share / Info'}</span>
              </Button>
            )}
            {/* "End Chat" button visible to both host and guest when chat is active */}
            <Button 
              onClick={handleEndChatButtonClick}
              variant="outline"
              size="sm"
              className="text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300 transition-colors flex items-center gap-1.5"
              disabled={isChatEnding || !isChatActive} // Disable if ending or chat not active
            >
              <FiAlertTriangle className="w-3.5 h-3.5" />
              <span>End Chat</span>
            </Button>
          </div>
        )}
      </div>

      {isHost && showShareOptions && chatId && isChatActive && !isChatEnding && ( // Also hide if chat is ending
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

      {isSessionEnded && (
        <div className="p-4 border-b border-red-200 bg-red-50 text-center">
          <div className="flex items-center justify-center gap-2 text-red-600 mb-2">
            <FiAlertTriangle className="w-5 h-5" />
            <span className="font-medium">This chat session has ended</span>
          </div>
          {!isHost && (
            <p className="text-sm text-red-700">
              The host has ended this chat session. You can no longer send messages.
            </p>
          )}
          {isHost && (
            <p className="text-sm text-red-700">
              You have ended this chat session. The guest can no longer send messages.
            </p>
          )}
        </div>
      )}

      <div className="flex-1 p-5 overflow-y-auto bg-white">
        <div className="space-y-5 max-w-3xl mx-auto">
          {isLoadingMessages && messages.length === 0 && (
            <div className="text-center py-10"><p>Loading messages...</p></div>
          )}
          {!isLoadingMessages && chatError && (
            <div className="text-center py-6 bg-red-50 p-4 rounded-md relative">
              <div className="mb-2">
                {isRealtimeError(chatError) ? (
                  <FiRefreshCw className="mx-auto h-8 w-8 text-red-500 mb-2" />
                ) : (
                  <FiAlertTriangle className="mx-auto h-8 w-8 text-red-500 mb-2" />
                )}
              </div>
              <p className="text-red-700 font-medium">{chatError}</p>
              
              {isRealtimeError(chatError) && (
                <div className="mt-4">
                  <p className="text-sm text-red-600 mb-3">
                    Supabase Realtime service is having trouble connecting. This is needed for receiving messages in real-time.
                  </p>
                  <Button 
                    onClick={handleForceRefresh} 
                    className="bg-red-600 hover:bg-red-700 text-white"
                    size="sm"
                  >
                    <FiRefreshCw className="mr-2 h-4 w-4" /> 
                    Retry Connection
                  </Button>
                </div>
              )}
              
              {!isRealtimeError(chatError) && (
                <Button onClick={handleDismissError} variant="outline" size="sm" className="mt-2">
                  Dismiss
                </Button>
              )}
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
            placeholder={
              isChatEnding ? "Chat is ending..." :
              isSessionEnded ? "Chat session has ended" :
              isInputDisabled ? (chatError ? "Error occurred" : "Connecting...") : 
              "Type a message..."
            }
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            className="flex-1 focus:ring-indigo-500 focus:border-indigo-500 rounded-full"
            disabled={isInputDisabled || isChatEnding} // Ensure disabling during chat ending
            onFocus={handleDismissError} // Clear error on focus to allow typing if it was an error
          />
          <Button 
            type="submit" 
            className="rounded-full bg-indigo-600 hover:bg-indigo-700 flex items-center gap-1.5 px-4"
            disabled={isSendButtonDisabled || isChatEnding} // Ensure disabling during chat ending
          >
            <span>Send</span>
            <FiSend className="w-3.5 h-3.5" />
          </Button>
        </form>
      </div>
    </div>
  );
} 