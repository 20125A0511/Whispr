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
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<'email' | 'otp'>('email');
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);
  const [isEmailButtonAnimating, setIsEmailButtonAnimating] = useState(false); // New state for click animation
  const [isOtpButtonAnimating, setIsOtpButtonAnimating] = useState(false); // New state for OTP button animation
  const [otpAnimationSuccess, setOtpAnimationSuccess] = useState<boolean | null>(null); // New state for OTP animation color/icon
  const { sendOtp, verifyOtp } = useAuth();

  const showNameField = signInMode === 'withName';
  const emailLabel = showNameField ? "Email or Phone Number" : "Email";

  const fieldsForOtpValid = showNameField ? name.trim() !== '' && email.trim() !== '' : email.trim() !== '';
  const canVerifyOtp = otp.length === 6 && !loading;

  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (loading || isEmailButtonAnimating || !fieldsForOtpValid) return;

    setIsEmailButtonAnimating(true);
    setLoading(true); // Keep for disabling inputs, global spinner will be hidden for this step
    
    setError(null);
    setNameError(null);
    setEmailError(null);
    setSuccessMessage(null);

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
        setLoading(false); // Reset loading state on error
        setIsEmailButtonAnimating(false); // Reset animation on error
      } else {
        // Success: sendOtp call returned. Button animation (1000ms) is running.
        // Wait for the button animation to be visually complete before transitioning.
        setTimeout(() => {
          setIsAnimatingOut(true); // Start fade out of current form
          setTimeout(() => { // Nested timeout for the fade-out duration
            setCurrentStep('otp');
            setIsAnimatingOut(false); // Stop fade out
            setLoading(false); // Release lock *after* transition and animation
            setIsEmailButtonAnimating(false); // Reset animation *after* transition
          }, 300); // Duration for the fade-out animation
        }, 1000); // Wait for button's own animation (1000ms) to complete before starting view transition
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred while sending the code');
      setLoading(false); // Reset loading state on catch
      setIsEmailButtonAnimating(false); // Reset animation on catch
    }
    // No finally block needed as states are reset in each path (success/error/catch)
  };

  const handleVerifyOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (loading || isOtpButtonAnimating || otp.length !== 6) return;

    setIsOtpButtonAnimating(true);
    setLoading(true); // Keep for disabling inputs
    setError(null);
    setOtpError(null);
    setSuccessMessage(null); // Clear previous success message

    if (!/^\d{6}$/.test(otp)) {
      setOtpAnimationSuccess(false);
      setOtpError('Please enter a valid 6-digit verification code');
      setTimeout(() => {
        setIsOtpButtonAnimating(false);
        setOtpAnimationSuccess(null);
        setLoading(false);
      }, 1000); // Animation duration
      return;
    }

    try {
      const nameToSend = showNameField && name.trim() ? name.trim() : undefined;
      const { error: verifyError } = await verifyOtp(email, otp, nameToSend);

      if (verifyError) {
        setOtpAnimationSuccess(false);
        if (verifyError.message === 'Token has expired or is invalid') {
          setOtpError('The code you entered is incorrect or has expired. Please try again or request a new code.');
        } else {
          setError(verifyError.message); // General error
        }
        setTimeout(() => {
          setIsOtpButtonAnimating(false);
          setOtpAnimationSuccess(null);
          setLoading(false);
        }, 1000); // Allow red animation to play
      } else {
        // SUCCESS PATH - COMPLETELY REWRITTEN
        
        // First, set initial animation state to green, and show success message
        setOtpAnimationSuccess(true);
        setSuccessMessage('Verification successful!');
        
        // IMPORTANT: For debugging or dev purposes, uncomment to simulate a slow API response
        // console.log("OTP Success - animation starting");
        
        // Now we'll use a chain of timeouts to control the sequence:
        
        // First timeout - just let the green filling animation and checkmark fully play out
        // The green animation takes about 1000ms to fill and the checkmark appears with a delay of ~900ms
        // So we need at least 1500ms for full visual effect
        setTimeout(() => {
          // IMPORTANT: For debugging, uncomment to see when this executes
          // console.log("Animation should now be fully visible");
          
          // At this point, the animation is complete and the button is fully green with checkmark
          // We'll trigger onSuccess after a short additional visual pause to ensure user sees the green state
          
          setTimeout(() => {
            // IMPORTANT: For debugging, uncomment to see when onSuccess is called
            // console.log("Calling onSuccess now");
            
            // NOW we call onSuccess which might navigate away from this component
            if (onSuccess) {
              onSuccess();
            }
            
            // Reset states with another small delay after calling onSuccess
            // This ensures that if a navigation occurs, it happens before these resets
            setTimeout(() => {
              // IMPORTANT: For debugging, uncomment to see when states are reset
              // console.log("Resetting component states");
              
              setEmail('');
              if(showNameField) setName('');
              setOtp('');
              setSuccessMessage(null);
              setIsOtpButtonAnimating(false);
              setOtpAnimationSuccess(null);
              setLoading(false);
            }, 300); // Small delay after onSuccess is called
            
          }, 500); // Additional pause after animation completes before calling onSuccess
          
        }, 1600); // Initial animation time (green fill + checkmark appearance)
        // END OF REWRITTEN SUCCESS PATH
      }
    } catch (err: unknown) {
      setOtpAnimationSuccess(false);
      setError(err instanceof Error ? err.message : 'An error occurred during verification');
      setTimeout(() => {
        setIsOtpButtonAnimating(false);
        setOtpAnimationSuccess(null);
        setLoading(false);
      }, 1000);
    }
  };

  const handleBackToEmail = () => {
    setIsAnimatingOut(true);
    setTimeout(() => {
      setCurrentStep('email');
      setError(null);
      setNameError(null);
      setEmailError(null);
      setOtpError(null);
      setSuccessMessage(null);
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

            {/* Green Fill Animation Button - Animation now based on isEmailButtonAnimating state */} 
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
                {/* Green Fill Layer - Animates based on isEmailButtonAnimating */}
                <div 
                  className={`absolute top-0 left-0 h-full bg-green-500 transition-all duration-1000 ease-in-out ${
                    isEmailButtonAnimating ? 'w-full' : 'w-0'
                  }`}
                />
                
                {/* Text - Centered, changes color based on isEmailButtonAnimating */}
                <div className="w-full h-full flex items-center justify-center relative z-10">
                  <span 
                    className={`text-sm font-medium transition-colors duration-200 ${
                      isEmailButtonAnimating ? 'text-white delay-300' : 'text-blue-600'
                    }`}
                  >
                    Send Verification Code
                  </span>
                </div>

                {/* Confirmation Icon - Appears based on isEmailButtonAnimating */}
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

        {currentStep === 'otp' && (
          <form onSubmit={handleVerifyOtp} className="space-y-5">
            <div className="text-center mb-4">
              <p className="text-gray-700 text-lg mb-1">
                {showNameField && name ? (
                  <>
                    Hi <span className="font-semibold">{name}</span>, we've sent a 6-digit code to
                  </>
                ) : (
                  "We've sent a 6-digit code to"
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
              isLoading={loading && !isOtpButtonAnimating}
            />
            
            {/* New Animated OTP Verification Button */}
            {otp.length === 6 && (
              <div
                className={`w-full h-12 mt-3 rounded-lg transition-shadow duration-300 group relative overflow-hidden border ${
                  !isOtpButtonAnimating && !loading ? 'cursor-pointer hover:shadow-md bg-gray-100 border-gray-300' : 'cursor-default bg-gray-50 border-gray-200'
                }`}
                onClick={handleVerifyOtp}
                role="button"
                tabIndex={!isOtpButtonAnimating && !loading ? 0 : -1}
                onKeyPress={(e) => { if (!isOtpButtonAnimating && !loading && (e.key === 'Enter' || e.key === ' ')) handleVerifyOtp(); }}
                aria-label="Verify & Continue"
                aria-disabled={isOtpButtonAnimating || loading || otp.length !== 6}
              >
                {/* Fill Layer - Animates based on isOtpButtonAnimating and otpAnimationSuccess */}
                <div
                  className={`absolute top-0 left-0 h-full transition-all duration-1000 ease-in-out ${
                    isOtpButtonAnimating ? 'w-full' : 'w-0'
                  } ${
                    otpAnimationSuccess === true ? 'bg-green-500' : otpAnimationSuccess === false ? 'bg-red-500' : 'bg-transparent'
                  }`}
                />
                
                {/* Text - Centered, changes color based on animation state */}
                <div className="w-full h-full flex items-center justify-center relative z-10">
                  <span
                    className={`text-sm font-medium transition-colors duration-200 ${
                      isOtpButtonAnimating ? 'text-white delay-300' : 'text-blue-600'
                    }`}
                  >
                    Verify & Continue
                  </span>
                </div>

                {/* Confirmation/Error Icon - Appears based on animation state and success/failure */}
                <div
                  className={`absolute right-3 top-1/2 -translate-y-1/2 transform transition-opacity duration-300 ease-in-out ${
                    isOtpButtonAnimating ? 'opacity-100 delay-[900ms]' : 'opacity-0'
                  }`}
                >
                   {otpAnimationSuccess === true && <FaCheckCircle size={22} className="text-white" />}
                   {otpAnimationSuccess === false && <FaTimesCircle size={22} className="text-white" />}
                </div>
              </div>
            )}
            
            {successMessage && !error && !otpError && (
              <p className="text-sm text-green-600 text-center font-medium mt-2">{successMessage}</p>
            )}
            
            <div className="text-center">
              <button
                type="button"
                onClick={handleBackToEmail}
                className="text-sm text-blue-600 hover:text-blue-800 hover:underline font-medium"
                disabled={loading}
              >
                Change details or resend code
              </button>
            </div>
          </form>
        )}
      </div>

      {error && !nameError && !emailError && !otpError && (
        <div className="mt-3 bg-red-50 text-red-700 p-3 rounded-md text-sm font-medium border border-red-200">
          {error}
        </div>
      )}
      
      {loading && currentStep !== 'email' && !isOtpButtonAnimating && (
        <div className="text-center py-4">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-200 border-t-blue-600"></div>
          <p className="text-sm text-gray-600 mt-2">
            {'Verifying code...'}
          </p>
        </div>
      )}
    </div>
  );
} 