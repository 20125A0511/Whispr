import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { FloatingLabelInput } from '@/components/ui/FloatingLabelInput';
import { useAuth } from '@/context/AuthProvider';
import { IoClose } from 'react-icons/io5';
import { FaCheckCircle, FaTimesCircle } from 'react-icons/fa';

interface OtpAuthFlowProps {
  onSuccess?: () => void; // Optional callback on successful verification
  onClose?: () => void; // For closing the modal
  signInMode?: 'withName' | 'emailOnly'; // New prop
}

export default function OtpAuthFlow({ 
  onSuccess, 
  onClose, 
  signInMode = 'withName' // Default to withName if not provided
}: OtpAuthFlowProps) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<'email' | 'otp'>('email');
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);
  const [isEmailButtonAnimating, setIsEmailButtonAnimating] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<'verifying' | 'success' | 'error' | null>(null);

  const { sendOtp, verifyOtp } = useAuth();

  const showNameField = signInMode === 'withName';
  const emailLabel = showNameField ? "Email or Phone Number" : "Email";

  const fieldsForOtpValid = showNameField ? name.trim() !== '' && email.trim() !== '' : email.trim() !== '';

  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (loading || isEmailButtonAnimating || !fieldsForOtpValid) return;

    setIsEmailButtonAnimating(true);
    setLoading(true); 
    
    setError(null);
    setNameError(null);
    setEmailError(null);

    if (showNameField && !name.trim()) {
      setNameError('Please enter your name');
      setLoading(false);
      setIsEmailButtonAnimating(false);
      return;
    }
    if (!email.trim()) {
      setEmailError('Please enter your email');
      setLoading(false);
      setIsEmailButtonAnimating(false);
      return;
    }

    try {
      const nameToSend = showNameField && name.trim() ? name.trim() : undefined;
      const { error: sendError } = await sendOtp(email, nameToSend);

      if (sendError) {
        if (sendError.message.toLowerCase().includes('email')) {
          setEmailError(sendError.message);
        } else {
          setError(sendError.message);
        }
        setLoading(false);
        setIsEmailButtonAnimating(false); 
      } else {
        setTimeout(() => {
          setIsAnimatingOut(true); 
          setTimeout(() => { 
            setCurrentStep('otp');
            setVerificationStatus(null);
            setIsAnimatingOut(false); 
            setLoading(false); 
            setIsEmailButtonAnimating(false); 
          }, 300); 
        }, 1000); 
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred while sending the code');
      setLoading(false); 
      setIsEmailButtonAnimating(false); 
    }
  };

  const handleVerifyOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (loading || otp.length !== 6 || verificationStatus) return;

    console.log(`[${new Date().toISOString()}] handleVerifyOtp START (New Flow)`);
    
    // Client-side format check first
    if (!/^\d{6}$/.test(otp)) {
      console.log(`[${new Date().toISOString()}] Invalid OTP format (client-side).`);
      setOtpError('Please enter a valid 6-digit verification code.');
      setVerificationStatus('error'); 
      // No setLoading(true) needed here as we are not proceeding to forced display
      return;
    }

    setLoading(true); // Disable inputs
    setVerificationStatus('verifying'); // Show "Verifying OTP..." card
    setError(null); // Clear previous general errors
    setOtpError(null); // Clear previous OTP errors

    const forcedVerifyingDisplayDuration = 3000;
    console.log(`[${new Date().toISOString()}] Starting FORCED ${forcedVerifyingDisplayDuration}ms display of 'verifying' card.`);

    setTimeout(async () => {
      console.log(`[${new Date().toISOString()}] FORCED ${forcedVerifyingDisplayDuration}ms 'verifying' display FINISHED. Now calling verifyOtp API...`);
      
      try {
        const nameToSend = showNameField && name.trim() ? name.trim() : undefined;
        const { error: verifyError } = await verifyOtp(email, otp, nameToSend);
        console.log(`[${new Date().toISOString()}] verifyOtp API call returned. Error:`, verifyError);

        if (verifyError) {
          console.log(`[${new Date().toISOString()}] OTP VERIFY API ERROR:`, verifyError.message);
          setOtpError(
            verifyError.message === 'Token has expired or is invalid'
              ? 'The code you entered is incorrect or has expired. Please try again or request a new code.'
              : verifyError.message
          );
          setVerificationStatus('error');
          setLoading(false); // Re-enable form for retry
        } else {
          console.log(`[${new Date().toISOString()}] OTP VERIFY API SUCCESS. Setting verificationStatus to 'success'.`);
          setVerificationStatus('success');
          
          const successCardDisplayDuration = 2000; // Display success card for 2 seconds
          console.log(`[${new Date().toISOString()}] Starting ${successCardDisplayDuration}ms display for 'success' card.`);

          setTimeout(() => {
            console.log(`[${new Date().toISOString()}] ${successCardDisplayDuration}ms SUCCESS card display FINISHED. Calling onSuccess.`);
            if (onSuccess) {
              onSuccess(); 
              console.log(`[${new Date().toISOString()}] onSuccess CALLED.`);
            } else {
              console.log(`[${new Date().toISOString()}] onSuccess was NOT defined.`);
            }
            
            console.log(`[${new Date().toISOString()}] Starting state cleanup post-success.`);
            setEmail('');
            if(showNameField) setName('');
            setOtp('');
            setVerificationStatus(null); // Hide card
            setLoading(false); // Ensure form is re-enabled
            setError(null);
            setOtpError(null);
            console.log(`[${new Date().toISOString()}] State cleanup post-success FINISHED.`);
          }, successCardDisplayDuration);
        }
      } catch (err: unknown) {
        console.error(`[${new Date().toISOString()}] UNEXPECTED ERROR during verifyOtp API call or subsequent logic:`, err);
        setError(err instanceof Error ? err.message : 'An unexpected error occurred during verification process.');
        setVerificationStatus('error');
        setLoading(false); // Re-enable form for retry
      }
    }, forcedVerifyingDisplayDuration);
  };
  
  const handleRetryOtp = () => {
    setVerificationStatus(null);
    setOtp('');
    setOtpError(null);
    setError(null);
    setLoading(false);
  };

  const handleBackToEmail = () => {
    setIsAnimatingOut(true);
    setTimeout(() => {
      setCurrentStep('email');
      setError(null);
      setNameError(null);
      setEmailError(null);
      setOtpError(null);
      setVerificationStatus(null);
      setIsAnimatingOut(false);
    }, 300);
  }

  return (
    <div className="w-full max-w-sm space-y-4">
      {onClose && (
        <div className="text-right -mb-2">
          <button
            onClick={onClose}
            className="p-1 text-gray-500 hover:text-gray-700"
            aria-label="Close"
          >
            <IoClose size={24} />
          </button>
        </div>
      )}
    
      <div className="mb-6 text-center">
        <h2 className="text-3xl font-semibold text-gray-800 tracking-tight">
          {currentStep === 'email' ? (showNameField ? 'Sign Up / Sign In' : 'Sign In') : 'Verification'}
        </h2>
      </div>
      
      <div className={`transition-opacity duration-300 ease-out ${isAnimatingOut ? 'opacity-0' : 'opacity-100'}`}>
        {currentStep === 'email' && (
          <form onSubmit={handleSendOtp} className="space-y-5">
            {showNameField && (
              <FloatingLabelInput
                id="name-trynow"
                type="text"
                label="Your Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                error={nameError || undefined}
                autoComplete="name"
                disabled={loading}
              />
            )}
            
            <FloatingLabelInput
              id="email-trynow"
              type="email"
              label={emailLabel}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              error={emailError || undefined}
              autoComplete="email"
              disabled={loading}
            />
            
            <button type="submit" className="hidden" disabled={loading || !fieldsForOtpValid || isEmailButtonAnimating}></button>

            {fieldsForOtpValid && (
              <div
                className={`w-full h-12 mt-3 rounded-lg bg-gray-100 transition-shadow duration-300 group relative overflow-hidden border border-gray-300 ${
                  !isEmailButtonAnimating && !loading ? 'cursor-pointer hover:shadow-md' : 'cursor-default'
                }`}
                onClick={handleSendOtp}
                role="button"
                tabIndex={!isEmailButtonAnimating && !loading ? 0 : -1}
                onKeyPress={(e) => { if (!isEmailButtonAnimating && !loading && (e.key === 'Enter' || e.key === ' ')) handleSendOtp(); }}
                aria-label="Send Verification Code"
                aria-disabled={isEmailButtonAnimating || loading}
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
                    Send Verification Code
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
          </form>
        )}

        {currentStep === 'otp' && !verificationStatus && (
          <form onSubmit={handleVerifyOtp} className="space-y-5">
            <div className="text-center mb-4">
              <p className="text-gray-700 text-lg mb-1">
                {showNameField && name ? (
                  <>
                    Hi <span className="font-semibold">{name}</span>, we&apos;ve sent a 6-digit code to
                  </>
                ) : (
                  "We&apos;ve sent a 6-digit code to"
                )}
                <br className="sm:hidden" /> <span className="font-medium text-gray-800 block sm:inline">{email}</span>.
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Please enter it below. Check your inbox (and spam folder).
              </p>
            </div>
            
            <FloatingLabelInput
              id="otp-trynow"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]*"
              maxLength={6}
              label="Verification Code"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
              required
              className="text-center tracking-widest font-mono"
              error={otpError || undefined}
              showArrow={false}
              disabled={loading}
              isLoading={false}
            />
            
            {otp.length === 6 && (
              <Button 
                type="submit" 
                className="w-full h-12 mt-3"
                disabled={loading || !!verificationStatus}
              >
                Verify & Continue
              </Button>
            )}
            
            <div className="text-center">
              <button
                type="button"
                onClick={handleBackToEmail}
                className="text-sm text-blue-600 hover:text-blue-800 hover:underline font-medium"
                disabled={loading || !!verificationStatus}
              >
                Change details or resend code
              </button>
            </div>
          </form>
        )}

        {currentStep === 'otp' && verificationStatus && (
          <div className="w-full p-6 mt-4 text-center bg-white rounded-lg shadow-xl border border-gray-200 animate-fadeIn">
            {verificationStatus === 'verifying' && (
              <>
                <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-gray-300 border-t-blue-600 mb-4"></div>
                <p className="text-lg font-semibold text-gray-700">Verifying OTP</p>
                <p className="text-sm text-gray-500">Please wait, we're checking your code...</p>
              </>
            )}
            {verificationStatus === 'success' && (
              <>
                <FaCheckCircle size={40} className="text-green-500 mx-auto mb-3 animate-scaleUp" />
                <p className="text-lg font-semibold text-green-600">Verification Successful!</p>
                <p className="text-sm text-gray-500">Taking you to your destination...</p>
              </>
            )}
            {verificationStatus === 'error' && (
              <>
                <FaTimesCircle size={40} className="text-red-500 mx-auto mb-3 animate-scaleUp" />
                <p className="text-lg font-semibold text-red-600">Verification Failed</p>
                <p className="text-sm text-gray-500 mb-4 whitespace-pre-wrap">
                  {otpError || error || 'An unknown error occurred.'}
                </p>
                <Button onClick={handleRetryOtp} className="w-full h-11">
                  Re-enter OTP
                </Button>
              </>
            )}
          </div>
        )}
      </div>

      {error && !nameError && !emailError && !otpError && !verificationStatus && (
        <div className="mt-3 bg-red-50 text-red-700 p-3 rounded-md text-sm font-medium border border-red-200">
          {error}
        </div>
      )}
    </div>
  );
}
