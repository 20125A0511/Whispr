import Image from 'next/image';
import Link from 'next/link';

interface LogoProps {
  width?: number;
  height?: number;
  className?: string;
  linkTo?: string;
}

export default function Logo({ width = 120, height = 40, className = '', linkTo = '/' }: LogoProps) {
  const logoContent = (
    <div className={`flex items-center ${className}`}>
      <Image 
        src="/logo_whispr.png" 
        alt="Whispr Logo" 
        width={width} 
        height={height}
        priority
        className="object-contain"
      />
    </div>
  );

  if (linkTo) {
    return (
      <Link href={linkTo}>
        {logoContent}
      </Link>
    );
  }

  return logoContent;
} 