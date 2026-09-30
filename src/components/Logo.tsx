import React from 'react';

interface LogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showTagline?: boolean;
  className?: string;
  badgeOnly?: boolean;
}

export const Logo: React.FC<LogoProps> = ({
  size = 'md',
  showTagline = false,
  className = '',
  badgeOnly = false,
}) => {
  // Dimensions for image based on size
  const imageSizes = {
    xs: 'w-7 h-7',
    sm: 'w-9 h-9',
    md: 'w-12 h-12',
    lg: 'w-20 h-20 sm:w-24 sm:h-24',
    xl: 'w-32 h-32 sm:w-40 sm:h-40',
  };

  const textSizes = {
    xs: 'text-base',
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-3xl sm:text-4xl',
    xl: 'text-5xl sm:text-6xl',
  };

  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      <div className={`relative shrink-0 ${imageSizes[size]} rounded-xl overflow-hidden shadow-sm flex items-center justify-center bg-[#181C24] border border-[#28303F]`}>
        <img
          src="/suspecto_logo.png"
          alt="Suspecto Logo"
          className="w-full h-full object-contain p-0.5"
          loading="eager"
        />
      </div>

      {!badgeOnly && (
        <div className="flex flex-col justify-center leading-none">
          <div className={`font-display font-black tracking-tight text-[#E6E8EC] ${textSizes[size]}`}>
            <span>SUSPECT</span>
            <span className="text-[#FFB800]">O</span>
          </div>
          {showTagline && (
            <div className="flex items-center gap-1.5 text-[10px] sm:text-xs font-mono font-bold tracking-widest uppercase mt-0.5">
              <span className="text-[#FFB800]">DRAW.</span>
              <span className="text-[#9AA0AD]">BLUFF.</span>
              <span className="text-[#E6E8EC]">EXPOSE.</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
