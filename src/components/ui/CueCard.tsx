import React, { useEffect, useRef, useState } from 'react';
import { cn } from '@/utils/cn';

interface CueCardProps {
  icon?: React.ReactNode; // e.g., an SVG icon
  title: string;
  description: string;
  className?: string;
  animationDelay?: string; // e.g., 'delay-200ms' for Tailwind
}

export default function CueCard({ 
  icon, 
  title, 
  description, 
  className, 
  animationDelay 
}: CueCardProps) {
  const [isVisible, setIsVisible] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.unobserve(entry.target); // Stop observing once visible
          }
        });
      },
      { threshold: 0.1 } // Trigger when 10% of the element is visible
    );

    const currentCardRef = cardRef.current;
    if (currentCardRef) {
      observer.observe(currentCardRef);
    }

    return () => {
      if (currentCardRef) {
        observer.unobserve(currentCardRef);
      }
    };
  }, []);

  return (
    <div
      ref={cardRef}
      className={cn(
        'bg-neutral-50/80 dark:bg-neutral-900/80 backdrop-blur-2xl p-6 sm:p-8 rounded-3xl shadow-xl dark:shadow-neutral-800/50 transform transition-all duration-700 ease-out border border-white/20 dark:border-neutral-700/30',
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8',
        animationDelay, // Apply Tailwind delay class if provided
        className
      )}
    >
      {icon && <div className="mb-5 text-4xl sm:text-5xl">{icon}</div>}
      <h3 className="text-xl sm:text-2xl font-semibold text-neutral-900 dark:text-neutral-50 mb-3">{title}</h3>
      <p className="text-neutral-600 dark:text-neutral-400 text-sm sm:text-base leading-relaxed">{description}</p>
    </div>
  );
} 