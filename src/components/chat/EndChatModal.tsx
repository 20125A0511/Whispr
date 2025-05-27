import React from 'react';

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
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-neutral-50 dark:bg-neutral-900 p-6 sm:p-8 rounded-xl shadow-2xl w-full max-w-md text-center">
        <h2 className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-neutral-50 mb-4">
          {headline}
        </h2>
        <p className="text-neutral-700 dark:text-neutral-300 text-sm sm:text-base mb-6">
          Chat history will be permanently deleted in {countdown} seconds.
        </p>
        <div className="text-6xl sm:text-7xl font-bold text-neutral-900 dark:text-neutral-50">
          {countdown}
        </div>
      </div>
    </div>
  );
};

export default EndChatModal;
