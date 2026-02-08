import { Terminal } from 'lucide-react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

export const Logo = ({ size = 'md', showText = true }: LogoProps) => {
  const iconSizes = {
    sm: 'w-4 h-4 sm:w-5 sm:h-5',
    md: 'w-6 h-6 sm:w-8 sm:h-8',
    lg: 'w-10 h-10 sm:w-12 sm:h-12',
  };

  const textSizes = {
    sm: 'text-base sm:text-lg',
    md: 'text-lg sm:text-xl lg:text-2xl',
    lg: 'text-2xl sm:text-3xl lg:text-4xl',
  };

  return (
    <div className="flex items-center gap-1.5 sm:gap-2">
      <div className="relative">
        <div className="absolute inset-0 bg-mono-400/20 blur-xl rounded-full" />
        <Terminal className={`${iconSizes[size]} text-mono-800 relative`} />
      </div>
      {showText && (
        <span className={`${textSizes[size]} font-bold font-mono text-mono-800 whitespace-nowrap`}>
          ShareRoom
        </span>
      )}
    </div>
  );
};
