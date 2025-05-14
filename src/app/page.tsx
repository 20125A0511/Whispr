'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthProvider';
import { Button } from '@/components/ui/Button';
import OtpAuthFlow from '@/components/auth/OtpAuthFlow';
import CueCard from '@/components/ui/CueCard';

// Import icons from react-icons
import { FaLock, FaRocketchat } from 'react-icons/fa';
import { FiSmartphone } from 'react-icons/fi';

export default function Home() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false); // For managing modal animation states

  useEffect(() => {
    if (user && !isLoading) {
      router.push('/dashboard');
    }
  }, [user, isLoading, router]);

  const handleOpenOtpModal = () => {
    setShowOtpModal(true);
    setTimeout(() => setIsModalVisible(true), 10); // Allow display block before starting transition
  };

  const handleCloseOtpModal = () => {
    setIsModalVisible(false);
    setTimeout(() => setShowOtpModal(false), 300); // Wait for transition to finish before hiding
  };

  const handleOtpSuccess = () => {
    handleCloseOtpModal(); 
  };

  if (isLoading && !user) { // Show full page loader only if not logged in and loading
    return (
      <div className="fixed inset-0 bg-white flex items-center justify-center z-[200]">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600"></div>
      </div>
    );
  }

  if (user) { // If user is loaded and exists, null will be returned and useEffect will redirect
    return null;
  }

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center overflow-x-hidden">
      {/* Video Background Section */}
      <section className="relative h-screen w-full flex flex-col items-center justify-center">
        <video
          autoPlay
          loop
          muted
          playsInline // Important for iOS Safari
          className="absolute top-0 left-0 z-0 w-full h-full object-cover"
        >
          <source src="/background.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>
        <div className="absolute inset-0 z-10 bg-black opacity-60"></div>
        <main className="relative z-20 flex flex-col items-center justify-center text-center p-4">
          <div className="bg-white/10 backdrop-blur-lg p-8 sm:p-12 rounded-2xl shadow-xl max-w-2xl">
            <h1 className="text-5xl sm:text-6xl font-bold text-white mb-6">
              Welcome to texttemp
            </h1>
            <p className="text-xl sm:text-2xl text-gray-200 mb-10">
              A new way to connect and chat, seamlessly and securely.
            </p>
            <Button 
              size="lg"
              onClick={handleOpenOtpModal}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg text-lg shadow-lg transition duration-300 ease-in-out transform hover:scale-105"
            >
              Try Now
            </Button>
          </div>
        </main>
      </section>
      
      {/* Cue Cards Section */}
      <section className="relative z-20 w-full py-16 sm:py-24 bg-amber-100/[0.80] backdrop-blur-md">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-amber-900 text-center mb-12 sm:mb-16">
            Why texttemp?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
            <CueCard 
              icon={<FaLock className="inline-block text-sky-500 dark:text-sky-400" />}
              title="Passwordless Security"
              description="Enjoy robust security with our simple and secure OTP (One-Time Password) login system. No passwords to forget or compromise!"
              animationDelay="delay-0ms"
            />
            <CueCard 
              icon={<FaRocketchat className="inline-block text-violet-500 dark:text-violet-400" />}
              title="Seamless Chat"
              description="Experience a clean, modern interface designed for intuitive and enjoyable conversations. Focus on what matters: the chat."
              animationDelay="delay-200ms"
            />
            <CueCard 
              icon={<FiSmartphone className="inline-block text-emerald-500 dark:text-emerald-400" />}
              title="Modern & Fast"
              description="Built with the latest web technologies for a responsive and snappy user experience across all your devices. Get started in seconds."
              animationDelay="delay-400ms"
            />
          </div>
        </div>
      </section>

      {/* OTP Modal */}
      {showOtpModal && (
        <div 
          className={`fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 transition-opacity duration-300 ease-out ${isModalVisible ? 'opacity-100' : 'opacity-0'}`}
        >
          <div 
            className={`bg-white p-6 sm:p-8 rounded-xl shadow-2xl w-full max-w-md relative transition-all duration-300 ease-out ${isModalVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
          >
            <div className="bg-white rounded-lg">
              <OtpAuthFlow 
                onSuccess={handleOtpSuccess} 
                onClose={handleCloseOtpModal}
                signInMode="emailOnly"
              />
            </div>
          </div>
        </div>
      )}

      <footer className="relative z-20 py-8 bg-amber-100/[0.80] text-center text-amber-700 text-sm w-full">
        © {new Date().getFullYear()} texttemp. All rights reserved.
      </footer>
    </div>
  );
}
