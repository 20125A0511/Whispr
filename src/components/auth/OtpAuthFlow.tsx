import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/context/AuthProvider';

interface OtpAuthFlowProps {
  onSuccess?: () => void; // Optional callback on successful verification
}

export default function OtpAuthFlow({ onSuccess }: OtpAuthFlowProps) {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<'email' | 'otp'>('email');
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);
  const { sendOtp, verifyOtp } = useAuth();

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const { error: sendError } = await sendOtp(email);
      if (sendError) {
        setError(sendError.message);
      } else {
        setIsAnimatingOut(true);
        setTimeout(() => {
          setSuccessMessage(
            `A 6-digit code was sent to ${email}. Check your inbox (and spam) and enter it below.`
          );
          setCurrentStep('otp');
          setIsAnimatingOut(false);
        }, 300); // Duration of fade-out animation
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred while sending the code');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!/^\d{6}$/.test(otp)) {
      setError('Please enter a valid 6-digit verification code');
      setLoading(false);
      return;
    }

    try {
      const { error: verifyError } = await verifyOtp(email, otp);
      if (verifyError) {
        if (verifyError.message === 'Token has expired or is invalid') {
          setError('The code you entered is incorrect or has expired. Please double-check or request a new code.');
        } else {
          setError(verifyError.message);
        }
      } else {
        setSuccessMessage('Success! Redirecting...');
        setTimeout(() => {
          setEmail('');
          setOtp('');
          setCurrentStep('email');
          setSuccessMessage(null);
          if (onSuccess) onSuccess();
        }, 1500);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred during verification');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToEmail = () => {
    setIsAnimatingOut(true);
    setTimeout(() => {
      setCurrentStep('email');
      setError(null);
      setSuccessMessage(null);
      // setOtp(''); // Keep OTP if user just wants to edit email?
      setIsAnimatingOut(false);
    }, 300);
  }

  return (
    <div className="w-full max-w-sm space-y-4">
      <div className={`transition-opacity duration-300 ease-out ${isAnimatingOut ? 'opacity-0' : 'opacity-100'}`}>
        {currentStep === 'email' && (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div>
              <label htmlFor="email-trynow" className="block text-sm font-medium text-gray-700 mb-1">
                Enter your email to start
              </label>
              <Input
                id="email-trynow"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-2.5 border-gray-200 placeholder-gray-400 text-base focus:border-gray-400 focus:ring-0 focus:shadow-[0_0_0_2px_rgba(59,130,246,0.5)] rounded-lg shadow-sm transition-colors duration-150 ease-in-out"
              />
            </div>
            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg" disabled={loading}>
              {loading ? 'Sending Code...' : 'Send Code'}
            </Button>
          </form>
        )}

        {currentStep === 'otp' && (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div>
              <label htmlFor="otp-trynow" className="block text-sm font-medium text-gray-700 mb-1">
                Verification Code
              </label>
              <Input
                id="otp-trynow"
                type="password"
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="[0-9]*"
                maxLength={6}
                placeholder="6-digit code"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                required
                className="w-full text-center text-lg tracking-widest font-mono px-4 py-2.5 border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-lg shadow-sm"
              />
              {successMessage && !error && (
                <p className="text-xs text-green-600 mt-1.5 text-center">{successMessage}</p>
              )}
              {!successMessage && (
                <p className="text-xs text-gray-500 mt-1.5 text-center">
                  Enter the 6-digit code sent to <strong>{email}</strong>
                </p>
              )}
            </div>
            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg" disabled={loading}>
              {loading ? 'Verifying...' : 'Verify & Continue'}
            </Button>
            <div className="text-center">
              <button
                type="button"
                onClick={handleBackToEmail}
                className="text-sm text-blue-600 hover:underline"
              >
                Change email or resend code
              </button>
            </div>
          </form>
        )}
      </div>

      {error && (
        <div className="mt-3 bg-red-50 text-red-700 p-3 rounded-md text-sm">
          {error}
        </div>
      )}
    </div>
  );
} 