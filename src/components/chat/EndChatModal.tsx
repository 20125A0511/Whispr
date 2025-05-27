import React from 'react';
import { cn } from '@/utils/cn';

interface EndChatModalProps {
  isOpen: boolean;
  actor: 'host' | 'guest' | null;
  countdown: number;
  onClose: () => void; // Included as per spec, even if not directly used by user action on this modal
}

const EndChatModal: React.FC<EndChatModalProps> = ({
  isOpen,
  actor,
  countdown,
  onClose,
}) => {
  if (!isOpen) {
    return null;
  }

  let headline = '';
  if (actor === 'host') {
    headline = 'This chat has been ended by the host.';
  } else if (actor === 'guest') {
    headline = 'This chat has been ended by the guest.';
  } else {
    headline = 'This chat has ended.'; // Generic fallback
  }

  return (
    <div
      // Overlay: fixed, full screen, semi-transparent background
      className={cn(
        'fixed inset-0 z-50 flex items-center justify-center bg-black/50 transition-opacity duration-300',
        isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
      )}
      // onClick={onClose} // Deliberately not adding onClose to overlay for "no backdrop click-through"
    >
      <div
        // Modal content: styled similarly to CueCard, but explicitly not allowing click propagation to overlay
        onClick={(e) => e.stopPropagation()}
        className={cn(
          'bg-neutral-50/90 dark:bg-neutral-900/90 backdrop-blur-lg p-6 sm:p-8 rounded-3xl shadow-xl dark:shadow-neutral-800/50',
          'transform transition-all duration-300 ease-out',
          'w-full max-w-md mx-4', // Responsive width
          isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
        )}
      >
        <h3 className="text-xl sm:text-2xl font-semibold text-neutral-900 dark:text-neutral-50 mb-4 text-center">
          {headline}
        </h3>
        <div className="text-center mb-6">
          <p className="text-7xl font-bold text-neutral-900 dark:text-neutral-50">
            {countdown}
          </p>
        </div>
        <p className="text-neutral-600 dark:text-neutral-400 text-sm sm:text-base leading-relaxed text-center">
          Chat history will be permanently deleted in {countdown} second{countdown === 1 ? '' : 's'}.
        </p>
        {/* No close button as per current requirements. 
            If a close button were needed, it would call onClose.
            e.g., <button onClick={onClose}>Close</button> 
        */}
      </div>
    </div>
  );
};

export default EndChatModal;
