'use client';

import { useState, useRef } from 'react';
import QRCode from 'react-qr-code';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { generateShareableLink } from '@/utils/chatUtils';
import { FiCopy, FiCheck, FiCode, FiChevronUp, FiLink } from 'react-icons/fi';

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
    <div className="rounded-lg p-4 border border-gray-200 bg-white">
      <h3 className="text-base font-medium text-gray-800 mb-3 flex items-center gap-2">
        <FiLink className="text-indigo-500" />
        Share This Chat
      </h3>
      
      <div className="mb-4">
        <p className="text-sm text-gray-600 mb-3 leading-relaxed">
          Send this link to anyone you want to chat with. Note that this is a temporary chat - the conversation 
          will be deleted when the session ends.
        </p>
        
        <div className="flex">
          <Input
            ref={linkRef}
            type="text"
            value={shareableLink}
            readOnly
            className="flex-1 rounded-r-none font-mono text-xs"
          />
          <Button 
            onClick={handleCopyLink}
            className="rounded-l-none"
            variant={copied ? 'default' : 'outline'}
          >
            {copied ? (
              <span className="flex items-center gap-1.5">
                <FiCheck className="w-4 h-4" />
                <span>Copied</span>
              </span>
            ) : (
              <span className="flex items-center gap-1.5">
                <FiCopy className="w-4 h-4" />
                <span>Copy</span>
              </span>
            )}
          </Button>
        </div>
      </div>
      
      <div className="flex flex-col items-center">
        <Button 
          onClick={toggleQRCode}
          variant="secondary"
          size="sm"
          className="mb-4 w-full flex items-center justify-center gap-1.5"
        >
          {showQR ? (
            <>
              <FiChevronUp className="w-4 h-4" />
              <span>Hide QR Code</span>
            </>
          ) : (
            <>
              <FiCode className="w-4 h-4" />
              <span>Show QR Code</span>
            </>
          )}
        </Button>
        
        {showQR && (
          <div className="p-4 bg-white rounded-md border border-gray-200 animate-fadeIn">
            <QRCode value={shareableLink} size={200} level="M" />
          </div>
        )}
      </div>
    </div>
  );
} 