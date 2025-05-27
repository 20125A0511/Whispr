'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useChat } from '@/context/ChatProvider';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import ShareChat from './ShareChat';
import { FiShare2, FiSend, FiUser, FiUsers, FiInfo, FiRefreshCw, FiAlertTriangle, FiSmile, FiSlash, FiLoader, FiMessageSquare } from 'react-icons/fi'; // Added FiSlash, FiLoader, FiMessageSquare
import { useAuth } from '@/context/AuthProvider';
import Logo from '@/components/ui/Logo';
import EmojiPicker, { EmojiClickData } from 'emoji-picker-react'; // Added EmojiPicker imports
import useEndChat from '@/hooks/useEndChat';
import EndChatModal from '@/components/chat/EndChatModal';

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
  const [showEmojiPicker, setShowEmojiPicker] = useState(false); // Added emoji picker state
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null); // Ref for the emoji picker

  const {
    showEndChatModal,
    countdown,
    endedByHost,
    isEndingChat,
    endChat,
    closeModalAndReset,
  } = useEndChat({ chatId, isHost });

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

  // Close emoji picker on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [emojiPickerRef]);

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    setNewMessage((prevMessage) => prevMessage + emojiData.emoji);
    // setShowEmojiPicker(false); // Keep picker open for multiple emojis
  };

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

  const handleForceRefresh = () => {
    console.log('[ChatInterface] Manual refresh requested for chatId:', chatId);
    clearChatError();
    joinChatSession(chatId); // Re-join and re-fetch
  };

  const handleEndChat = async () => {
    // Now calls the hook's endChat function
    if (isHost && chatId) {
      endChat('host'); 
    }
    // For guest, a new button will call endChat('guest')
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
        isOpen={showEndChatModal}
        onClose={closeModalAndReset}
        countdown={countdown}
        endedByHost={endedByHost}
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
        <div className="flex gap-2">
          {chatId && isHost && isChatActive && !isSessionEnded && (
            <>
              <Button 
                onClick={toggleShareOptions}
                variant="outline"
                size="sm"
                className="text-gray-700 border-gray-200 hover:bg-gray-50 hover:text-indigo-600 hover:border-indigo-200 transition-colors flex items-center gap-1.5"
                disabled={isEndingChat} // Disable during end chat flow
              >
                <FiShare2 className="w-3.5 h-3.5" />
                <span>{showShareOptions ? 'Hide Options' : 'Share / Info'}</span>
              </Button>
              <Button 
                onClick={() => endChat('host')} // Updated to use hook's endChat
                variant="outline"
                size="sm"
                className="text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300 transition-colors flex items-center gap-1.5"
                disabled={isEndingChat} // Disable during end chat flow
              >
                <FiAlertTriangle className="w-3.5 h-3.5" />
                <span>End Chat</span>
              </Button>
            </>
          )}
          {chatId && !isHost && isChatActive && !isSessionEnded && (
            <Button 
              onClick={() => endChat('guest')} // Guest's end chat button
              variant="outline"
              size="sm"
              className="text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300 transition-colors flex items-center gap-1.5"
              disabled={isEndingChat} // Disable during end chat flow
            >
              <FiAlertTriangle className="w-3.5 h-3.5" />
              <span>End Chat</span>
            </Button>
          )}
        </div>
      </div>

      {isHost && showShareOptions && chatId && isChatActive && !isSessionEnded && ( // Only show Share options panel if user isHost and chat is active
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
        <div className="p-6 border-b border-red-300 bg-red-100 text-center shadow-inner">
          <div className="flex flex-col items-center justify-center gap-2 text-red-700">
            <FiSlash className="w-10 h-10 mb-2" />
            <span className="font-semibold text-lg">This chat session has ended</span>
          </div>
          {!isHost && (
            <p className="text-sm text-red-800 mt-2">
              The host has ended this chat session. You can no longer send messages.
            </p>
          )}
          {isHost && (
            <p className="text-sm text-red-800 mt-2">
              You have ended this chat session. The guest can no longer send messages.
            </p>
          )}
        </div>
      )}

      <div className="flex-1 p-5 overflow-y-auto bg-white">
        <div className="space-y-5 max-w-3xl mx-auto">
          {isLoadingMessages && messages.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <FiLoader className="animate-spin h-8 w-8 mx-auto mb-3 text-indigo-600" />
              <p className="text-lg font-medium">Loading messages...</p>
              <p className="text-sm">Please wait a moment.</p>
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
                <Button onClick={handleDismissError} variant="outline" size="sm" className="mt-2">
                  Dismiss
                </Button>
              )}
            </div>
          )}
          {!isLoadingMessages && !chatError && messages.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <FiMessageSquare className="h-12 w-12 mx-auto mb-3 text-indigo-600 opacity-75" />
              <p className="text-xl font-medium mb-1">No messages yet</p>
              <p className="text-sm">Be the first to send a message to start the conversation!</p>
            </div>
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

      <div className="border-t border-gray-200 p-4 bg-white relative"> {/* Added relative positioning for emoji picker */}
        {showEmojiPicker && (
          <div ref={emojiPickerRef} className="absolute bottom-full mb-2 right-0 sm:right-auto sm:left-0 z-10"> {/* Positioned emoji picker */}
            <EmojiPicker
              onEmojiClick={handleEmojiClick}
              autoFocusSearch={false}
              // width={350} // You can adjust width and height
              // height={450}
              // theme={Theme.AUTO} // Or Theme.DARK / Theme.LIGHT
            />
          </div>
        )}
        <form onSubmit={handleSendMessage} className="flex space-x-2 max-w-3xl mx-auto items-center"> {/* Added items-center */}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="p-2 text-gray-500 hover:text-indigo-600"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            disabled={isInputDisabled || isEndingChat}
          >
            <FiSmile className="w-5 h-5" />
          </Button>
          <Input
            type="text"
            placeholder={
              isEndingChat ? "Ending chat..." :
              isSessionEnded ? "Chat session has ended" :
              isInputDisabled ? (chatError ? "Error occurred" : "Connecting...") : 
              "Type a message..."
            }
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            className="flex-1 focus:ring-indigo-500 focus:border-indigo-500 rounded-full"
            disabled={isInputDisabled || isEndingChat} // Updated disabled state
            onFocus={handleDismissError} // Clear error on focus to allow typing if it was an error
          />
          <Button 
            type="submit" 
            className="rounded-full bg-indigo-600 hover:bg-indigo-700 flex items-center gap-1.5 px-4"
            disabled={isSendButtonDisabled || isEndingChat} // Updated disabled state
          >
            <span>Send</span>
            <FiSend className="w-3.5 h-3.5" />
          </Button>
        </form>
      </div>
    </div>
  );
} 