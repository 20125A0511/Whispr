'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useChat } from '@/context/ChatProvider';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import ShareChat from './ShareChat';
import { FiShare2, FiSend, FiUser, FiUsers, FiInfo, FiRefreshCw, FiAlertTriangle, FiSmile } from 'react-icons/fi'; // Added FiSmile
import { useAuth } from '@/context/AuthProvider';
import Logo from '@/components/ui/Logo';
import Picker, { EmojiClickData } from 'emoji-picker-react'; // Added emoji-picker-react

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
    typingUsers, // Added
    sendTypingEvent, // Added
  } = useChat();
  const [newMessage, setNewMessage] = useState('');
  const [showShareOptions, setShowShareOptions] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false); // Added for emoji picker
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null); // Added for emoji picker click outside
  const isCurrentlyTypingRef = useRef(false); 
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null); 

  useEffect(() => {
    // Cleanup timeout on unmount
    const cleanupTimeout = () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };

    // Click outside handler for emoji picker
    const handleClickOutside = (event: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false);
      }
    };

    if (showEmojiPicker) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }

    return () => {
      cleanupTimeout();
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showEmojiPicker]); // Added showEmojiPicker dependency

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
  
  const isInputDisabled = isLoadingMessages || !!chatError || !activeChatSessionId || isSessionEnded || !isChatActive;
  const isSendButtonDisabled = isInputDisabled || !newMessage.trim() || !currentUserName;

  const onEmojiClick = (emojiObject: EmojiClickData) => {
    setNewMessage(prevInput => prevInput + emojiObject.emoji);
    // setShowEmojiPicker(false); // Optional: close picker after selection
  };

  const handleNewMessageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const currentMessage = e.target.value;
    setNewMessage(currentMessage);

    if (!sendTypingEvent || !currentUserName) return;

    if (currentMessage && !isCurrentlyTypingRef.current) {
      sendTypingEvent(currentUserName, true);
      isCurrentlyTypingRef.current = true;
    } else if (!currentMessage && isCurrentlyTypingRef.current) {
      sendTypingEvent(currentUserName, false);
      isCurrentlyTypingRef.current = false;
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      return; // Avoid setting timeout if message is empty
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    if (currentMessage) { // Only set timeout if there's text
        typingTimeoutRef.current = setTimeout(() => {
        sendTypingEvent(currentUserName, false);
        isCurrentlyTypingRef.current = false;
      }, 1500);
    }
  };
  
  // When message is sent, also send a "stopped typing" event
  useEffect(() => {
    if (!newMessage && isCurrentlyTypingRef.current && sendTypingEvent && currentUserName) {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      sendTypingEvent(currentUserName, false);
      isCurrentlyTypingRef.current = false;
    }
  }, [newMessage, sendTypingEvent, currentUserName]);


  const handleForceRefresh = () => {
    console.log('[ChatInterface] Manual refresh requested for chatId:', chatId);
    clearChatError();
    joinChatSession(chatId); // Re-join and re-fetch
  };

  const handleEndChat = async () => {
    if (isHost && chatId) {
      await endChatSession(chatId, authenticatedUser?.id || null);
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
        {chatId && isHost && isChatActive && ( // Only show buttons if user isHost and chat is active
          <div className="flex gap-2">
            <Button 
              onClick={toggleShareOptions}
              variant="outline"
              size="sm"
              className="text-gray-700 border-gray-200 hover:bg-gray-50 hover:text-indigo-600 hover:border-indigo-200 transition-colors flex items-center gap-1.5"
            >
              <FiShare2 className="w-3.5 h-3.5" />
              <span>{showShareOptions ? 'Hide Options' : 'Share / Info'}</span>
            </Button>
            <Button 
              onClick={handleEndChat}
              variant="outline"
              size="sm"
              className="text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300 transition-colors flex items-center gap-1.5"
            >
              <FiAlertTriangle className="w-3.5 h-3.5" />
              <span>End Chat</span>
            </Button>
          </div>
        )}
      </div>

      {isHost && showShareOptions && chatId && isChatActive && ( // Only show Share options panel if user isHost and chat is active
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
            <div className="text-center py-10">
              <p><FiRefreshCw className="animate-spin mr-2 h-5 w-5 inline" />Loading messages...</p>
            </div>
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
                <>
                  <p className="text-sm text-red-600 mt-2">
                    Please check your internet connection or try again. If the problem persists, the chat session may have issues.
                  </p>
                  <Button onClick={handleDismissError} variant="outline" size="sm" className="mt-3">
                    Dismiss
                  </Button>
                </>
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
                className={`max-w-[80%] p-3.5 rounded-xl shadow-sm ${ message.sender_name === currentUserName ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-sky-100 text-gray-800 rounded-bl-none border border-gray-200'}
                }`}
              >
                <div className={`text-xs mb-1 font-medium ${message.sender_name === currentUserName ? 'text-indigo-200' : 'text-gray-500'}`}>
                  {message.sender_name} {message.user_id === authenticatedUser?.id && isHost ? '(You - Host)' : message.sender_name === currentUserName ? '(You)' : ''}
                </div>
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.message_text}</p>
                <div className={`text-xs mt-1.5 ${message.sender_name === currentUserName ? 'text-indigo-100' : 'text-gray-500'}`}>
                  {new Date(message.created_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })}
                </div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="border-t border-gray-200 p-4 bg-white relative"> {/* Added relative positioning for emoji picker */}
        <div className="max-w-3xl mx-auto">
          {showEmojiPicker && (
            <div className="absolute bottom-full right-0 mb-2 z-10" ref={emojiPickerRef}> {/* Adjusted position */}
              <Picker 
                onEmojiClick={onEmojiClick}
                autoFocusSearch={false}
                height={350}
                width="100%" // Make it responsive or fixed width
                // theme={Theme.DARK} // Example theme
              />
            </div>
          )}
          {(() => {
            const otherTypingUsers = typingUsers.filter(name => name !== currentUserName && name); // Ensure name is not empty
            if (otherTypingUsers.length > 0) {
              const names = otherTypingUsers.join(', ');
              return (
                <p className="text-xs italic text-gray-500 h-4 mb-1 ml-2">
                  {names} {otherTypingUsers.length === 1 ? 'is' : 'are'} typing...
                </p>
              );
            }
            return <div className="h-4 mb-1"></div>; // Placeholder to prevent layout shift
          })()}
          <form onSubmit={handleSendMessage} className="flex items-center space-x-2"> {/* Added items-center */}
            <Input
              type="text"
              placeholder={
                isSessionEnded ? "Chat session has ended" :
                isInputDisabled ? (chatError ? "Error occurred" : "Connecting...") : 
                "Type a message..."
              }
              value={newMessage}
              onChange={handleNewMessageChange} // Changed
              className="flex-1 focus:ring-indigo-500 focus:border-indigo-500 rounded-full"
              disabled={isInputDisabled}
              onFocus={handleDismissError} // Clear error on focus to allow typing if it was an error
            />
            <Button
              type="button"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              variant="outline" // Use an existing variant or style directly
              className="p-2 rounded-full hover:bg-gray-100" // Example styling
              aria-label="Toggle emoji picker"
              disabled={isInputDisabled}
            >
              <FiSmile className="w-5 h-5 text-gray-500" />
            </Button>
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
    </div>
  );
} 