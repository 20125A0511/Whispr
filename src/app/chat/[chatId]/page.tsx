'use client';

import { useEffect, Suspense } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { useChat } from '@/context/ChatProvider';
import ChatInterfaceComponent from '@/components/chat/ChatInterface'; // Renamed to avoid conflict
import { useAuth } from '@/context/AuthProvider';
import OtpAuthFlow from '@/components/auth/OtpAuthFlow';
import useEndChat from '@/hooks/useEndChat';
import EndChatModal from '@/components/chat/EndChatModal';

// A small loader component for Suspense fallback
function ChatPageLoader() {
  return (
    <div className="fixed inset-0 bg-white flex items-center justify-center z-[200]">
      <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600"></div>
      <p className="ml-4 text-lg font-medium text-gray-700">Loading Chat...</p>
    </div>
  );
}

function ChatPageContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const chatId = params.chatId as string;
  const { joinChatSession, activeChatSessionId } = useChat();
  const { user, isLoading: isAuthLoading } = useAuth();

  const guestNameFromQuery = searchParams.get('guest');
  const hostNameFromQuery = searchParams.get('host');

  // Determine the current user's display name for this chat
  // If the authenticated user is the host (their name matches hostNameFromQuery or if user.email is present and guestName is not, assume host)
  // Otherwise, it's the guestNameFromQuery.
  // This logic might need refinement based on how host identity is firmly established.
  // For now, if `user` is available and `guestNameFromQuery` is also present, we determine based on user data.
  // If only `guestNameFromQuery` is present, this user is the guest.
  // If `user` is available and no `guestNameFromQuery`, this user is likely the host starting their own session view.

  let currentUserName: string | null = null;
  let isHost = false; // This will be used for useEndChat

  if (user && hostNameFromQuery && (user.user_metadata?.name === hostNameFromQuery || user.email === hostNameFromQuery /* fallback if name not set */ )) {
    currentUserName = user.user_metadata?.name || user.email || 'Host';
    isHost = true;
  } else if (guestNameFromQuery) {
    currentUserName = guestNameFromQuery;
    isHost = false;
  } else if (user) {
    currentUserName = user.user_metadata?.name || user.email || 'Host';
    isHost = true;
  }

  const {
    showEndChatModal,
    countdown,
    endedByHost,
    endChat,
    closeModalAndReset,
  } = useEndChat({ chatId, isHost });
  
  useEffect(() => {
    if (chatId) {
      console.log('[ChatPage] Joining chat session immediately:', chatId);
      joinChatSession(chatId);
    }
  }, [chatId, joinChatSession]);

  if (isAuthLoading) {
    return <ChatPageLoader />;
  }

  // If it's a guest link (guestNameFromQuery is present) but currentUserName couldn't be set (e.g. bad link data),
  // or if it's not a guest link and the user isn't authenticated, show OTP/login.
  // This allows guests to join without prior authentication, relying on the join link validation.
  if (!currentUserName && guestNameFromQuery) { // Guest scenario, but name extraction failed (shouldn't happen with valid join link)
     return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <p>Error: Could not determine participant name from the link. Please try the invite link again.</p>
      </div>
    );
  }

  // If not a guest (no guestNameFromQuery) AND no authenticated user, then prompt for login.
  if (!guestNameFromQuery && !user) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-6 sm:p-8 max-w-md w-full border border-gray-200">
          <p className="text-center text-gray-700 mb-4">Please sign in to access this chat.</p>
          <OtpAuthFlow 
            onSuccess={() => { /* Reload or redirect might be needed */ router.refresh(); }} 
            signInMode="emailOnly" // Host would typically sign in with email only
          />
        </div>
      </div>
    );
  }

  // If currentUserName is still null at this point, something is wrong (e.g. host viewing with no user session after loading)
  if (!currentUserName) {
     return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <p>Error: Could not identify the current user for the chat. Please try logging in or use a valid invite link.</p>
      </div>
    );
  }

  return (
    <>
      <EndChatModal
        isOpen={showEndChatModal}
        onClose={closeModalAndReset}
        countdown={countdown}
        endedByHost={endedByHost}
      />
      <div className="flex h-screen bg-gray-100">
        <main className="flex-1 flex flex-col bg-white shadow-md max-w-4xl mx-auto h-full">
          {/* Consider where to best place this button - this is a simple placement */}
          <div className="p-2 text-right border-b border-gray-200">
            <button
              onClick={() => endChat(isHost ? 'host' : 'guest')}
              className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors text-sm font-medium"
            >
              End Chat
            </button>
          </div>
          <ChatInterfaceComponent 
            chatId={chatId} 
            currentUserName={currentUserName} 
            isHost={isHost}
            initialHostName={hostNameFromQuery || (isHost ? currentUserName : undefined)}
            initialGuestName={guestNameFromQuery || (!isHost && currentUserName ? currentUserName : undefined)}
          />
        </main>
      </div>
    </>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={<ChatPageLoader />}>
      <ChatPageContent />
    </Suspense>
  );
} 