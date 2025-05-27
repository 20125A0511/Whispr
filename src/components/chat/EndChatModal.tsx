import React from 'react';
import { FiClock } from 'react-icons/fi'; // Import an icon

interface EndChatModalProps {
  isOpen: boolean;
  onClose: () => void; // Retained for potential future use or hook integration
  countdown: number;
  endedByHost: boolean | null;
}

const EndChatModal: React.FC<EndChatModalProps> = ({
  isOpen,
  onClose,
  countdown,
  endedByHost,
}) => {
  if (!isOpen || endedByHost === null) {
    return null;
  }

  const headline = endedByHost
    ? "This chat has been ended by the host."
    : "This chat has been ended by the guest.";

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[100] p-4"> {/* Increased z-index slightly */}
      <div className="bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-xl shadow-2xl w-full max-w-md text-center">
        <FiClock className="w-12 h-12 mx-auto mb-4 text-indigo-600 dark:text-indigo-400" />
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-50 mb-3">
          {headline}
        </h2>
        <p className="text-gray-700 dark:text-gray-300 text-sm sm:text-base mb-5">
          You will be redirected shortly. Chat history will be permanently deleted.
        </p>
        <div className="text-6xl sm:text-7xl font-bold text-indigo-600 dark:text-indigo-400">
          {countdown}
        </div>
      </div>
    </div>
  );
};

export default EndChatModal;
