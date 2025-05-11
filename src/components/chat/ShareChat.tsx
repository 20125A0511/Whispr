'use client';

import { useState, useRef } from 'react';
import QRCode from 'react-qr-code';
import { Button } from '@/components/ui/Button';
import { generateShareableLink } from '@/utils/chatUtils';

interface ShareChatProps {
  chatId: string;
}

export default function ShareChat({ chatId }: ShareChatProps) {
  const [showQR, setShowQR] = useState(false);
  const [copied, setCopied] = useState(false);
  const linkRef = useRef<HTMLInputElement>(null);
  const shareableLink = generateShareableLink(chatId);

  const handleCopyLink = () => {
    if (linkRef.current) {
      linkRef.current.select();
      navigator.clipboard.writeText(linkRef.current.value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const toggleQRCode = () => {
    setShowQR(!showQR);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <h3 className="text-lg font-semibold mb-4">Share This Temporary Chat</h3>
      
      <div className="mb-4">
        <p className="text-sm text-gray-600 mb-2">
          This is a temporary chat. The conversation will be deleted once the session ends.
        </p>
        
        <div className="flex">
          <input
            ref={linkRef}
            type="text"
            value={shareableLink}
            readOnly
            className="flex-1 border border-gray-300 rounded-l-md px-3 py-2 text-sm"
          />
          <Button 
            onClick={handleCopyLink}
            className="rounded-l-none"
          >
            {copied ? 'Copied!' : 'Copy'}
          </Button>
        </div>
      </div>
      
      <div className="flex flex-col items-center">
        <Button 
          onClick={toggleQRCode}
          variant="outline"
          className="mb-4 w-full"
        >
          {showQR ? 'Hide QR Code' : 'Show QR Code'}
        </Button>
        
        {showQR && (
          <div className="p-4 bg-white rounded-md">
            <QRCode value={shareableLink} size={200} />
          </div>
        )}
      </div>
    </div>
  );
} 