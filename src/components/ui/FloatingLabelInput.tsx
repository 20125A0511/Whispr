'use client';

import { useState, InputHTMLAttributes, forwardRef, ReactNode } from 'react';
import { twMerge } from 'tailwind-merge';
import { IoIosArrowForward } from 'react-icons/io';

interface FloatingLabelInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  showArrow?: boolean;
  onArrowClick?: (() => void) | undefined; // Explicitly allow undefined
  rightIcon?: ReactNode;
  isLoading?: boolean; // To show loading state on arrow
}

const FloatingLabelInput = forwardRef<HTMLInputElement, FloatingLabelInputProps>(
  ({ label, className, error, showArrow, onArrowClick, rightIcon, isLoading, ...props }, ref) => {
    const [isFocused, setIsFocused] = useState(false);
    // Ensure props.value is treated as a string for length check, even if it's a number
    const hasValue = props.value !== undefined && String(props.value).length > 0;
    const isActive = isFocused || hasValue;

    const isArrowClickable = !!onArrowClick && !isLoading;

    return (
      <div className="relative mb-4">
        <div
          className={twMerge(
            "relative border rounded-3xl transition-colors duration-200 ease-in-out", // Color transition for border
            props.disabled ? "bg-gray-100" : "bg-white",
            error ? "border-red-500" : isFocused ? "border-blue-500" : "border-gray-300",
            "overflow-hidden shadow-sm h-16 flex items-center" // Fixed height for container
          )}
        >
          <label
            htmlFor={props.id}
            className={twMerge(
              "absolute left-4 pointer-events-none transition-all duration-500",
              "text-gray-500",
              isActive
                ? "transform -translate-y-3 scale-80 top-2.5 text-sm"
                : "transform translate-y-0 scale-100 top-1/2 -mt-2.5 text-base", // Vertically centered then adjusted up
              isFocused && isActive && !props.disabled ? "text-blue-600" : "text-gray-500",
              props.disabled && isActive ? "text-gray-400" : "",
              props.disabled && !isActive ? "text-gray-400" : "text-gray-500"
            )}
            style={{
              transitionTimingFunction: 'cubic-bezier(0.25, 0.1, 0.25, 1.0)', // Standard smooth easing
            }}
          >
            {label}
          </label>
          <input
            ref={ref}
            id={props.id}
            className={twMerge(
              "block w-full h-full pt-5 pb-2 px-4 text-lg font-normal appearance-none focus:outline-none",
              rightIcon || showArrow ? "pr-12" : "",
              "bg-transparent z-10 relative",
              props.disabled ? "text-gray-500 cursor-not-allowed" : "text-gray-900",
              className
            )}
            placeholder="" // Placeholder is handled by the animated label
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            {...props}
          />
          
          {(rightIcon || showArrow) && (
            <div 
              className={twMerge(
                "absolute right-3 top-1/2 transform -translate-y-1/2",
                isArrowClickable ? 'cursor-pointer' : 'cursor-default' 
              )}
              onClick={isArrowClickable ? onArrowClick : undefined}
            >
              {isLoading ? (
                <div className="w-7 h-7 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-gray-300 border-t-blue-600"></div>
                </div>
              ) : rightIcon ? rightIcon : (showArrow && 
                <div className={twMerge(
                  "rounded-full p-1.5 flex items-center justify-center text-white",
                  isArrowClickable ? "bg-blue-500 hover:bg-blue-600" : "bg-gray-300"
                )}>
                  <IoIosArrowForward size={20} />
                </div>
              )}
            </div>
          )}
        </div>
        {error && <p className="text-red-600 text-xs mt-1.5 font-medium ml-4">{error}</p>}
      </div>
    );
  }
);

FloatingLabelInput.displayName = 'FloatingLabelInput';

export { FloatingLabelInput }; 