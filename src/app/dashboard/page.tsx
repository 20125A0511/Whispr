'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthProvider';
import { Button } from '@/components/ui/Button';
import ChatInterface from '@/components/chat/ChatInterface';
import { FiLogOut, FiMessageSquare, FiPlus, FiUsers, FiMail, FiUser } from 'react-icons/fi';
import { Input } from '@/components/ui/Input';
import { FaCheckCircle } from 'react-icons/fa';
import Logo from '@/components/ui/Logo';

// Define the steps in our chat creation flow
type ChatCreationStep = 'initial' | 'hostName' | 'inviteGuest' | 'chatActive';

export default function Dashboard() {
  const { user, signOut, isLoading } = useAuth();
  const router = useRouter();
  
  // States for managing chat creation flow
  const [chatStep, setChatStep] = useState<ChatCreationStep>('initial');
  const [hostName, setHostName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [chatId, setChatId] = useState<string | null>(null);
  const [chatInvitesSent, setChatInvitesSent] = useState<string[]>([]);
  const [isEmailButtonAnimating, setIsEmailButtonAnimating] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Only redirect if we're certain the user isn't authenticated
    if (!isLoading && !user) {
      router.push('/');
    }
  }, [user, router, isLoading]);

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  // Function to start the chat creation process
  const handleCreateNewChat = () => {
    setChatStep('hostName');
  };

  // Function to handle host name submission
  const handleHostNameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (hostName.trim()) {
      setChatStep('inviteGuest');
    }
  };

  // Function to handle guest invitation
  const handleInviteGuest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading || isEmailButtonAnimating) return;
    
    if (guestEmail.trim() && !chatInvitesSent.includes(guestEmail.trim())) {
      setIsEmailButtonAnimating(true);
      setLoading(true);
      setError(null);
      
      // If this is the first guest, generate a chat ID
      const currentChatId = chatId || `chat_${Math.random().toString(36).substr(2, 9)}`;
      if (!chatId) {
        setChatId(currentChatId);
      }
      
      try {
        // Call our API endpoint to send the email invite
        const response = await fetch('/api/send-invite-email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            guestEmail: guestEmail.trim(),
            chatId: currentChatId,
            hostName: hostName,
          }),
        });
        
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || 'Failed to send invitation');
        }
        
        // On success, update the local state
        setTimeout(() => {
          setChatInvitesSent([...chatInvitesSent, guestEmail.trim()]);
          setGuestEmail('');
          setLoading(false);
          setIsEmailButtonAnimating(false);
        }, 1000); // Delay for animation
        
      } catch (err) {
        console.error('Error sending invitation:', err);
        setError(err instanceof Error ? err.message : 'Failed to send invitation');
        setLoading(false);
        setIsEmailButtonAnimating(false);
      }
    }
  };

  // Function to start the chat after inviting guests
  const handleStartChat = () => {
    if (chatId) {
      setChatStep('chatActive');
    }
  };

  // Function to reset the chat creation flow
  const handleCancelChatCreation = () => {
    setChatStep('initial');
    setHostName('');
    setGuestEmail('');
    setChatId(null);
    setChatInvitesSent([]);
    setError(null);
  };

  // Render appropriate content based on current step
  const renderStepContent = () => {
    // Step indicator component for the multistep flow
    const StepIndicator = () => {
      return (
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div className="w-full flex items-center">
              {/* Step 1 */}
              <div className="relative flex flex-col items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  chatStep === 'hostName' || chatStep === 'inviteGuest' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-600'
                }`}>
                  <FiUser className="w-5 h-5" />
                </div>
                <div className="text-xs font-medium mt-1">Your Name</div>
              </div>
              
              {/* Connector */}
              <div className={`flex-1 h-1 mx-2 ${
                chatStep === 'inviteGuest' ? 'bg-indigo-600' : 'bg-gray-200'
              }`} />
              
              {/* Step 2 */}
              <div className="relative flex flex-col items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  chatStep === 'inviteGuest' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-600'
                }`}>
                  <FiMail className="w-5 h-5" />
                </div>
                <div className="text-xs font-medium mt-1">Invite Guests</div>
              </div>
            </div>
          </div>
        </div>
      );
    };

    switch (chatStep) {
      case 'hostName':
        return (
          <div className="max-w-md mx-auto">
            <StepIndicator />
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 animate-fadeIn">
              <h2 className="text-xl font-medium text-gray-800 mb-4">Create New Chat</h2>
              <p className="text-sm text-gray-600 mb-5">Please enter your name as it will appear to other participants.</p>
              
              <form onSubmit={handleHostNameSubmit} className="space-y-4">
                <div>
                  <label htmlFor="hostName" className="block text-sm font-medium text-gray-700 mb-1">Your Name</label>
                  <Input
                    id="hostName"
                    type="text"
                    value={hostName}
                    onChange={(e) => setHostName(e.target.value)}
                    placeholder="Enter your name"
                    className="w-full"
                  />
                </div>
                <div className="flex justify-between">
                  <Button 
                    type="button" 
                    variant="ghost" 
                    onClick={handleCancelChatCreation}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={!hostName.trim()}>
                    Continue
                  </Button>
                </div>
              </form>
            </div>
          </div>
        );

      case 'inviteGuest':
        return (
          <div className="max-w-md mx-auto">
            <StepIndicator />
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 animate-fadeIn">
              <h2 className="text-xl font-medium text-gray-800 mb-4">Invite Participants</h2>
              <p className="text-sm text-gray-600 mb-5">
                Invite guests to join your chat. You'll be able to start chatting after inviting at least one person.
              </p>
              
              <form onSubmit={handleInviteGuest} className="space-y-4 mb-6">
                <div>
                  <label htmlFor="guestEmail" className="block text-sm font-medium text-gray-700 mb-1">Guest Email</label>
                  <div className="flex">
                    <Input
                      id="guestEmail"
                      type="email"
                      value={guestEmail}
                      onChange={(e) => setGuestEmail(e.target.value)}
                      placeholder="Enter email address"
                      className="flex-1 rounded-r-none"
                      disabled={loading}
                    />
                    <div className="relative">
                      <Button 
                        type="submit" 
                        className="rounded-l-none"
                        disabled={!guestEmail.trim() || chatInvitesSent.includes(guestEmail.trim()) || loading || isEmailButtonAnimating}
                      >
                        Invite
                      </Button>
                      
                      {/* Overlay animation similar to the OTP one */}
                      {(guestEmail.trim() && !chatInvitesSent.includes(guestEmail.trim())) && (
                        <div 
                          className={`absolute inset-0 rounded-r-lg bg-gray-100 transition-shadow duration-300 overflow-hidden border border-gray-300 ${
                            !isEmailButtonAnimating && !loading ? 'hidden' : 'block'
                          }`}
                        >
                          <div 
                            className={`absolute top-0 left-0 h-full bg-green-500 transition-all duration-1000 ease-in-out ${
                              isEmailButtonAnimating ? 'w-full' : 'w-0'
                            }`}
                          />
                          <div className="w-full h-full flex items-center justify-center relative z-10">
                            <span 
                              className={`text-sm font-medium transition-colors duration-200 ${
                                isEmailButtonAnimating ? 'text-white delay-300' : 'text-blue-600'
                              }`}
                            >
                              Sending...
                            </span>
                          </div>
                          <div 
                            className={`absolute right-3 top-1/2 -translate-y-1/2 transform transition-opacity duration-300 ease-in-out ${
                              isEmailButtonAnimating ? 'opacity-100 delay-[900ms]' : 'opacity-0'
                            }`}
                          >
                            <FaCheckCircle size={22} className="text-white" />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </form>
              
              {error && (
                <div className="mb-4 bg-red-50 text-red-700 p-3 rounded-md text-sm font-medium border border-red-200">
                  {error}
                </div>
              )}
              
              {chatInvitesSent.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Invited Participants</h3>
                  <div className="space-y-2">
                    {chatInvitesSent.map((email, index) => (
                      <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded-md">
                        <span className="text-sm text-gray-600">{email}</span>
                        <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full">Invited</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="flex justify-between">
                <Button 
                  type="button" 
                  variant="ghost"
                  onClick={() => setChatStep('hostName')}
                  disabled={loading}
                >
                  Back
                </Button>
                <Button 
                  type="button"
                  onClick={handleStartChat}
                  disabled={chatInvitesSent.length === 0 || loading}
                >
                  Start Chat
                </Button>
              </div>
            </div>
          </div>
        );

      case 'chatActive':
        if (!chatId || !hostName) {
          // Fallback or error for missing critical info for host
          console.error('[Dashboard] Missing chatId or hostName for chatActive step. Returning to initial.');
          handleCancelChatCreation(); // Or some other error display
          return <p>Error: Chat information is missing. Please try again.</p>;
        }
        return <ChatInterface 
                  chatId={chatId} 
                  currentUserName={hostName} // Pass hostName as currentUserName
                  isHost={true}             // Explicitly set isHost to true
                  initialHostName={hostName}  // Can also pass as initialHostName
                  // initialGuestName can be omitted or fetched if available
                />;

      default: // 'initial'
        return (
          <div className="max-w-xl mx-auto bg-white p-6 rounded-lg shadow-sm border border-gray-200 animate-fadeIn text-center">
            <div className="bg-indigo-50 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6">
              <FiMessageSquare className="w-8 h-8 text-indigo-600" />
            </div>
            <h2 className="text-2xl font-medium text-gray-800 mb-2">Welcome to Whispr</h2>
            <p className="text-gray-600 mb-8">
              Create a new chat session to start a temporary conversation with others. Your conversations will be deleted when the session ends.
            </p>
            <Button 
              onClick={handleCreateNewChat} 
              className="flex items-center mx-auto gap-2"
            >
              <FiPlus className="w-4 h-4" />
              <span>Create New Chat</span>
            </Button>
          </div>
        );
    }
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-white flex items-center justify-center z-[200]">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center shadow-sm">
        <Logo width={120} height={40} />
        <div className="flex items-center gap-5">
          <span className="text-sm font-medium text-gray-600">{user.email}</span>
          <Button 
            onClick={handleSignOut}
            variant="ghost"
            size="sm"
            className="text-gray-700 hover:text-indigo-600 hover:bg-gray-100 transition-all flex items-center gap-1.5"
          >
            <FiLogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </Button>
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <div className="w-72 bg-white border-r border-gray-100 hidden md:block p-5 shadow-sm">
          <h2 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
            <FiMessageSquare className="text-indigo-500" />
            <span>Chat Sessions</span>
          </h2>
          <p className="text-sm text-gray-500 mb-5 leading-relaxed">
            Your conversations are not stored and will be deleted when the session ends.
          </p>
          
          {chatId && chatStep === 'chatActive' && (
            <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-100 cursor-pointer transition-all hover:bg-indigo-100">
              <div className="font-medium text-indigo-700">Current Session</div>
              <div className="flex items-center gap-1 mt-1">
                <FiUsers className="text-indigo-400 w-3 h-3" />
                <span className="text-xs text-indigo-500">{chatInvitesSent.length + 1} participants</span>
              </div>
            </div>
          )}
          
          {chatStep !== 'chatActive' && (
            <Button 
              onClick={handleCreateNewChat} 
              variant="outline" 
              className="w-full mt-2 flex items-center justify-center gap-2"
            >
              <FiPlus className="w-4 h-4" />
              <span>New Chat</span>
            </Button>
          )}
        </div>

        {/* Main area */}
        <div className="flex-1 flex flex-col p-6">
          {renderStepContent()}
        </div>
      </div>
    </div>
  );
} 