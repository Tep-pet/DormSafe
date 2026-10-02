import React from 'react';
import { Link } from 'react-router-dom';

/**
 * DormSafe Brand Logo Component
 * Elegant, modern campus housing & safety brand mark.
 *
 * @param {'xs' | 'sm' | 'md' | 'lg' | 'xl'} [size='md']
 * @param {boolean} [showText=true]
 * @param {boolean} [showSubtitle=true]
 * @param {string} [subtitle='Ateneo de Davao']
 * @param {boolean} [asLink=true]
 * @param {string} [to='/']
 * @param {string} [className='']
 */
export function BrandLogo({
  size = 'md',
  showText = true,
  showSubtitle = true,
  subtitle = 'Ateneo de Davao',
  asLink = true,
  to = '/',
  className = '',
}) {
  const sizeMap = {
    xs: {
      box: 'h-7 w-7 rounded-xl',
      svgSize: 20,
      title: 'text-xs font-bold',
      subtitle: 'text-[8px] tracking-[0.14em]',
      gap: 'gap-2',
      beacon: 'h-2 w-2',
    },
    sm: {
      box: 'h-8 w-8 rounded-xl',
      svgSize: 24,
      title: 'text-sm font-bold',
      subtitle: 'text-[9px] tracking-[0.15em]',
      gap: 'gap-2.5',
      beacon: 'h-2 w-2',
    },
    md: {
      box: 'h-10 w-10 rounded-2xl',
      svgSize: 28,
      title: 'text-base font-extrabold',
      subtitle: 'text-[10px] tracking-[0.18em]',
      gap: 'gap-3',
      beacon: 'h-2.5 w-2.5',
    },
    lg: {
      box: 'h-12 w-12 rounded-2xl',
      svgSize: 34,
      title: 'text-xl font-extrabold',
      subtitle: 'text-xs tracking-[0.2em]',
      gap: 'gap-3.5',
      beacon: 'h-3 w-3',
    },
    xl: {
      box: 'h-14 w-14 rounded-3xl',
      svgSize: 40,
      title: 'text-2xl font-black',
      subtitle: 'text-xs tracking-[0.22em]',
      gap: 'gap-4',
      beacon: 'h-3.5 w-3.5',
    },
  };

  const s = sizeMap[size] || sizeMap.md;

  const content = (
    <div className={`group inline-flex items-center ${s.gap} ${className}`.trim()}>
      {/* Emblem / Modern Protective Dorm Icon */}
      <div
        className={`relative flex ${s.box} flex-shrink-0 items-center justify-center bg-gradient-to-br from-[#002C6C] via-[#0A3D8A] to-[#1E5FB8] text-white shadow-sm shadow-blue-950/20 ring-1 ring-white/20 transition-all duration-300 group-hover:scale-105 group-hover:shadow-md group-hover:shadow-blue-700/25`}
      >
        {/* Subtle glass reflection highlight */}
        <div className="absolute inset-0 rounded-[inherit] bg-gradient-to-t from-transparent via-white/10 to-white/25 pointer-events-none" />

        {/* Custom Vector Icon: Shield Crest + Dorm Gables + Archway + Star */}
        <svg
          width={s.svgSize}
          height={s.svgSize}
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="relative z-10 transition-transform duration-300 group-hover:scale-105"
        >
          {/* Outer Protective Shield */}
          <path
            d="M16 2L4 6.5V14.8C4 22.2 9.1 28.5 16 30.5C22.9 28.5 28 22.2 28 14.8V6.5L16 2Z"
            fill="url(#shieldGrad)"
            stroke="rgba(255, 255, 255, 0.5)"
            strokeWidth="1.4"
          />

          {/* Architectural Gables / Modern Dorm Roof */}
          <path
            d="M8.5 16.5L16 10.5L23.5 16.5"
            stroke="white"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Secure Archway / Doorway Entrance */}
          <path
            d="M12.5 18.5V23.5C12.5 24.3 13.2 25 14 25H18C18.8 25 19.5 24.3 19.5 23.5V18.5"
            stroke="white"
            strokeWidth="1.8"
            strokeLinecap="round"
          />

          {/* Ateneo Gold Star / Security Spark */}
          <path
            d="M16 4.8L16.7 6.6L18.6 6.8L17.2 8.1L17.6 9.9L16 9L14.4 9.9L14.8 8.1L13.4 6.8L15.3 6.6L16 4.8Z"
            fill="#FBBF24"
          />

          {/* Gradients */}
          <defs>
            <linearGradient id="shieldGrad" x1="4" y1="2" x2="28" y2="30.5" gradientUnits="userSpaceOnUse">
              <stop stopColor="rgba(255, 255, 255, 0.32)" />
              <stop offset="1" stopColor="rgba(255, 255, 255, 0.06)" />
            </linearGradient>
          </defs>
        </svg>

        {/* Gold Corner Beacon / Verified Sparkle */}
        <span
          className={`absolute -bottom-0.5 -right-0.5 ${s.beacon} rounded-full border-2 border-white bg-amber-400 shadow-xs ring-1 ring-blue-900/20`}
        />
      </div>

      {/* Typography Wordmark */}
      {showText && (
        <div className="flex flex-col select-none">
          <div className="flex items-center tracking-tight">
            <span className={`${s.title} text-slate-900 leading-none`}>
              Dorm
            </span>
            <span className={`${s.title} bg-gradient-to-r from-ateneo-blue via-blue-700 to-indigo-600 bg-clip-text text-transparent leading-none ml-0.5`}>
              Safe
            </span>
          </div>
          {showSubtitle && (
            <span className={`${s.subtitle} font-bold text-slate-400 uppercase mt-1 leading-none`}>
              {subtitle}
            </span>
          )}
        </div>
      )}
    </div>
  );

  if (asLink) {
    return (
      <Link to={to} className="inline-block transition-opacity hover:opacity-95">
        {content}
      </Link>
    );
  }

  return content;
}
