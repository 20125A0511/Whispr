import React from 'react';
import { cn } from '@/utils/cn';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  isError?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, isError, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'flex h-10 w-full rounded-md border bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 transition-all',
          isError
            ? 'border-red-300 focus-visible:ring-red-500/40 placeholder:text-red-400 text-red-600'
            : 'border-gray-200 focus-visible:ring-indigo-500/40 focus-visible:border-indigo-300 placeholder:text-gray-400 text-gray-800',
          props.disabled && 'cursor-not-allowed opacity-60 bg-gray-50',
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);

Input.displayName = 'Input';

export { Input }; 